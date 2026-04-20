/* eslint-disable react/prop-types */
export default function ConfirmActionModal({
  modalRef,
  confirmModal,
  itemToDelete,
  isSubmitting,
  activeActionType,
  refundLoading,
  onCancel,
  onConfirmDelete,
  onConfirmAction,
}) {
  return (
    <s-modal
      id="confirm-modal"
      accessibilityLabel="confirm-modal"
      ref={modalRef}
      heading={confirmModal.heading || "Please Confirm"}
    >
      <div className="delete-modal-content">
        <s-text>{confirmModal.message || "Please confirm this action."}</s-text>
      </div>
      <div className="delete-modal-actions">
        <s-button onClick={onCancel}>Cancel</s-button>
        <s-button
          tone={confirmModal.tone}
          onClick={itemToDelete ? onConfirmDelete : onConfirmAction}
          loading={(itemToDelete && isSubmitting && activeActionType === "DELETE") || refundLoading}
        >
          {confirmModal.confirmLabel || "Confirm"}
        </s-button>
      </div>
    </s-modal>
  );
}
