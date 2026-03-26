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
    }
    userErrors {
      field
      message
    }
  }
}
`;

async function uploadImageToShopify(admin, base64Data, mimeType = "image/jpeg", filename = "sneaker.jpg") {
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
      console.error("Staged upload error:", stagedData.data.stagedUploadsCreate.userErrors);
      return null;
    }

    const target = stagedData.data.stagedUploadsCreate.stagedTargets[0];

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
            alt: "Sneaker image",
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
    return {
      id: createdFile?.id,
      status: createdFile?.fileStatus,
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
    const { id, images, ...updateData } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: "Sneaker ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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
        }
      }
    }

    const finalUpdateData = {
      ...updateData,
      images: uploadedImageIds.length > 0 ? uploadedImageIds : updateData.images
    };

    // if images were provided (even empty array), here then updating them.
    if (Array.isArray(images)) {
      finalUpdateData.images = uploadedImageIds;
    }

    const updatedSneaker = await SneakerModel.findByIdAndUpdate(
      id,
      { $set: finalUpdateData },
      { new: true }
    );

    if (!updatedSneaker) {
      return new Response(JSON.stringify({ success: false, message: "Sneaker not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, sneaker: updatedSneaker }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in api.update.sneaker:", error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
