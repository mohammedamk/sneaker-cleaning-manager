import { authenticate } from "../shopify.server";
import SneakerModel from "../MongoDB/models/Sneaker";

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: "Sneaker ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const deletedSneaker = await SneakerModel.findByIdAndDelete(id);

    if (!deletedSneaker) {
      return new Response(JSON.stringify({ success: false, message: "Sneaker not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Sneaker deleted successfully" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in api.delete.sneaker:", error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
