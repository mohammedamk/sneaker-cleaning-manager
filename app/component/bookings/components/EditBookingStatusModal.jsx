/* eslint-disable react/prop-types */
import { STATUS_OPTIONS } from "../bookings.helpers";

export default function EditBookingStatusModal({
  modalRef,
  editingBooking,
  isSubmitting,
  activeActionType,
  onStatusUpdate,
}) {
  return (
    <s-modal id="edit-modal" ref={modalRef} heading="Manage Booking Status">
      {editingBooking && (
        <div className="modal-content">
          <div className="current-status-banner">
            <s-text variant="bodySm" tone="subdued">CURRENTLY UPDATING</s-text>
            <div className="modal-header-row">
              <s-text type="strong">{editingBooking.name || editingBooking.guestInfo?.name}</s-text>
              <s-badge>{editingBooking.status}</s-badge>
            </div>
          </div>

          {editingBooking.status === "Canceled" ? (
            <s-text tone="subdued">
              This booking has been canceled and its status can no longer be changed.
            </s-text>
          ) : (
            <>
              <s-text type="strong">Select New Status</s-text>
              <div className="status-grid">
                {STATUS_OPTIONS.map((status) => (
                  <s-button
                    key={status}
                    pressed={editingBooking.status === status}
                    variant={editingBooking.status === status ? "primary" : "secondary"}
                    onClick={() => onStatusUpdate(status)}
                    loading={isSubmitting && activeActionType === "UPDATE_STATUS"}
                  >
                    {status}
                  </s-button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </s-modal>
  );
}
