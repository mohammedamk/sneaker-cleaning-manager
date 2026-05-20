import process from "node:process";
import { authenticate } from "../shopify.server";
import TempBookingModel from "../MongoDB/models/TempBooking";
import {
    getReturnShippingBufferPercentage,
    getShippingCreditPerPair,
} from "../utils/returnShippingBuffer.server";
import {
    getShippingInsuranceLineItem,
} from "../utils/shippingInsurance";
import { getShippingBoxLibrary, getCleaningTiers, getAddOns } from "../utils/adminSettings.server";

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

function getTierPrice(tierId, cleaningTiers) {
    return cleaningTiers.find((t) => t.id === tierId)?.price || 0;
}

function getAddonPrice(addonId, addOns) {
    return addOns.find((a) => a.id === addonId)?.price || 0;
}

function calculateCustomerFacingShippingAmount({
    forwardAmount = 0,
    returnAmount = 0,
    sneakerCount = 0,
    shippingCreditPerPair = 0,
    bufferPercentage = 0,
}) {
    const subtotal = Number(forwardAmount || 0) + Number(returnAmount || 0);
    const bufferedTotal = subtotal * (1 + (Number(bufferPercentage || 0) / 100));
    const shippingCredit = sneakerCount * Number(shippingCreditPerPair || 0);

    return Math.max(Number((bufferedTotal - shippingCredit).toFixed(2)), 0);
}

function getShippingLineItems(
    shippingSelection = {},
    eligibleSneakerCount = 0,
    shippingCreditPerPair = 0,
    returnShippingBufferPercentage = 0,
) {
    const lineItems = [];

    const forwardRate = shippingSelection?.selectedForwardRate;
    const returnRate = shippingSelection?.selectedReturnRate;
    const shippingCredit = eligibleSneakerCount * shippingCreditPerPair;
    const customerFacingAmount = calculateCustomerFacingShippingAmount({
        forwardAmount: forwardRate?.amount,
        returnAmount: returnRate?.amount,
        sneakerCount: eligibleSneakerCount,
        shippingCreditPerPair,
        bufferPercentage: returnShippingBufferPercentage,
    });

    if (forwardRate && returnRate && customerFacingAmount > 0) {
        lineItems.push({
            title: "Roundtrip Shipping",
            originalUnitPrice: customerFacingAmount,
            quantity: 1,
            customAttributes: [
                { key: "line_item_role", value: "booking_shipping" },
                { key: "booking_shipping", value: "true" },
                { key: "refund_exclude", value: "true" },
                { key: "shipping_direction", value: "roundtrip" },
                { key: "booking_shipping_direction", value: "customer_to_store,store_to_customer" },
                { key: "forward_shipping_carrier", value: forwardRate.carrier || "N/A" },
                { key: "forward_shipping_service", value: forwardRate.service || "N/A" },
                { key: "return_shipping_carrier", value: returnRate.carrier || "N/A" },
                { key: "return_shipping_service", value: returnRate.service || "N/A" },
                { key: "forward_shipping_amount", value: String(Number(forwardRate.amount || 0)) },
                { key: "return_shipping_amount", value: String(Number(returnRate.amount || 0)) },
                { key: "shipping_credit_amount", value: String(shippingCredit) },
                { key: "return_shipping_buffer_percentage", value: String(Number(returnShippingBufferPercentage || 0)) },
                { key: "customer_facing_shipping_amount", value: String(customerFacingAmount) },
            ]
        });
    }

    return lineItems;
}

function getInsuranceSelection(requestBody = {}) {
    if (requestBody?.handoffMethod !== "shipping") {
        return null;
    }

    return requestBody?.shippingSelection?.insurance || null;
}

