import process from "node:process";
import { authenticate } from "../shopify.server";
import { getShippingQuotes } from "../utils/easyPostShipping";
import {
  applyReturnShippingBufferToQuotes,
  getReturnShippingBufferPercentage,
} from "../utils/returnShippingBuffer";

function toAmount(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildTestRate(direction, referencePrefix, baseAmount, overrides = {}) {
  const isForward = direction === "customer_to_store";
  const carrier = overrides?.carrier || (isForward ? "USPS" : "UPS");
  const service = overrides?.service || (isForward ? "Priority" : "Ground");
  const amount = toAmount(overrides?.amount, baseAmount);

  return {
    id: `test-rate-${direction}-${referencePrefix}`,
    carrier,
    service,
    amount,
    amountDisplay: amount.toFixed(2),
    currency: overrides?.currency || "USD",
    deliveryDays: overrides?.deliveryDays ?? (isForward ? 2 : 4),
    deliveryDate: overrides?.deliveryDate || null,
    deliveryDateGuaranteed: Boolean(overrides?.deliveryDateGuaranteed),
    shipmentId: `test-shipment-${direction}-${referencePrefix}`,
  };
}

function buildTestShippingQuotes({ parcel = {}, referencePrefix = "booking" }) {
  const weight = Number(parcel?.weight) || 0;
  const forwardAmount = Number((8.5 + (weight * 0.12)).toFixed(2));
  const returnAmount = Number((9.75 + (weight * 0.12)).toFixed(2));

  return {
    customerToStore: {
      shipmentId: `test-shipment-customer-to-store-${referencePrefix}`,
      rates: [
        buildTestRate("customer_to_store", referencePrefix, forwardAmount),
        buildTestRate("customer_to_store-express", referencePrefix, forwardAmount + 5.5, {
          carrier: "UPS",
          service: "2nd Day Air",
        }),
      ],
    },
    storeToCustomer: {
      shipmentId: `test-shipment-store-to-customer-${referencePrefix}`,
      rates: [
        buildTestRate("store_to_customer", referencePrefix, returnAmount),
        buildTestRate("store_to_customer-express", referencePrefix, returnAmount + 6.25, {
          carrier: "USPS",
          service: "Priority Express",
        }),
      ],
    },
    storeAddress: {
      name: "Sneaker Cleaning Manager Test Store",
      company: "Sneaker Cleaning Manager",
      street1: "123 Test Shipping Lane",
      street2: "Suite 4",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "US",
      phone: "2125550100",
    },
    isTestData: true,
  };
}

export const action = async ({ request }) => {
  try {
    await authenticate.public.appProxy(request);
    const body = await request.json();
    const returnShippingBufferPercentage = await getReturnShippingBufferPercentage();

    const rawQuotes = process.env.EASYPOST_API_KEY
      ? await getShippingQuotes({
        customerAddress: body.customerAddress,
        parcel: body.parcel,
        referencePrefix: body.referencePrefix || "booking",
      })
      : buildTestShippingQuotes({
        parcel: body.parcel,
        referencePrefix: body.referencePrefix || "booking",
      });

    const quotes = applyReturnShippingBufferToQuotes(rawQuotes, returnShippingBufferPercentage);

    return new Response(
      JSON.stringify({
        success: true,
        quotes,
        returnShippingBufferPercentage,
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
