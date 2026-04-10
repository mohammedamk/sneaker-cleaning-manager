import process from "node:process";
import EasyPostClient from "@easypost/api";

const SUPPORTED_CARRIERS = ["USPS", "UPS"];

const DEFAULT_STORE_ADDRESS = {
  name: "Sneaker Cleaning Manager",
  company: "Sneaker Cleaning Manager",
  street1: "123 Sneaker Lane",
  street2: "Suite 4",
  city: "New York",
  state: "NY",
  zip: "10001",
  country: "US",
  phone: "2125550100",
};

let easyPostClient = null;

function getEasyPostClient() {
  if (!process.env.EASYPOST_API_KEY) {
    throw new Error("EASYPOST_API_KEY is not configured");
  }

  if (!easyPostClient) {
    easyPostClient = new EasyPostClient(process.env.EASYPOST_API_KEY);
  }

  return easyPostClient;
}

function toTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAddress(address = {}) {
  return {
    name: toTrimmedString(address.name),
    company: toTrimmedString(address.company),
    street1: toTrimmedString(address.street1),
    street2: toTrimmedString(address.street2),
    city: toTrimmedString(address.city),
    state: toTrimmedString(address.state).toUpperCase(),
    zip: toTrimmedString(address.zip),
    country: toTrimmedString(address.country || "US").toUpperCase(),
    phone: toTrimmedString(address.phone),
    email: toTrimmedString(address.email),
  };
}

function normalizeParcel(parcel = {}) {
  return {
    length: Number(parcel.length),
    width: Number(parcel.width),
    height: Number(parcel.height),
    weight: Number(parcel.weight),
  };
}

export function getStoreAddress() {
  return normalizeAddress({
    name: process.env.STORE_SHIPPING_NAME || DEFAULT_STORE_ADDRESS.name,
    company: process.env.STORE_SHIPPING_COMPANY || DEFAULT_STORE_ADDRESS.company,
    street1: process.env.STORE_SHIPPING_STREET1 || DEFAULT_STORE_ADDRESS.street1,
    street2: process.env.STORE_SHIPPING_STREET2 || DEFAULT_STORE_ADDRESS.street2,
    city: process.env.STORE_SHIPPING_CITY || DEFAULT_STORE_ADDRESS.city,
    state: process.env.STORE_SHIPPING_STATE || DEFAULT_STORE_ADDRESS.state,
    zip: process.env.STORE_SHIPPING_ZIP || DEFAULT_STORE_ADDRESS.zip,
    country: process.env.STORE_SHIPPING_COUNTRY || DEFAULT_STORE_ADDRESS.country,
    phone: process.env.STORE_SHIPPING_PHONE || DEFAULT_STORE_ADDRESS.phone,
  });
}

export function validateShippingAddress(address = {}) {
  const normalized = normalizeAddress(address);
  const missingFields = ["name", "street1", "city", "state", "zip", "phone"].filter(
    (field) => !normalized[field],
  );

  if (missingFields.length) {
    throw new Error(`Missing shipping address fields: ${missingFields.join(", ")}`);
  }

  if (normalized.country !== "US") {
    throw new Error("Only US shipping addresses are currently supported");
  }

  return normalized;
}

export function validateParcel(parcel = {}) {
  const normalized = normalizeParcel(parcel);
  const invalidFields = Object.entries(normalized)
    .filter(([, value]) => !Number.isFinite(value) || value <= 0)
    .map(([field]) => field);

  if (invalidFields.length) {
    throw new Error(`Invalid parcel fields: ${invalidFields.join(", ")}`);
  }

  return normalized;
}

function mapRate(rate) {
  return {
    id: rate.id,
    carrier: rate.carrier,
    service: rate.service,
    amount: Number(rate.rate),
    amountDisplay: Number(rate.rate).toFixed(2),
    currency: rate.currency,
    deliveryDays: rate.delivery_days,
    deliveryDate: rate.delivery_date,
    deliveryDateGuaranteed: Boolean(rate.delivery_date_guaranteed),
    shipmentId: rate.shipment_id,
  };
}

function filterSupportedRates(rates = []) {
  return rates
    .filter((rate) => SUPPORTED_CARRIERS.includes(rate.carrier))
    .map(mapRate)
    .sort((left, right) => left.amount - right.amount);
}

async function createShipment({ fromAddress, toAddress, parcel, isReturn = false, reference }) {
  const client = getEasyPostClient();

  return client.Shipment.create({
    from_address: fromAddress,
    to_address: toAddress,
    parcel,
    is_return: isReturn,
    reference,
  });
}

