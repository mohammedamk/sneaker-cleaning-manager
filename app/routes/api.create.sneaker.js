import { authenticate } from "../shopify.server";
import SneakerModel from "../MongoDB/models/Sneaker";


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

/* -------------------- IMAGE UPLOAD FUNCTION -------------------- */

async function uploadImageToShopify(
  admin,
  base64Data,
  mimeType = "image/jpeg",
  filename = "sneaker.jpg"
) {
  try {
    // 1. getting staged upload target
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
        stagedData.data.stagedUploadsCreate.userErrors
      );
      return null;
    }

    const target =
      stagedData?.data?.stagedUploadsCreate?.stagedTargets?.[0];

    if (!target) {
      console.error("No staged target received");
      return null;
    }

    // 2. preparing form data
    const formData = new FormData();

    target.parameters.forEach(({ name, value }) => {
      formData.append(name, value);
    });

    if (typeof base64Data !== "string") {
      console.error("Invalid base64 data:", base64Data);
      return null;
    }

    const base64Content = base64Data.includes("base64,")
      ? base64Data.split("base64,")[1]
      : base64Data;

    const buffer = Buffer.from(base64Content, "base64");
    const blob = new Blob([buffer], { type: mimeType });

    formData.append("file", blob, filename);

    // 3. uploading to Shopify (S3)
    const uploadRes = await fetch(target.url, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      console.error("Upload failed:", uploadRes.statusText);
      return null;
    }

    // 4. creating file in Shopify
    const fileRes = await admin.graphql(FILE_CREATE_MUTATION, {
      variables: {
        files: [
          {
            alt: "Sneaker image",
            contentType: "IMAGE",
            originalSource: target.resourceUrl,
          },
        ],
      },
    });

    const fileData = await fileRes.json();

    console.log("fileCreate response:", JSON.stringify(fileData, null, 2));

    if (fileData?.data?.fileCreate?.userErrors?.length) {
      console.error(
        "File create error:",
        fileData.data.fileCreate.userErrors
      );
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
    };
  } catch (err) {
    console.error("Upload exception:", err);
    return null;
  }
}


export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);
    const body = await request.json();

    const {
      customerID,
      nickname,
      brand,
      model,
      colorway,
      size,
      sizeUnit,
      history,
      notes,
      images = [],
    } = body;

    // console.log("Incoming body:", body);

    if (!customerID) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Customer ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    /* -------------------- UPLOAD IMAGES -------------------- */

    const uploadedImageIds = [];

    if (Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const b64OrGid = images[i];

        if (!b64OrGid) continue;

        if (typeof b64OrGid === "string" && b64OrGid.startsWith("gid://shopify/")) {
          uploadedImageIds.push(b64OrGid);
          continue;
        }

        const result = await uploadImageToShopify(
          admin,
          b64OrGid,
          "image/jpeg",
          `sneaker-${Date.now()}-${i}.jpg`
        );

        if (result?.id) {
          uploadedImageIds.push(result.id);
        } else {
          console.error("Image upload failed at index:", i);
        }
      }
    }

    console.log("uploadedImageIds:", uploadedImageIds);


    const newSneaker = new SneakerModel({
      customerID: `gid://shopify/Customer/${customerID}`,
      nickname,
      brand,
      model,
      colorway,
      size,
      sizeUnit,
      history,
      notes,
      images: uploadedImageIds,
      status: "Received",
      submittedAt: new Date(),
    });

    await newSneaker.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sneaker added with Shopify file IDs",
        sneaker: newSneaker,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in api.create.sneaker:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
