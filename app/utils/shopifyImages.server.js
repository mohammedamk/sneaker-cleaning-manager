const STAGED_UPLOADS_URL_QUERY = `
mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets {
      resourceUrl
      url
      parameters {
        name
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;

const FILE_CREATE_MUTATION = `
mutation fileCreate($files: [FileCreateInput!]!) {
  fileCreate(files: $files) {
    files {
      id
      fileStatus
      preview {
        image {
          url
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;

const GET_FILES_QUERY = `
query getFiles($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on MediaImage {
      id
      image {
        url
      }
    }
  }
}
`;

function normalizeImageArray(images = [], imageMap = {}) {
  return (images || [])
    .map((id) => {
      if (typeof id === "string" && id.startsWith("http")) {
        return id;
      }

      if (typeof id === "string" && id.startsWith("gid://shopify/")) {
        return imageMap[id] || null;
      }

      return null;
    })
    .filter(Boolean);
}

function normalizeObjectId(value) {
  if (!value) return value;

  if (typeof value === "string") {
    return value;
  }

  if (typeof value?.toHexString === "function") {
    return value.toHexString();
  }

  if (typeof value?.toString === "function") {
    const stringValue = value.toString();
    if (stringValue && stringValue !== "[object Object]") {
      return stringValue;
    }
  }

  const bytes = value?.buffer?.data
    || (Array.isArray(value?.buffer) ? value.buffer : null)
    || (Array.isArray(value?.id?.buffer) ? value.id.buffer : null)
    || value?.id?.buffer?.data;

  if (Array.isArray(bytes) && bytes.length === 12) {
    return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return value;
}

export async function uploadImageToShopify(
  admin,
  base64Data,
  {
    mimeType = "image/jpeg",
    filename = "sneaker.jpg",
    alt = "Sneaker image",
  } = {},
) {
  try {
    const stagedRes = await admin.graphql(STAGED_UPLOADS_URL_QUERY, {
      variables: {
        input: [
          {
            filename,
            mimeType,
            resource: "IMAGE",
            httpMethod: "POST",
          },
        ],
      },
    });

    const stagedData = await stagedRes.json();

    if (stagedData?.data?.stagedUploadsCreate?.userErrors?.length) {
      console.error(
        "Staged upload error:",
        stagedData.data.stagedUploadsCreate.userErrors,
      );
      return null;
    }

    const target = stagedData?.data?.stagedUploadsCreate?.stagedTargets?.[0];

    if (!target) {
      console.error("No staged target received");
      return null;
    }

    if (typeof base64Data !== "string") {
      console.error("Invalid base64 data:", base64Data);
      return null;
    }

    const formData = new FormData();
    target.parameters.forEach(({ name, value }) => {
      formData.append(name, value);
    });

    const base64Content = base64Data.includes("base64,")
      ? base64Data.split("base64,")[1]
      : base64Data;

    const buffer = Buffer.from(base64Content, "base64");
    const blob = new Blob([buffer], { type: mimeType });

    formData.append("file", blob, filename);

    const uploadRes = await fetch(target.url, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      console.error("Upload failed:", uploadRes.statusText);
      return null;
    }

    const fileRes = await admin.graphql(FILE_CREATE_MUTATION, {
      variables: {
        files: [
          {
            alt,
            contentType: "IMAGE",
            originalSource: target.resourceUrl,
          },
        ],
      },
    });

    const fileData = await fileRes.json();

    if (fileData?.data?.fileCreate?.userErrors?.length) {
      console.error("File create error:", fileData.data.fileCreate.userErrors);
      return null;
    }

    const createdFile = fileData?.data?.fileCreate?.files?.[0];

    if (!createdFile?.id) {
      console.error("No file ID returned:", createdFile);
      return null;
    }

    return {
      id: createdFile.id,
      status: createdFile.fileStatus,
      url: createdFile.preview?.image?.url || null,
    };
  } catch (error) {
    console.error("Upload exception:", error);
    return null;
  }
}

export async function getImageUrls(admin, fileIds = []) {
  try {
    if (!fileIds.length) return {};

    const res = await admin.graphql(GET_FILES_QUERY, {
      variables: { ids: fileIds },
    });

    const data = await res.json();
    const map = {};

    if (data?.data?.nodes) {
      data.data.nodes.forEach((node) => {
        if (node?.id && node?.image?.url) {
          map[node.id] = node.image.url;
        }
      });
    }

    return map;
  } catch (error) {
    console.error("Error fetching image URLs:", error);
    return {};
  }
}

export function collectBookingImageIds(booking) {
  const imageIds = [];

  (booking?.sneakers || []).forEach((sneaker) => {
    ["images", "cleanedImages"].forEach((field) => {
      (sneaker?.[field] || []).forEach((id) => {
        if (typeof id === "string" && id.startsWith("gid://shopify/")) {
          imageIds.push(id);
        }
      });
    });
  });

  return [...new Set(imageIds)];
}

export function normalizeBookingImages(booking, imageMap = {}) {
  const bookingObject = booking.toObject();
  const updatedSneakers = (bookingObject.sneakers || []).map((sneaker) => ({
    ...sneaker,
    _id: normalizeObjectId(sneaker._id),
    images: normalizeImageArray(sneaker.images, imageMap),
    cleanedImages: normalizeImageArray(sneaker.cleanedImages, imageMap),
  }));

  return {
    ...bookingObject,
    _id: normalizeObjectId(bookingObject._id),
    sneakers: updatedSneakers,
  };
}