export const action = async ({ request }) => {
    try {
        const { admin } = await authenticate.public.appProxy(request);
        const requestBody = await request.json();
        const shouldUseTestShipping = !process.env.EASYPOST_API_KEY;
        const shippingCreditPerPair = await getShippingCreditPerPair();
        const returnShippingBufferPercentage = await getReturnShippingBufferPercentage();
        const requestedInsuranceSelection = requestBody?.handoffMethod === "shipping" 
            ? requestBody?.shippingSelection?.insurance 
            : null;
        const body = {
            ...requestBody,
            shippingSelection: requestBody?.handoffMethod === "shipping" && requestBody?.shippingSelection
                ? {
                    ...requestBody.shippingSelection,
                    insurance: requestedInsuranceSelection ? {
                        enabled: Boolean(requestedInsuranceSelection.enabled),
                        coverageAmount: Number(requestedInsuranceSelection.coverageAmount || 0),
                        cost: Number(requestedInsuranceSelection.cost || 0),
                    } : null,
                    isTestData: shouldUseTestShipping || Boolean(requestBody.shippingSelection?.isTestData),
                }
                : requestBody?.shippingSelection,
        };

        const shippingBoxLibrary = await getShippingBoxLibrary();
        const cleaningTiers = await getCleaningTiers();
        const adminAddOns = await getAddOns();
        const maxSneakerPairs = shippingBoxLibrary?.reduce((max, box) => Math.max(max, box.sneakerQuantity || 0), 0) || 10;

        if (Array.isArray(body.sneakers) && body.sneakers.length > maxSneakerPairs) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: `A maximum of ${maxSneakerPairs} sneaker pairs is allowed per booking.`,
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

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
                const tierPrice = getTierPrice(service?.tier, cleaningTiers);
                const addonsPrice = (service?.addOns || []).reduce((sum, id) => sum + getAddonPrice(id, adminAddOns), 0);
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

        if (body.handoffMethod === "shipping") {
            console.log('\n[Backend Shipping Credit] Evaluating eligible sneakers for shipping credit...');
            const eligibleSneakerCount = (body.sneakers || []).reduce((count, sneaker, index) => {
                const service = body.services ? body.services[sneaker.id || sneaker._id] : null;
                const tier = cleaningTiers.find((t) => t.id === service?.tier);
                const isEligible = Boolean(tier?.shippingCredit);
                
                console.log(`[Backend Shipping Credit] Sneaker ${index + 1} (${sneaker.nickname || 'Unnamed'}): Tier '${tier?.label || service?.tier || 'None'}'. Eligible: ${isEligible}`);
                
                if (isEligible) {
                    return count + 1;
                }
                return count;
            }, 0);
            console.log(`[Backend Shipping Credit] Total Eligible Sneakers for Credit: ${eligibleSneakerCount}\n`);

            lineItems.push(
                ...getShippingLineItems(
                    body.shippingSelection,
                    eligibleSneakerCount,
                    shippingCreditPerPair,
                    returnShippingBufferPercentage,
                ),
            );

            const insuranceLineItem = getShippingInsuranceLineItem(
                body.shippingSelection?.insurance,
            );

            if (insuranceLineItem) {
                lineItems.push(insuranceLineItem);
            }
        }

        const draftOrderInput = {
            lineItems,
            customAttributes: [
                { key: "temp_booking_id", value: tempBooking._id.toString() },
                { key: "is_sneaker_booking", value: "true" },
                { key: "booking_handoff_method", value: body.handoffMethod || "dropoff" },
                { key: "has_booking_shipping", value: body.handoffMethod === "shipping" ? "true" : "false" },
                { key: "booking_shipping_insurance_enabled", value: body.shippingSelection?.insurance?.enabled ? "true" : "false" },
                { key: "booking_shipping_insurance_coverage_amount", value: String(Number(body.shippingSelection?.insurance?.coverageAmount || 0)) },
                { key: "booking_shipping_insurance_cost", value: String(Number(body.shippingSelection?.insurance?.cost || 0) * 2) },
            ],
            useCustomerDefaultAddress: true
        };

        if (body.customerID) {
            const customerIdStr = String(body.customerID);
            draftOrderInput.purchasingEntity = {
                customerId: customerIdStr.startsWith("gid://")
                    ? customerIdStr
                    : `gid://shopify/Customer/${customerIdStr}`
            };
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
                draftOrderId: draftOrder.id,
                shippingMode: shouldUseTestShipping ? "test" : "live",
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
