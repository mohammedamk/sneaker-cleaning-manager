import { authenticate } from "../shopify.server";
import process from "node:process";
import BookingModel from "../MongoDB/models/Booking";
import { verifyAndBuySelectedRate } from "../utils/easyPostShipping";

const READY_FOR_SHIPMENT_STATUS = "Ready for Pickup / Shipment";
const TEST_STORE_ADDRESS = {
    name: "Sneaker Cleaning Manager Test Store",
    company: "Sneaker Cleaning Manager",
    street1: "123 Test Shipping Lane",
    street2: "Suite 4",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "US",
    phone: "2125550100",
};

function buildTestStoreToCustomerLabel(bookingId, selectedRate = {}, customerAddress = {}) {
    const trackingSuffix = bookingId.slice(-6).toUpperCase();

    return {
        shipmentId: `test-shipment-storeToCustomer-${bookingId}`,
        trackingCode: `TEST-OUT-${trackingSuffix}`,
        selectedRate: {
            id: selectedRate.id || `test-rate-storeToCustomer-${bookingId}`,
            carrier: selectedRate.carrier || "UPS",
            service: selectedRate.service || "Ground",
            amount: Number(selectedRate.amount || 0),
            amountDisplay: Number(selectedRate.amount || 0).toFixed(2),
            currency: selectedRate.currency || "USD",
            deliveryDays: selectedRate.deliveryDays || null,
            deliveryDate: selectedRate.deliveryDate || null,
            deliveryDateGuaranteed: Boolean(selectedRate.deliveryDateGuaranteed),
            shipmentId: `test-shipment-storeToCustomer-${bookingId}`,
        },
        postageLabel: {
            label_url: `https://example.com/test-labels/${bookingId}/storeToCustomer.pdf`,
            label_pdf_url: `https://example.com/test-labels/${bookingId}/storeToCustomer.pdf`,
            label_zpl_url: null,
            label_epl2_url: null,
            label_file_type: "application/pdf",
            label_size: "4x6",
            label_date: new Date().toISOString(),
            label_resolution: 300,
            recipient: {
                name: customerAddress?.name || "Test Customer",
                street1: customerAddress?.street1 || "123 Test Street",
                city: customerAddress?.city || "Brooklyn",
                state: customerAddress?.state || "NY",
                zip: customerAddress?.zip || "11201",
            },
        },
    };
}

function buildTestStoreToCustomerPurchase({ bookingId, selectedRate, customerAddress }) {
    return {
        status: "purchased",
        label: buildTestStoreToCustomerLabel(bookingId, selectedRate, customerAddress),
        storeAddress: TEST_STORE_ADDRESS,
        isTestData: true,
    };
}

function getBookingShippingSelection(booking) {
    return booking?.shipping || booking?.fullPayload?.shippingSelection || null;
}

export const action = async ({ request }) => {
    try {
        await authenticate.admin(request);
        const requestBody = await request.json();
        const bookingId = requestBody?.bookingId;

        const booking = await BookingModel.findById(bookingId);

        if (!booking) {
            return Response.json({ success: false, message: "Booking not found." }, { status: 404 });
        }

        const shippingSelection = getBookingShippingSelection(booking);

        if (booking.handoffMethod !== "shipping" || !shippingSelection) {
            return Response.json({ success: false, message: "This booking does not require shipping." }, { status: 400 });
        }

        if (booking.status !== READY_FOR_SHIPMENT_STATUS) {
            return Response.json({
                success: false,
                message: `Shipping can be purchased only when status is "${READY_FOR_SHIPMENT_STATUS}".`,
            }, { status: 400 });
        }

        if (!shippingSelection.selectedReturnRate) {
            return Response.json({
                success: false,
                message: "No store-to-customer shipping rate is available for this booking.",
            }, { status: 400 });
        }

        if (shippingSelection.labels?.storeToCustomer?.shipmentId) {
            return Response.json({
                success: false,
                message: "Store-to-customer shipping has already been purchased for this booking.",
            }, { status: 400 });
        }

        const shippingContact = {
            ...shippingSelection.customerAddress,
            email: shippingSelection.customerAddress?.email || booking.email || booking.guestInfo?.email || "",
        };

        const purchaseResult = process.env.EASYPOST_API_KEY
            ? await verifyAndBuySelectedRate({
                customerAddress: shippingContact,
                parcel: shippingSelection.parcel,
                selectedRate: shippingSelection.selectedReturnRate,
                direction: "store_to_customer",
                referencePrefix: booking._id.toString(),
            })
            : buildTestStoreToCustomerPurchase({
                bookingId: booking._id.toString(),
                selectedRate: shippingSelection.selectedReturnRate,
                customerAddress: shippingContact,
            });

        // in case the selected return shipping rate changed
        // if (purchaseResult.status !== "purchased") {
        //     return Response.json({
        //         success: false,
        //         message: "The selected return shipping rate changed and was not purchased.",
        //     }, { status: 409 });
        // }

        booking.shipping = {
            ...shippingSelection,
            purchaseStatus: shippingSelection.labels?.customerToStore ? "purchased" : "store_to_customer_purchased",
            labels: {
                ...(shippingSelection.labels || {}),
                storeToCustomer: purchaseResult.label,
            },
            storeAddress: purchaseResult.storeAddress,
            isTestData: Boolean(shippingSelection.isTestData || purchaseResult.isTestData),
            returnPurchasedAt: new Date(),
        };
        await booking.save();

        return Response.json({
            success: true,
            message: "Store-to-customer shipping purchased successfully.",
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: error.message || "Unable to buy return shipping.",
        }, { status: 500 });

    }
};
