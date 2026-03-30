import { authenticate } from "../shopify.server";
import { getShippingQuotes } from "../utils/easyPostShipping";

export const action = async ({ request }) => {
  try {
    await authenticate.public.appProxy(request);
    const body = await request.json();

    const quotes = await getShippingQuotes({
      customerAddress: body.customerAddress,
      parcel: body.parcel,
      referencePrefix: body.referencePrefix || "booking",
    });

    return new Response(
      JSON.stringify({
        success: true,
        quotes,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in api.shipping.rates:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Unable to fetch shipping rates",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
