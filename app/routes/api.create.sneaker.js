import { authenticate } from "../shopify.server";
import SneakerModel from "../MongoDB/models/Sneaker";
import { uploadImageToShopify } from "../utils/shopifyImages.server";


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

        const result = await uploadImageToShopify(admin, b64OrGid, {
          filename: `sneaker-${Date.now()}-${i}.jpg`,
          alt: nickname || "Sneaker image",
        });

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
