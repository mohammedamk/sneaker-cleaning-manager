import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import sendEmail from "../utils/sendEmail";
import {
  collectBookingImageIds,
  getImageUrls,
  normalizeBookingImages,
} from "../utils/shopifyImages.server";

const ORDER_LINE_ITEMS_QUERY = `
query RefundOrderLineItems($orderId: ID!) {
  order(id: $orderId) {
    id
    name
    displayFinancialStatus
    customAttributes {
      key
      value
    }
    lineItems(first: 100) {
      nodes {
        id
        title
        refundableQuantity
        customAttributes {
          key
          value
        }
      }
    }
    transactions(first: 50) {
      id
      gateway
      kind
      status
      maximumRefundableV2 {
        amount
        currencyCode
      }
      parentTransaction {
        id
      }
    }
  }
}
`;

const ORDER_REFUND_PREVIEW_QUERY = `
query RefundPreview($orderId: ID!, $refundLineItems: [RefundLineItemInput!]) {
  order(id: $orderId) {
    id
    name
    displayFinancialStatus
    suggestedRefund(refundLineItems: $refundLineItems) {
      amountSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      subtotalSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      shipping {
        amountSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
      refundLineItems {
        lineItem {
          id
          title
        }
        quantity
      }
    }
  }
}
`;

