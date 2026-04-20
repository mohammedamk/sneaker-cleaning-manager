export const PAGE_LIMIT = 10;
export const BOOKING_IMAGE_POLL_INTERVAL_MS = 3000;
export const READY_FOR_SHIPMENT_STATUS = "Ready for Pickup / Shipment";

export const STATUS_OPTIONS = [
  "Pending",
  "Received",
  "Under Inspection",
  "In Cleaning",
  "Awaiting Customer Approval",
  "Cleaning Complete",
  "Ready for Pickup / Shipment",
  "Completed",
  "Canceled",
];

export const SNEAKER_STATUS_OPTIONS = ["Pending", "In Cleaning", "Cleaning Complete"];

export function getStatusTone(status) {
  switch (status) {
    case "Pending":
      return "warning";
    case "Received":
      return "auto";
    case "Under Inspection":
      return "caution";
    case "In Cleaning":
      return "info";
    case "Awaiting Customer Approval":
      return "warning";
    case "Cleaning Complete":
      return "info";
    case "Ready for Pickup / Shipment":
      return "success";
    case "Completed":
      return "success";
    case "Canceled":
      return "critical";
    default:
      return "subdued";
  }
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getSneakerUploadKey(bookingId, sneakerIndex) {
  return `${bookingId}-${sneakerIndex}`;
}

export function getObjectIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();

  if (typeof value.toString === "function") {
    const stringValue = value.toString();
    if (stringValue && stringValue !== "[object Object]") {
      return stringValue;
    }
  }

  const bytes = value?.buffer?.data
    || (Array.isArray(value?.buffer) ? value.buffer : null)
    || (Array.isArray(value?.id?.buffer) ? value.id.buffer : null)
    || value?.id?.buffer?.data;

  if (Array.isArray(bytes) && bytes.length === 12) {
    return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return "";
}

export function hasCleanedImages(booking) {
  return (booking?.sneakers || []).some(
    (sneaker) => Array.isArray(sneaker.cleanedImages) && sneaker.cleanedImages.length > 0,
  );
}

export function hasPendingCleanedImages(booking) {
  return (booking?.sneakers || []).some(
    (sneaker) => Boolean(sneaker.cleanedImageProcessing),
  );
}

export function getCleanedImagesApprovalStatus(booking) {
  if (!hasCleanedImages(booking)) return "not-available";
  return booking?.cleanedImagesApprovalStatus || "pending";
}

export function updateBookingInList(bookings, updatedBooking) {
  return bookings.map((item) => (
    getObjectIdString(item._id) === getObjectIdString(updatedBooking._id) ? updatedBooking : item
  ));
}

export function getBookingQrCodeUrl(booking) {
  if (booking?.qrCodeImageUrl) return booking.qrCodeImageUrl;
  if (booking?.secureAccessUrl) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(booking.secureAccessUrl)}`;
  }
  return "";
}

export function formatDateTime(value) {
  if (!value) return "Not completed yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not completed yet";

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

export function formatMoney(amount, currencyCode = "USD") {
  const numericAmount = Number(amount);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
}

export function getBookingShippingSelection(booking) {
  return booking?.shipping || booking?.fullPayload?.shippingSelection || null;
}

export function getAddressLines(address = {}) {
  const streetLine = [address.street1, address.street2].filter(Boolean).join(", ");
  const cityLine = [address.city, address.state, address.zip].filter(Boolean).join(", ");
  const countryLine = address.country || "";

  return [address.name, address.company, streetLine, cityLine, countryLine, address.phone, address.email]
    .filter((value) => String(value || "").trim());
}

export function formatRateSummary(rate) {
  if (!rate) return "Not selected";

  const amountText = formatMoney(rate.amount, rate.currency || "USD");

  return [
    [rate.carrier, rate.service].filter(Boolean).join(" "),
    amountText,
  ].filter(Boolean).join(" • ");
}

export function canBuyStoreToCustomerShipping(booking) {
  const shippingSelection = getBookingShippingSelection(booking);

  return booking?.handoffMethod === "shipping"
    && Boolean(shippingSelection?.selectedReturnRate)
    && booking?.status === READY_FOR_SHIPMENT_STATUS
    && !shippingSelection?.labels?.storeToCustomer?.shipmentId;
}

export function getApprovalBadgeTone(approvalStatus) {
  if (approvalStatus === "approved") return "success";
  if (approvalStatus === "rejected") return "critical";
  if (approvalStatus === "pending") return "warning";
  return "subdued";
}

export function getApprovalBadgeLabel(approvalStatus) {
  if (approvalStatus === "approved") return "Approved";
  if (approvalStatus === "rejected") return "Rejected";
  if (approvalStatus === "pending") return "Approval Pending";
  return "Not available";
}
