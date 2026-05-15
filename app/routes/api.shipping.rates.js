import process from "node:process";
import { authenticate } from "../shopify.server";
import { getShippingQuotes } from "../utils/easyPostShipping";
import {
  getReturnShippingBufferPercentage,
  getShippingCreditPerPair,
} from "../utils/returnShippingBuffer";

const MAX_SNEAKER_PAIRS = 10;
const SNEAKER_WEIGHT_LB = 4;
const OUNCES_PER_POUND = 16;
const SHIPPING_BOX_LIBRARY = {
  1: { length: 17, width: 11, height: 8, boxWeightLb: 1 },
  2: { length: 15, width: 12, height: 10, boxWeightLb: 1.5 },
  3: { length: 14, width: 14, height: 14, boxWeightLb: 1.5 },
  4: { length: 14, width: 14, height: 14, boxWeightLb: 1.5 },
  5: { length: 20, width: 20, height: 12, boxWeightLb: 3 },
  6: { length: 20, width: 20, height: 12, boxWeightLb: 3 },
  7: { length: 18, width: 18, height: 18, boxWeightLb: 3 },
  8: { length: 18, width: 18, height: 18, boxWeightLb: 3 },
  9: { length: 24, width: 18, height: 18, boxWeightLb: 3.5 },
  10: { length: 24, width: 18, height: 18, boxWeightLb: 3.5 },
};

