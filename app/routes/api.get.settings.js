import { authenticate } from "../shopify.server";
import { getAllSettings } from "../utils/adminSettings.server.js";

export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);
    const settings = await getAllSettings();
    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to load settings." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
