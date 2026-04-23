/* eslint-disable react/prop-types */
import {
  canBuyStoreToCustomerShipping,
  getBookingShippingSelection,
  getObjectIdString,
  getStatusTone,
} from "../bookings.helpers";

export default function BookingsTable({
  items,
  page,
  totalPages,
  tableLoading,
  buyShippingBookingId,
  onView,
  onEdit,
  onBuyShipping,
  onChangePage,
}) {
  if (tableLoading) {
    return (
      <div className="loader-container">
        <s-spinner size="large" />
      </div>
    );
  }

  // checking if we're on mobile for responsive adjustments
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  // empty message if items is empty
  if (!items || items.length === 0) {
    return (
      <div className="empty-state-container">
        <div className="empty-state-content">
          <div className="empty-state-icon">📦</div>
          <s-text type="strong"className="empty-state-title">
            No bookings found
          </s-text>
          <s-text variant="body" tone="subdued" className="empty-state-description">
            No cleaning bookings match your current search criteria
          </s-text>
        </div>
      </div>
    );
  }

  return (
    <s-table
      paginate
      hasPreviousPage={page > 1}
      hasNextPage={page < totalPages}
      onPreviousPage={() => onChangePage(page - 1)}
      onNextPage={() => onChangePage(page + 1)}
    >
      <s-table-header-row>
        <s-table-header>Order</s-table-header>
        {!isMobile && <s-table-header>Customer</s-table-header>}
        <s-table-header>Qty</s-table-header>
        {!isMobile && <s-table-header>Method</s-table-header>}
        <s-table-header>Status</s-table-header>
        {!isMobile && <s-table-header>Date</s-table-header>}
        <s-table-header>Actions</s-table-header>
      </s-table-header-row>

      <s-table-body>
        {items.map((item, itemIndex) => (
          <s-table-row key={getObjectIdString(item._id) || `booking-${itemIndex}`}>
            <s-table-cell>
              <code className="order-id-code">
                #{getObjectIdString(item._id)}
              </code>
              {isMobile && (
                <div className="mobile-booking-info">
                  {item.name || item.guestInfo?.name || "Guest"}<br />
                  {item.handoffMethod}
                </div>
              )}
            </s-table-cell>
            {!isMobile && (
              <s-table-cell>
                <div className="customer-info">
                  <s-text type="strong">{item.name || item.guestInfo?.name || "Guest User"}</s-text>
                  <s-text variant="bodySm" tone="subdued">{item.email || item.guestInfo?.email}</s-text>
                </div>
              </s-table-cell>
            )}
            <s-table-cell>
              <s-badge tone="info">{Array.isArray(item.sneakers) ? item.sneakers.length : 0} Pairs</s-badge>
            </s-table-cell>
            {!isMobile && (
              <s-table-cell>
                <s-text variant="bodySm">{item.handoffMethod}</s-text>
              </s-table-cell>
            )}
            <s-table-cell>
              <s-badge tone={getStatusTone(item.status)}>
                {item.status}
              </s-badge>
            </s-table-cell>
            {!isMobile && (
              <s-table-cell>
                <s-text variant="bodySm">{new Date(item.submittedAt).toLocaleDateString()}</s-text>
              </s-table-cell>
            )}
            <s-table-cell>
              <div className="actions-container">
                <s-button size="slim" variant="secondary" onClick={() => onView(item)}>View</s-button>
                <s-button size="slim" disabled={item.status === "Canceled"} onClick={() => onEdit(item)}>Update Status</s-button>
                {item.handoffMethod === "shipping" && getBookingShippingSelection(item)?.selectedReturnRate && (
                  <s-button
                    size="slim"
                    variant="primary"
                    onClick={() => onBuyShipping(item._id)}
                    disabled={!canBuyStoreToCustomerShipping(item)}
                    loading={buyShippingBookingId === getObjectIdString(item._id)}
                  >
                    {getBookingShippingSelection(item)?.labels?.storeToCustomer?.shipmentId
                      ? "Shipping Purchased"
                      : "Buy Shipping"}
                  </s-button>
                )}
              </div>
            </s-table-cell>
          </s-table-row>
        ))}
      </s-table-body>
    </s-table>
  );
}