const REFUND_CREATE_MUTATION = `
mutation RefundCreate($input: RefundInput!) {
  refundCreate(input: $input) {
    refund {
      id
      totalRefundedSet {
        shopMoney {
          amount
          currencyCode
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;

function getAttributeValue(attributes = [], key) {
  const match = attributes.find((attribute) => attribute?.key === key);
  return typeof match?.value === "string" ? match.value : null;
}

function isTruthyAttributeValue(value) {
  return ["true", "1", "yes"].includes(String(value || "").trim().toLowerCase());
}

function isShippingLineItem(lineItem) {
  const title = String(lineItem?.title || "").toLowerCase();
  const customAttributes = Array.isArray(lineItem?.customAttributes) ? lineItem.customAttributes : [];

  return customAttributes.some((attribute) => {
    const key = String(attribute?.key || "").toLowerCase();
    const value = String(attribute?.value || "").toLowerCase();

    return key === "shipping_direction"
      || key === "booking_shipping_direction"
      || (key === "line_item_role" && value === "booking_shipping")
      || (key === "booking_shipping" && isTruthyAttributeValue(value))
      || (key === "refund_exclude" && isTruthyAttributeValue(value));
  })
    || title.startsWith("shipping to store")
    || title.startsWith("shipping to customerstore")
    || title.startsWith("return shipping")
    || title.includes(" shipping - ");
}

function orderHasShippingMetadata(order) {
  const customAttributes = Array.isArray(order?.customAttributes) ? order.customAttributes : [];
  return isTruthyAttributeValue(getAttributeValue(customAttributes, "has_booking_shipping"));
}

function parseMoneyAmount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function canCreateRefundForFinancialStatus(displayFinancialStatus) {
  const status = String(displayFinancialStatus || "").trim().toUpperCase();
  return status === "PAID";
}

function getUnpaidRefundMessage(displayFinancialStatus) {
  const status = String(displayFinancialStatus || "").trim();
  return status
    ? `This order cannot be refunded because the payment is not fully paid in Shopify yet. Current payment status: ${status}.`
    : "This order cannot be refunded because the payment is not captured in Shopify yet.";
}

function normalizeTransactionKind(kind) {
  return String(kind || "").trim().toUpperCase();
}

function normalizeTransactionStatus(status) {
  return String(status || "").trim().toUpperCase();
}

function getRefundTransaction(order, refundAmount) {
  const transactions = Array.isArray(order?.transactions) ? order.transactions : [];
  const successfulTransactions = transactions.filter(
    (transaction) => normalizeTransactionStatus(transaction?.status) === "SUCCESS",
  );

  const candidateTransaction = successfulTransactions.find(
    (transaction) => (
      normalizeTransactionKind(transaction?.kind) === "CAPTURE"
      && parseMoneyAmount(transaction?.maximumRefundableV2?.amount) > 0
    ),
  ) || successfulTransactions.find(
    (transaction) => (
      normalizeTransactionKind(transaction?.kind) === "SALE"
      && parseMoneyAmount(transaction?.maximumRefundableV2?.amount) > 0
    ),
  ) || successfulTransactions.find(
    (transaction) => normalizeTransactionKind(transaction?.kind) === "CAPTURE",
  ) || successfulTransactions.find(
    (transaction) => normalizeTransactionKind(transaction?.kind) === "SALE",
  );

  if (!candidateTransaction?.gateway) {
    throw new Error("We could not determine the payment gateway for this Shopify order, so the refund could not be created.");
  }

  const refundTransaction = {
    orderId: order.id,
    amount: refundAmount.toFixed(2),
    kind: "REFUND",
    gateway: candidateTransaction.gateway,
  };

  if (candidateTransaction.id) {
    refundTransaction.parentId = candidateTransaction.id;
  }

  return refundTransaction;
}

function getSafeRefundErrorMessage(error) {
  const rawMessage = String(error?.message || "").trim();
  const normalizedMessage = rawMessage.toLowerCase();

  if (!rawMessage) {
    return "We could not process the refund right now. Please try again.";
  }

  if (normalizedMessage.includes("payment is not fully paid")
    || normalizedMessage.includes("payment is not captured")) {
    return "This order was canceled before payment was captured, so Shopify cannot process a refund.";
  }

  if (normalizedMessage.includes("field 'nodes' doesn't exist on type 'ordertransaction'")
    || normalizedMessage.includes("graphqlqueryerror")
    || normalizedMessage.includes("variable")
    || normalizedMessage.includes("cannot query field")) {
    return "We could not prepare the Shopify refund for this order. Please try again, and if it still fails, contact support.";
  }

  return rawMessage;
}

async function getNormalizedBooking(admin, booking) {
  const imageMap = await getImageUrls(admin, collectBookingImageIds(booking));
  return normalizeBookingImages(booking, imageMap);
}

async function getRefundPreview(admin, shopifyOrderID) {
  const orderResponse = await admin.graphql(ORDER_LINE_ITEMS_QUERY, {
    variables: {
      orderId: shopifyOrderID,
    },
  });

  const orderData = await orderResponse.json();
  const order = orderData?.data?.order;

  if (!order) {
    throw new Error("Shopify order not found for this booking.");
  }

  if (!canCreateRefundForFinancialStatus(order.displayFinancialStatus)) {
    throw new Error(getUnpaidRefundMessage(order.displayFinancialStatus));
  }

  const allLineItems = order.lineItems?.nodes || [];
  // console.log("allLineItems........", JSON.stringify(allLineItems));
  const nonShippingLineItems = allLineItems.filter((lineItem) => !isShippingLineItem(lineItem));
  // console.log("nonShippingLineItems........", JSON.stringify(nonShippingLineItems));
  const refundableMerchandiseLineItems = nonShippingLineItems
    .filter((lineItem) => Number(lineItem?.refundableQuantity) > 0)
    .map((lineItem) => ({
      lineItemId: lineItem.id,
      quantity: Number(lineItem.refundableQuantity),
    }));
  // console.log("refundableMerchandiseLineItems........", JSON.stringify(refundableMerchandiseLineItems));

  if (!nonShippingLineItems.length) {
    throw new Error("No non-shipping line items were found on this order.");
  }

  if (!refundableMerchandiseLineItems.length) {
    const hasShippingMetadata = orderHasShippingMetadata(order);
    throw new Error(
      hasShippingMetadata
        ? "Shopify reports refundableQuantity as 0 for every non-shipping line item on this order, so no non-shipping refund can be created yet."
        : "Shopify reports refundableQuantity as 0 for every line item on this order, so no refund can be created yet."
    );
  }

  const suggestedRefundResponse = await admin.graphql(ORDER_REFUND_PREVIEW_QUERY, {
    variables: {
      orderId: shopifyOrderID,
      refundLineItems: refundableMerchandiseLineItems,
    },
  });

  const suggestedRefundData = await suggestedRefundResponse.json();
  const suggestedOrder = suggestedRefundData?.data?.order;
  const suggestedRefund = suggestedOrder?.suggestedRefund;
  // console.log("suggestedRefund........", JSON.stringify(suggestedRefund));
  // console.log("suggestedOrder........", JSON.stringify(suggestedOrder));

  if (!suggestedOrder || !suggestedRefund) {
    throw new Error("We could not calculate the refund amount from Shopify.");
  }

  const amount = parseMoneyAmount(suggestedRefund.amountSet?.shopMoney?.amount);
  const currencyCode = suggestedRefund.amountSet?.shopMoney?.currencyCode || "USD";

  if (amount <= 0) {
    throw new Error("No refundable amount is available excluding shipping.");
  }

  return {
    orderId: suggestedOrder.id,
    orderName: suggestedOrder.name,
    displayFinancialStatus: suggestedOrder.displayFinancialStatus,
    refundLineItems: refundableMerchandiseLineItems,
    transaction: getRefundTransaction(order, amount),
    amount,
    currencyCode,
    subtotalAmount: parseMoneyAmount(suggestedRefund.subtotalSet?.shopMoney?.amount),
    shippingAmount: parseMoneyAmount(suggestedRefund.shipping?.amountSet?.shopMoney?.amount),
  };
}

function buildRefundConfirmationEmail({ booking, refundAmount, currencyCode, orderName }) {
  const customerName = booking?.name || booking?.guestInfo?.name || "there";
  const bookingId = booking?._id?.toString() || "N/A";
  const amountText = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
  }).format(refundAmount);

  // return `
  //   <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:680px;margin:0 auto;">
  //     <h2 style="margin-bottom:8px;">Your Refund Has Been Processed</h2>
  //     <p>Hello ${customerName},</p>
  //     <p>We have processed your refund for the canceled sneaker cleaning order.</p>
  //     <p><strong>Booking ID:</strong> ${bookingId}</p>
  //     <p><strong>Order:</strong> ${orderName || booking?.shopifyOrderID || "N/A"}</p>
  //     <p><strong>Refund Amount:</strong> ${amountText}</p>
  //     <p>This refund excludes shipping charges, if any shipping charges were part of your order.</p>
  //     <p>Please allow your payment provider time to post the refund to your account.</p>
  //   </div>
  // `;

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:680px;margin:0 auto;">
      <h2 style="margin-bottom:8px;">Your Refund Has Been Processed</h2>
      <p>Hello ${customerName},</p>
      <p>We have processed your refund for the canceled sneaker cleaning order.</p>
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      <p><strong>Order:</strong> ${orderName || booking?.shopifyOrderID || "N/A"}</p>
      <p><strong>Refund Amount:</strong> ${amountText}</p>
      <p>This refund excludes shipping charges, if any shipping charges were part of your order.</p>
    </div>
  `;
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const body = await request.json();
  const bookingId = body?.bookingId;
  const mode = body?.mode || "preview";

  if (!bookingId) {
    return Response.json({ success: false, message: "Booking ID is required." }, { status: 400 });
  }

  if (!["preview", "process"].includes(mode)) {
    return Response.json({ success: false, message: "Invalid refund mode." }, { status: 400 });
  }

  try {
    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      return Response.json({ success: false, message: "Booking not found." }, { status: 404 });
    }

    if (booking.status !== "Canceled") {
      return Response.json({ success: false, message: "Only canceled bookings can be refunded." }, { status: 400 });
    }

    if (!booking.shopifyOrderID) {
      return Response.json({ success: false, message: "This booking is missing a Shopify order ID." }, { status: 400 });
    }

    if (booking.refund?.status === "completed") {
      return Response.json({
        success: false,
        message: "This booking has already been refunded.",
        booking: await getNormalizedBooking(admin, booking),
      }, { status: 400 });
    }

    const preview = await getRefundPreview(admin, booking.shopifyOrderID);

    if (mode === "preview") {
      return Response.json({
        success: true,
        mode,
        refund: {
          amount: preview.amount,
          currencyCode: preview.currencyCode,
          shippingAmount: preview.shippingAmount,
          subtotalAmount: preview.subtotalAmount,
          orderName: preview.orderName,
        },
      });
    }
    // console.log("preview.refundLineItems", JSON.stringify(preview.refundLineItems));
    // console.log("preview.orderId", preview.orderId);
    // console.log("preview.transaction", JSON.stringify(preview.transaction));
    const refundResponse = await admin.graphql(REFUND_CREATE_MUTATION, {
      variables: {
        input: {
          orderId: preview.orderId,
          refundLineItems: preview.refundLineItems,
          transactions: [preview.transaction],
        },
      },
    });

    const refundData = await refundResponse.json();
    const refundPayload = refundData?.data?.refundCreate;
    const userErrors = refundPayload?.userErrors || [];

    if (userErrors.length > 0) {
      throw new Error(userErrors.map((error) => error?.message).filter(Boolean).join(", ") || "Shopify refund failed.");
    }
    // console.log("refundPayload....................>>>>", refundPayload);
    const refund = refundPayload?.refund;

    booking.refund = {
      status: "completed",
      amount: parseMoneyAmount(refund?.totalRefundedSet?.shopMoney?.amount) || preview.amount,
      currencyCode: refund?.totalRefundedSet?.shopMoney?.currencyCode || preview.currencyCode,
      refundId: refund?.id || null,
      processedAt: new Date(),
    };
    await booking.save();

    const recipientEmail = booking.email || booking.guestInfo?.email;
    if (recipientEmail) {
      try {
        await sendEmail(
          recipientEmail,
          `Refund processed for booking ${booking._id.toString()}`,
          buildRefundConfirmationEmail({
            booking,
            refundAmount: booking.refund.amount,
            currencyCode: booking.refund.currencyCode,
            orderName: preview.orderName,
          }),
        );
      } catch (emailError) {
        console.error("Refund confirmation email failed:", emailError);
      }
    }

    return Response.json({
      success: true,
      mode,
      message: "Refund processed successfully.",
      refund: booking.refund,
      booking: await getNormalizedBooking(admin, booking),
    });
  } catch (error) {
    console.error("Refund booking error:", error);
    return Response.json({
      success: false,
      message: getSafeRefundErrorMessage(error),
    }, { status: 500 });
  }
};
