import { authenticate } from "../shopify.server";
import TempBookingModel from "../MongoDB/models/TempBooking";

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

const SERVICE_TIERS = [
    { id: 'standard', label: 'Standard Cleaning', price: 25 },
    { id: 'deep', label: 'Deep Cleaning', price: 45 },
    { id: 'extreme', label: 'Extreme Cleaning', price: 70 },
];

const ADD_ONS = [
    { id: 'deoxidation', label: 'Deoxidation', price: 15 },
    { id: 'deodorization', label: 'Deodorization', price: 10 },
    { id: 'waterproofing', label: 'Waterproofing', price: 12 },
    { id: 'sole_cleaning', label: 'Sole Cleaning', price: 10 },
    { id: 'lace_replacement', label: 'Lace Replacement', price: 8 },
];

function getTierPrice(tierId) {
    return SERVICE_TIERS.find((t) => t.id === tierId)?.price || 0;
}

function getAddonPrice(addonId) {
    return ADD_ONS.find((a) => a.id === addonId)?.price || 0;
}

export const action = async ({ request }) => {
    try {
        const { admin } = await authenticate.public.appProxy(request);
        const body = await request.json();

        console.log("Saving temporary booking data for post-payment processing");

        // storing the raw payload (with base64 images) in temporary storage
        const tempBooking = new TempBookingModel({
            payload: body
        });
        await tempBooking.save();

        const lineItems = [];
        if (body.sneakers && Array.isArray(body.sneakers)) {
            for (let i = 0; i < body.sneakers.length; i++) {
                const sneakerData = body.sneakers[i];

                // calculating price for this sneaker
                const service = body.services ? body.services[sneakerData.id || sneakerData._id] : null;
                const tierPrice = getTierPrice(service?.tier);
                const addonsPrice = (service?.addOns || []).reduce((sum, id) => sum + getAddonPrice(id), 0);
                const itemTotal = tierPrice + addonsPrice;

                lineItems.push({
                    title: `Sneaker Cleaning - ${sneakerData.nickname || 'Pair #' + (i + 1)}`,
                    originalUnitPrice: itemTotal,
                    quantity: 1,
                    customAttributes: [
                        { key: "Nickname", value: sneakerData.nickname || 'N/A' },
                        { key: "Brand", value: sneakerData.brand || 'N/A' }
                    ]
                });
            }
        }

        const draftOrderInput = {
            lineItems,
            customAttributes: [
                { key: "temp_booking_id", value: tempBooking._id.toString() },
                { key: "is_sneaker_booking", value: "true" }
            ],
            useCustomerDefaultAddress: true
        };

        if (body.customerID) {
            const customerIdStr = String(body.customerID);
            draftOrderInput.purchasingEntity.customerId = customerIdStr.startsWith("gid://")
                ? customerIdStr
                : `gid://shopify/Customer/${customerIdStr}`;
        } else if (body.guestInfo?.email) {
            draftOrderInput.email = body.guestInfo.email;
        }

        const draftRes = await admin.graphql(DRAFT_ORDER_CREATE_MUTATION, {
            variables: { input: draftOrderInput }
        });

        const draftData = await draftRes.json();

        if (draftData?.data?.draftOrderCreate?.userErrors?.length) {
            console.error("Draft order errors:", draftData.data.draftOrderCreate.userErrors);
            throw new Error(draftData.data.draftOrderCreate.userErrors[0].message);
        }

        const draftOrder = draftData.data.draftOrderCreate.draftOrder;

        return new Response(
            JSON.stringify({
                success: true,
                message: "Draft order created successfully",
                invoiceUrl: draftOrder.invoiceUrl,
                draftOrderId: draftOrder.id
            })
        );
    } catch (error) {
        console.log("error occured on api.create.booking", error);

        return new Response(
            JSON.stringify({
                success: false,
                message: "Error occured while creating checkout",
                error: error.message,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
};