function getShipmentConfigForDirection({
  normalizedCustomerAddress,
  normalizedParcel,
  storeAddress,
  direction,
  referencePrefix,
}) {
  if (direction === "customer_to_store") {
    return {
      fromAddress: normalizedCustomerAddress,
      toAddress: storeAddress,
      parcel: normalizedParcel,
      isReturn: false,
      reference: `${referencePrefix}-forward-purchase`,
    };
  }

  if (direction === "store_to_customer") {
    return {
      fromAddress: storeAddress,
      toAddress: normalizedCustomerAddress,
      parcel: normalizedParcel,
      isReturn: true,
      reference: `${referencePrefix}-return-purchase`,
    };
  }

  throw new Error(`Unsupported shipping direction: ${direction}`);
}

export async function getShippingQuotes({ customerAddress, parcel, referencePrefix = "booking" }) {
  const normalizedCustomerAddress = validateShippingAddress(customerAddress);
  const normalizedParcel = validateParcel(parcel);
  const storeAddress = getStoreAddress();

  const [forwardShipment, returnShipment] = await Promise.all([
    createShipment({
      fromAddress: normalizedCustomerAddress,
      toAddress: storeAddress,
      parcel: normalizedParcel,
      reference: `${referencePrefix}-forward`,
    }),
    createShipment({
      fromAddress: storeAddress,
      toAddress: normalizedCustomerAddress,
      parcel: normalizedParcel,
      isReturn: true,
      reference: `${referencePrefix}-return`,
    }),
  ]);

  return {
    customerToStore: {
      shipmentId: forwardShipment.id,
      rates: filterSupportedRates(forwardShipment.rates),
    },
    storeToCustomer: {
      shipmentId: returnShipment.id,
      rates: filterSupportedRates(returnShipment.rates),
    },
    storeAddress,
  };
}

function findMatchingRate(shipment, selectedRate = {}) {
  if (!shipment?.rates?.length) {
    return null;
  }

  const targetCarrier = toTrimmedString(selectedRate.carrier).toUpperCase();
  const targetService = toTrimmedString(selectedRate.service).toUpperCase();
  const targetCurrency = toTrimmedString(selectedRate.currency || "USD").toUpperCase();

  return shipment.rates.find((rate) => {
    return (
      toTrimmedString(rate.carrier).toUpperCase() === targetCarrier &&
      toTrimmedString(rate.service).toUpperCase() === targetService &&
      toTrimmedString(rate.currency).toUpperCase() === targetCurrency
    );
  });
}

function amountsMatch(leftAmount, rightAmount) {
  return Number(leftAmount).toFixed(2) === Number(rightAmount).toFixed(2);
}

function selectedRateSupportsCurrentAmount(selectedRate, currentRateAmount, direction) {
  if (direction === "store_to_customer") {
    const maxPurchaseAmount = Number(selectedRate?.maxPurchaseAmount);

    if (Number.isFinite(maxPurchaseAmount) && maxPurchaseAmount > 0) {
      return Number(currentRateAmount) <= maxPurchaseAmount;
    }
  }

  return amountsMatch(currentRateAmount, selectedRate?.amount);
}

export async function verifyAndBuySelectedRate({
  customerAddress,
  parcel,
  selectedRate,
  direction,
  referencePrefix = "booking",
}) {
  if (!selectedRate) {
    throw new Error("A shipping rate is required");
  }

  const normalizedCustomerAddress = validateShippingAddress(customerAddress);
  const normalizedParcel = validateParcel(parcel);
  const storeAddress = getStoreAddress();
  const client = getEasyPostClient();

  const shipment = await createShipment(
    getShipmentConfigForDirection({
      normalizedCustomerAddress,
      normalizedParcel,
      storeAddress,
      direction,
      referencePrefix,
    }),
  );

  const currentRate = findMatchingRate(shipment, selectedRate);

  if (!currentRate || !selectedRateSupportsCurrentAmount(selectedRate, currentRate.rate, direction)) {
    return {
      status: "rate_changed",
      changedRates: [
        {
          direction,
          quotedRate: selectedRate,
          currentRate: currentRate ? mapRate(currentRate) : null,
        },
      ],
      storeAddress,
    };
  }

  const purchasedShipment = await client.Shipment.buy(shipment.id, currentRate.id);

  return {
    status: "purchased",
    label: {
      shipmentId: purchasedShipment.id,
      trackingCode: purchasedShipment.tracking_code,
      selectedRate: mapRate(purchasedShipment.selected_rate || currentRate),
      postageLabel: purchasedShipment.postage_label,
    },
    storeAddress,
  };
}
