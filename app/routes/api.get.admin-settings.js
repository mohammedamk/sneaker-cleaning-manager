import { getAllSettings } from "../utils/adminSettings.server.js";

export async function loader() {
    try {
        console.log("Fetching admin settings...");
        const settings = await getAllSettings();
        return new Response(JSON.stringify(settings), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.error("Error fetching admin settings:", error);
        return new Response(
            JSON.stringify({ success: false, message: "Error fetching admin settings" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
