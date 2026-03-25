import { authenticate } from "../shopify.server";
import SneakerModel from "../MongoDB/models/Sneaker";

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);
    const body = await request.json();
    
    const { customerID, nickname, brand, model, colorway, size, sizeUnit, history, notes, images } = body;

    if (!customerID) {
      return new Response(JSON.stringify({ success: false, message: "Customer ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newSneaker = new SneakerModel({
      customerID,
      nickname,
      brand,
      model,
      colorway,
      size,
      sizeUnit,
      history,
      notes,
      images,
      status: 'Received', // Default status for new sneakers in rack
      submittedAt: new Date()
    });

    await newSneaker.save();

    return new Response(JSON.stringify({ success: true, message: "Sneaker added to rack", sneaker: newSneaker }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in api.create.sneaker:", error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
