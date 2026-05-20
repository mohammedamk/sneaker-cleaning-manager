import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import sendEmail from "../utils/sendEmail";

const DRAFT_ORDER_CREATE_MUTATION = `
mutation draftOrderCreate($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) {
    draftOrder {
      id
      invoiceUrl
    }
    userErrors {
      field
      message
    }
  }
}
`;

export const action = async ({ request }) => {
    if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const { admin } = await authenticate.admin(request);
        const { bookingId, chargeItemName, chargeAmount, customEmailContent } = await request.json();

        if (!bookingId || !chargeItemName || chargeAmount === undefined) {
            return new Response(
                JSON.stringify({ success: false, message: "Missing required fields: bookingId, chargeItemName, chargeAmount" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Fetch the booking to get customer email
        const booking = await BookingModel.findById(bookingId).lean();
        if (!booking) {
            return new Response(
                JSON.stringify({ success: false, message: "Booking not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const customerEmail = booking.email || booking.guestInfo?.email;
        const customerName = booking.name || booking.guestInfo?.name || "Valued Customer";

        if (!customerEmail) {
            return new Response(
                JSON.stringify({ success: false, message: "Customer email not found in booking" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Create draft order with the charge
        const lineItems = [
            {
                title: chargeItemName,
                originalUnitPrice: Number(chargeAmount),
                quantity: 1,
                customAttributes: [
                    { key: "charge_type", value: "additional_carrier_charge" },
                    { key: "booking_id", value: bookingId }
                ]
            }
        ];

        const draftOrderInput = {
            lineItems,
            customAttributes: [
                { key: "booking_id", value: bookingId },
                { key: "charge_type", value: "additional_carrier_charge" }
            ]
        };

        const response = await admin.graphql(DRAFT_ORDER_CREATE_MUTATION, {
            variables: { input: draftOrderInput }
        });

        const result = await response.json();

        if (result.data?.draftOrderCreate?.userErrors?.length > 0) {
            const errorMessage = result.data.draftOrderCreate.userErrors.map(e => `${e.field}: ${e.message}`).join("; ");
            return new Response(
                JSON.stringify({ success: false, message: `Failed to create draft order: ${errorMessage}` }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const invoiceUrl = result.data?.draftOrderCreate?.draftOrder?.invoiceUrl;
        if (!invoiceUrl) {
            return new Response(
                JSON.stringify({ success: false, message: "Failed to generate invoice URL" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Send email to customer with invoice
        const emailHTML = `
            <p>Hello ${customerName},</p>
            <p>We have an additional charge for your booking related to carrier adjustments.</p>
            <p><strong>Charge Details:</strong></p>
            <ul>
                <li><strong>Item:</strong> ${chargeItemName}</li>
                <li><strong>Amount:</strong> $${Number(chargeAmount).toFixed(2)}</li>
            </ul>
            ${customEmailContent ? `<p><strong>Message:</strong></p><p>${customEmailContent}</p>` : ''}
            <p><a href="${invoiceUrl}" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:4px;">View Invoice & Pay</a></p>
            <p>Thank you for your business!</p>
        `;

        const emailSubject = `Additional Charge - ${chargeItemName}`;
        await sendEmail(customerEmail, emailSubject, emailHTML);

        return new Response(
            JSON.stringify({
                success: true,
                message: "Charge created and email sent successfully",
                invoiceUrl,
                draftOrderId: result.data?.draftOrderCreate?.draftOrder?.id
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error creating charge:", error);
        return new Response(
            JSON.stringify({ success: false, message: "Internal server error", error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