function toAmount(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function roundCurrencyAmount(value) {
  return Number(Number(value || 0).toFixed(2));
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

function getRecommendedParcelForQuantity(quantity) {
  const box = SHIPPING_BOX_LIBRARY[quantity];

  if (!box) {
    return null;
  }

  const totalWeightLb = (quantity * SNEAKER_WEIGHT_LB) + box.boxWeightLb;

  return {
    length: String(box.length),
    width: String(box.width),
    height: String(box.height),
    weight: String(totalWeightLb * OUNCES_PER_POUND),
  };
}

function getUpsellQuantities(quantity) {
  if (quantity >= MAX_SNEAKER_PAIRS) {
    return [];
  }

  const quantities = [];

  for (
    let nextQuantity = quantity + 1;
    nextQuantity <= MAX_SNEAKER_PAIRS;
    nextQuantity += 1
  ) {
    quantities.push(nextQuantity);
  }

  return quantities;
}

function isValidRate(rate) {
  return Boolean(
    rate
    && rate.carrier
    && rate.service
    && Number.isFinite(Number(rate.amount))
    && Number(rate.amount) > 0,
  );
}

function selectLowestValidRate(rates = []) {
  return rates
    .filter(isValidRate)
    .sort((left, right) => Number(left.amount) - Number(right.amount))[0] || null;
}

function formatEstimatedDelivery(rate) {
  if (rate?.deliveryDate) {
    return rate.deliveryDate;
  }

  if (rate?.deliveryDays) {
    return `${rate.deliveryDays} business day${rate.deliveryDays > 1 ? "s" : ""}`;
  }

  return "Transit time unavailable";
}

function calculateCustomerFacingShipping({
  forwardRate,
  returnRate,
  sneakerQuantity,
  shippingCreditPerPair,
  bufferPercentage,
}) {
  const forwardAmount = Number(forwardRate?.amount || 0);
  const returnAmount = Number(returnRate?.amount || 0);
  const subtotal = forwardAmount + returnAmount;
  const bufferedTotal = subtotal * (1 + (Number(bufferPercentage || 0) / 100));
  const shippingCredit = Number(sneakerQuantity || 0) * Number(shippingCreditPerPair || 0);
  const finalTotal = Math.max(roundCurrencyAmount(bufferedTotal - shippingCredit), 0);

  return {
    forwardAmount: roundCurrencyAmount(forwardAmount),
    returnAmount: roundCurrencyAmount(returnAmount),
    subtotal: roundCurrencyAmount(subtotal),
    bufferedTotal: roundCurrencyAmount(bufferedTotal),
    shippingCredit: roundCurrencyAmount(shippingCredit),
    customerFacingTotal: finalTotal,
  };
}

async function fetchQuotes({ customerAddress, parcel, referencePrefix }) {
  if (process.env.EASYPOST_API_KEY) {
    return getShippingQuotes({
      customerAddress,
      parcel,
      referencePrefix,
    });
  }

  return buildTestShippingQuotes({
    parcel,
    referencePrefix,
  });
}

async function buildQuoteSummary({
  customerAddress,
  parcel,
  referencePrefix,
  sneakerQuantity,
  returnShippingBufferPercentage,
  shippingCreditPerPair,
}) {
  const quotes = await fetchQuotes({ customerAddress, parcel, referencePrefix });
  const selectedForwardRate = selectLowestValidRate(quotes?.customerToStore?.rates);
  const selectedReturnRate = selectLowestValidRate(quotes?.storeToCustomer?.rates);

  if (!selectedForwardRate || !selectedReturnRate) {
    return {
      quotes,
      selectedForwardRate: null,
      selectedReturnRate: null,
      pricing: null,
    };
  }

  return {
    quotes,
    selectedForwardRate,
    selectedReturnRate,
    pricing: {
      ...calculateCustomerFacingShipping({
        forwardRate: selectedForwardRate,
        returnRate: selectedReturnRate,
        sneakerQuantity,
        shippingCreditPerPair,
        bufferPercentage: returnShippingBufferPercentage,
      }),
      carrierServiceSummary: {
        forward: `${selectedForwardRate.carrier} ${selectedForwardRate.service}`,
        return: `${selectedReturnRate.carrier} ${selectedReturnRate.service}`,
      },
      estimatedDelivery: {
        forward: formatEstimatedDelivery(selectedForwardRate),
        return: formatEstimatedDelivery(selectedReturnRate),
      },
    },
  };
}

export const action = async ({ request }) => {
  try {
    await authenticate.public.appProxy(request);
    const body = await request.json();
    const returnShippingBufferPercentage = await getReturnShippingBufferPercentage();
    const shippingCreditPerPair = await getShippingCreditPerPair();
    const sneakerQuantity = Number(body.sneakerQuantity);

    const currentSummary = await buildQuoteSummary({
      customerAddress: body.customerAddress,
      parcel: body.parcel,
      referencePrefix: body.referencePrefix || "booking",
      sneakerQuantity,
      returnShippingBufferPercentage,
      shippingCreditPerPair,
    });

    const upsellCandidates = await Promise.all(
      getUpsellQuantities(sneakerQuantity).map(async (quantity) => {
        const parcel = getRecommendedParcelForQuantity(quantity);

        if (!parcel) {
          return null;
        }

        const summary = await buildQuoteSummary({
          customerAddress: body.customerAddress,
          parcel,
          referencePrefix: `${body.referencePrefix || "booking"}-${quantity}-pairs`,
          sneakerQuantity: quantity,
          returnShippingBufferPercentage,
          shippingCreditPerPair,
        });

        if (!summary?.pricing) {
          return null;
        }
        console.log("currentSummary?.pricing?.customerFacingTotal", currentSummary?.pricing?.customerFacingTotal);
        console.log("summary.pricing.customerFacingTotal", summary.pricing.customerFacingTotal);
        const savings = roundCurrencyAmount(
          Number(currentSummary?.pricing?.customerFacingTotal || 0)
          - Number(summary.pricing.customerFacingTotal || 0),
        );

        console.log(`[Shipping Upsell] Quoted rates for ${quantity} pairs:`, {
          forwardAmount: summary.pricing.forwardAmount,
          returnAmount: summary.pricing.returnAmount,
          subtotal: summary.pricing.subtotal,
          bufferedTotal: summary.pricing.bufferedTotal,
          shippingCredit: summary.pricing.shippingCredit,
          customerFacingTotal: summary.pricing.customerFacingTotal,
          savings,
        });

        if (savings <= 0) {
          return null;
        }

        return {
          quantity,
          savings,
          customerFacingTotal: summary.pricing.customerFacingTotal,
        };
      }),
    );

    return new Response(
      JSON.stringify({
        success: true,
        quotes: currentSummary.quotes,
        selectedForwardRate: currentSummary.selectedForwardRate,
        selectedReturnRate: currentSummary.selectedReturnRate,
        pricing: currentSummary.pricing,
        upsellOptions: upsellCandidates.filter(Boolean),
        returnShippingBufferPercentage,
        shippingCreditPerPair,
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
