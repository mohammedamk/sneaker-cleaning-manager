import { authenticate } from "../shopify.server";
import SneakerModel from "../MongoDB/models/Sneaker";

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.public.appProxy(request);
    
    // We expect customerID to be passed as a query param or we might be able to get it from somewhere else
    // But since this is an app proxy, we should verify the customer if possible.
    // For now, we'll follow the pattern of passing customerID or similar.
    const url = new URL(request.url);
    const customerID = url.searchParams.get("customerID");

    if (!customerID) {
      return new Response(JSON.stringify({ success: false, message: "Customer ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch unique sneakers for this customer. 
    // We might want to group by nickname/brand/model to show a "Rack" of their shoes.
    // For now, let's just get all sneakers they've ever registered.
    const sneakers = await SneakerModel.find({ customerID }).sort({ submittedAt: -1 });

    return new Response(JSON.stringify({ success: true, sneakers }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in api.get.sneakers:", error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
