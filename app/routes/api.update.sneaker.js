import { authenticate } from "../shopify.server";
import SneakerModel from "../MongoDB/models/Sneaker";
import { uploadImageToShopify } from "../utils/shopifyImages.server";

const FILE_DELETE_MUTATION = `
mutation fileDelete($fileIds: [ID!]!) {
  fileDelete(fileIds: $fileIds) {
    deletedFileIds
    userErrors {
      field
      message
      code
    }
  }
}
`;

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

    const existingSneaker = await SneakerModel.findById(id);

    if (!existingSneaker) {
      return new Response(JSON.stringify({ success: false, message: "Sneaker not found" }), {
        status: 404,
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

        const result = await uploadImageToShopify(admin, b64OrGid, {
          filename: `sneaker-${Date.now()}-${i}.jpg`,
          alt: existingSneaker.nickname || updateData.nickname || "Sneaker image",
        });

        if (result?.id) {
          uploadedImageIds.push(result.id);
        }
      }
    }

    const customerIdStr = String(updateData.customerID);

    const finalUpdateData = {
      ...updateData,
      customerID: customerIdStr.startsWith("gid://shopify/")
        ? customerIdStr
        : `gid://shopify/Customer/${customerIdStr}`,
      images: uploadedImageIds.length > 0 ? uploadedImageIds : updateData.images
    };
    // if images were provided (even empty array), here then updating them.
    if (Array.isArray(images)) {
      finalUpdateData.images = uploadedImageIds;
    }

    const existingImageIds = (existingSneaker.images || []).filter(
      (imageId) => typeof imageId === "string" && imageId.startsWith("gid://shopify/"),
    );

    const nextImageIds = (finalUpdateData.images || []).filter(
      (imageId) => typeof imageId === "string" && imageId.startsWith("gid://shopify/"),
    );

    const removedImageIds = existingImageIds.filter(
      (imageId) => !nextImageIds.includes(imageId),
    );

    const updatedSneaker = await SneakerModel.findByIdAndUpdate(id, { $set: finalUpdateData }, { new: true });

    if (removedImageIds.length > 0) {
      try {
        const response = await admin.graphql(FILE_DELETE_MUTATION, {
          variables: {
            fileIds: removedImageIds,
          },
        });

        const data = await response.json();

        if (data?.data?.fileDelete?.userErrors?.length) {
          console.error("Shopify file delete errors:", data.data.fileDelete.userErrors);
        }
      } catch (deleteError) {
        console.error("Error deleting removed sneaker images from Shopify:", deleteError);
      }
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
