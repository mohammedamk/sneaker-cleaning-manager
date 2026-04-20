import sendEmail from "../../utils/sendEmail";

const BOOKING_STATUS_EMAIL_CONFIG = {
  Received: {
    subject: (booking) => `We received your sneakers: booking ${booking._id.toString()}`,
    heading: "Your sneakers have been received",
    message: [
      "We have received your sneakers at the store.",
      "Our team will inspect them next, and the cleaning process will begin shortly.",
    ],
  },
  "Cleaning Complete": {
    subject: (booking) => `Cleaning complete for booking ${booking._id.toString()}`,
    heading: "Cleaning is complete",
    message: [
      "Your sneaker cleaning service has been completed.",
      "We will notify you again as soon as your order is ready for pickup or shipment.",
    ],
  },
  "Ready for Pickup / Shipment": {
    subject: (booking) => `Booking ready for pickup or shipment: ${booking._id.toString()}`,
    heading: "Your order is ready",
    message: (booking) => [
      booking.handoffMethod === "shipping"
        ? "Your order is now ready for shipment."
        : "Your order is now ready for pickup.",
      "You can review your booking details any time from the booking page.",
    ],
  },
};

function getBookingCustomerName(booking) {
  return booking?.name || booking?.guestInfo?.name || "there";
}

export function getBookingRecipientEmail(booking) {
  return booking?.email || booking?.guestInfo?.email || "";
}

function buildBookingAccessSection(booking, buttonLabel = "View Booking Details") {
  const accessUrl = booking?.secureAccessUrl;

  if (!accessUrl) {
    return "";
  }

  return `
    <div style="margin:24px 0;">
      <a href="${accessUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
        ${buttonLabel}
      </a>
    </div>
    <p style="margin:0;"><a href="${accessUrl}" style="color:#2563eb;word-break:break-all;">${accessUrl}</a></p>
  `;
}

function buildBookingEmailContent({
  booking,
  heading,
  message,
  buttonLabel = "View Booking Details",
  footerMessage = "",
}) {
  const customerName = getBookingCustomerName(booking);
  const bookingId = booking?._id?.toString() || "N/A";
  const paragraphs = (Array.isArray(message) ? message : [message])
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 12px;">${paragraph}</p>`)
    .join("");

  return `
    <h2 style="margin:0 0 8px;">${heading}</h2>
    <p style="margin:0 0 12px;">Hello ${customerName},</p>
    ${paragraphs}
    <p style="margin:0 0 16px;"><strong>Booking ID:</strong> ${bookingId}</p>
    ${buildBookingAccessSection(booking, buttonLabel)}
    ${footerMessage ? `<p style="margin:16px 0 0;">${footerMessage}</p>` : ""}
  `;
}

export function buildCleanedSneakersEmail(booking, sneakerIndexToInclude = null) {
  let cleanedSneakers = (booking?.sneakers || []).filter(
    (sneaker) => Array.isArray(sneaker.cleanedImages) && sneaker.cleanedImages.length > 0,
  );

  if (Number.isInteger(sneakerIndexToInclude)) {
    cleanedSneakers = cleanedSneakers.filter((_, idx) => idx === sneakerIndexToInclude);
  }

  const sneakerList = cleanedSneakers
    .map((sneaker) => {
      const sneakerName = sneaker.nickname || "Unnamed sneaker";
      const details = [sneaker.brand, sneaker.model, sneaker.colorway]
        .filter(Boolean)
        .join(" - ");

      return `
        <li style="margin-bottom:8px;">
          <strong>${sneakerName}</strong>${details ? ` <span style="color:#6b7280;">(${details})</span>` : ""}
        </li>
      `;
    })
    .join("");

  return `
    ${buildBookingEmailContent({
      booking,
      heading: "Your sneakers are cleaned",
      message: [
        "Your cleaned sneaker photos are now ready to view.",
        "Please review the after-cleaning images from your order details page and approve them once you are satisfied.",
      ],
      buttonLabel: "Review Cleaned Sneaker Images",
      footerMessage: booking?.secureAccessUrl
        ? "If the button does not open, use the secure link above to open your booking details page."
        : "Please open your booking details page and use your booking ID to review the cleaned images.",
    })}
    ${cleanedSneakers.length ? `
      <div style="margin:20px 0 0;padding:18px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;">
        <p style="margin:0 0 10px;"><strong>Updated sneakers</strong></p>
        <ul style="padding-left:20px;margin:0;">
          ${sneakerList}
        </ul>
      </div>
    ` : ""}
  `;
}

export async function sendBookingStatusEmail(booking, status) {
  const recipientEmail = getBookingRecipientEmail(booking);

  if (!recipientEmail) {
    return;
  }

  const emailConfig = BOOKING_STATUS_EMAIL_CONFIG[status];

  if (!emailConfig) {
    return;
  }

  const message = typeof emailConfig.message === "function"
    ? emailConfig.message(booking)
    : emailConfig.message;

  await sendEmail(
    recipientEmail,
    emailConfig.subject(booking),
    buildBookingEmailContent({
      booking,
      heading: emailConfig.heading,
      message,
    }),
  );
}

export async function sendCleanedSneakersEmail(booking, sneakerIndexToInclude = null) {
  const recipientEmail = getBookingRecipientEmail(booking);

  if (!recipientEmail) {
    return false;
  }

  await sendEmail(
    recipientEmail,
    `Your sneakers are cleaned: booking ${booking._id.toString()}`,
    buildCleanedSneakersEmail(booking, sneakerIndexToInclude),
  );

  return true;
}
