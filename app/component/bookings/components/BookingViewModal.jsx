/* eslint-disable react/prop-types */
import {
  SNEAKER_STATUS_OPTIONS,
  formatDateTime,
  formatMoney,
  formatRateSummary,
  getAddressLines,
  getApprovalBadgeTone,
  getBookingQrCodeUrl,
  getObjectIdString,
  getSneakerUploadKey,
  getStatusTone,
  hasCleanedImages,
  hasPendingCleanedImages,
} from "../bookings.helpers";

function BookingSummaryCard({ label, children }) {
  return (
    <div className="booking-view-card">
      <s-text color="subdued" tone="auto" className="booking-view-card__label">{label}</s-text>
      <div className="booking-view-card__content">{children}</div>
    </div>
  );
}

function BookingImageCard({
  imageUrl,
  alt,
  onPreview,
  onDownload,
  onDelete,
  deleteLoading,
}) {
  return (
    <div className="booking-view-image-card">
      <button
        type="button"
        className="booking-view-image-button"
        onClick={() => onPreview(imageUrl)}
      >
        <img src={imageUrl} alt={alt} className="booking-view-image" />
      </button>
      <div className="booking-view-image-actions">
        <s-button size="slim" variant="secondary" onClick={() => onPreview(imageUrl)}>
          Preview
        </s-button>
        <s-button size="slim" variant="secondary" onClick={onDownload}>
          Download
        </s-button>
        {onDelete && (
          <s-button
            size="slim"
            variant="secondary"
            tone="critical"
            onClick={onDelete}
            loading={deleteLoading}
          >
            Delete
          </s-button>
        )}
      </div>
    </div>
  );
}

function BookingSneakerCard({
  bookingId,
  sneaker,
  sneakerIndex,
  cleanedImageDrafts,
  approvalNoteDraftBySneaker,
  isSubmitting,
  activeActionType,
  onPreviewImage,
  onDownloadImage,
  onDeleteCleanedImage,
  onUpdateSneakerStatus,
  onApproveSneaker,
  onRejectSneaker,
  onSendCleanedEmailPerSneaker,
  onChangeApprovalNoteDraft,
  onCleanedImagesChange,
  onUploadCleanedImages,
}) {
  const uploadKey = getSneakerUploadKey(bookingId, sneakerIndex);
  const draftFiles = cleanedImageDrafts[uploadKey] || [];
  const sneakerKey = getObjectIdString(sneaker._id) || sneaker.id || sneakerIndex;
  const sneakerApprovalDraftKey = `${bookingId}-${sneakerIndex}`;

  return (
    <div className="booking-view-sneaker" key={sneakerKey}>
      <div className="booking-view-sneaker__meta">
        <s-text type="strong">{sneaker.nickname || "Unnamed Sneaker"}</s-text>
        <s-text variant="bodySm" tone="subdued">
          {[sneaker.brand, sneaker.model, sneaker.colorway].filter(Boolean).join(" - ") || "No sneaker details"}
        </s-text>
        {sneaker.services && (
          <s-text variant="bodySm">
            Service: {sneaker.services.tier}
            {sneaker.services.addOns?.length ? ` + ${sneaker.services.addOns.join(", ")}` : ""}
          </s-text>
        )}
      </div>

      <div className="booking-view-sneaker__status-section">
        <div>
          <s-text type="strong" color="subdued">Sneaker Status</s-text>
          <div className="booking-view-status-buttons">
            {SNEAKER_STATUS_OPTIONS.map((status) => (
              <s-button
                key={status}
                size="slim"
                variant={(sneaker.status || "Pending") === status ? "primary" : "secondary"}
                onClick={() => onUpdateSneakerStatus(sneakerIndex, status)}
                loading={isSubmitting && activeActionType === "UPDATE_SNEAKER_STATUS"}
              >
                {status}
              </s-button>
            ))}
          </div>
        </div>
      </div>

      <div className="booking-view-image-group">
        <s-text type="strong">Before cleaning</s-text>
        <div className="booking-view-images">
          {sneaker.images?.length ? (
            sneaker.images.map((imageUrl, imageIndex) => (
              <BookingImageCard
                key={`${sneakerKey}-before-${imageIndex}`}
                imageUrl={imageUrl}
                alt={`${sneaker.nickname || "Sneaker"} before cleaning ${imageIndex + 1}`}
                onPreview={onPreviewImage}
                onDownload={() => onDownloadImage(imageUrl, `${sneaker.nickname || "sneaker"}-before`, imageIndex)}
              />
            ))
          ) : (
            <div className="booking-view-image-empty">No original image uploaded</div>
          )}
        </div>
      </div>

      <div className="booking-view-image-group booking-view-image-group--cleaned">
        <div className="booking-view-section-header">
          <s-text type="strong">After cleaning</s-text>
          <s-text variant="bodySm" tone="subdued">
            Customers will see these images on their booking details page after upload.
          </s-text>
        </div>

        <div className="booking-view-images">
          {sneaker.cleanedImages?.length ? (
            <>
              {sneaker.cleanedImages.map((imageUrl, imageIndex) => (
                <BookingImageCard
                  key={`${sneakerKey}-after-${imageIndex}`}
                  imageUrl={imageUrl}
                  alt={`${sneaker.nickname || "Sneaker"} after cleaning ${imageIndex + 1}`}
                  onPreview={onPreviewImage}
                  onDownload={() => onDownloadImage(imageUrl, `${sneaker.nickname || "sneaker"}-after`, imageIndex)}
                  onDelete={() => onDeleteCleanedImage(bookingId, sneakerIndex, imageIndex)}
                  deleteLoading={isSubmitting && activeActionType === "DELETE_CLEANED_IMAGE"}
                />
              ))}
              {sneaker.cleanedImageProcessing && (
                <div className="booking-view-image-empty booking-view-image-empty--processing">
                  Cleaned image is processing...
                </div>
              )}
            </>
          ) : sneaker.cleanedImageProcessing ? (
            <div className="booking-view-image-empty booking-view-image-empty--processing">
              Cleaned image is processing...
            </div>
          ) : (
            <div className="booking-view-image-empty">No cleaned image uploaded yet</div>
          )}
        </div>

        {sneaker.cleanedImages?.length > 0 && (
      <div className="booking-view-sneaker__approval-section">
        <div>
          <s-text type="strong" color="subdued">Cleaned Images Approval</s-text>
          <s-badge tone={getApprovalBadgeTone(sneaker.cleanedImagesApprovalStatus || "pending")}>
                {sneaker.cleanedImagesApprovalStatus === "approved"
                  ? "Approved"
                  : sneaker.cleanedImagesApprovalStatus === "rejected"
                    ? "Rejected"
                    : "Pending"}
              </s-badge>
            </div>
            <div className="booking-view-approval-actions">
              <s-button
                size="slim"
                variant="secondary"
                onClick={() => onApproveSneaker(sneakerIndex)}
                loading={isSubmitting && activeActionType === "UPDATE_CLEANING_APPROVAL"}
                disabled={sneaker.cleanedImagesApprovalStatus === "approved"}
              >
                Approve
              </s-button>
              <s-button
                size="slim"
                variant="primary"
                onClick={() => onSendCleanedEmailPerSneaker(sneakerIndex)}
                loading={isSubmitting && activeActionType === "SEND_CLEANED_EMAIL"}
              >
                Send Email to Customer
              </s-button>
            </div>
            {sneaker.cleanedImagesApprovalStatus !== "rejected" && (
              <div className="booking-view-approval-note">
                <label className="booking-view-approval-note__label" htmlFor={`approval-note-${sneakerIndex}`}>
                  Rejection note (if rejecting)
                </label>
                <textarea
                  id={`approval-note-${sneakerIndex}`}
                  className="booking-view-approval-note__input"
                  rows={2}
                  value={approvalNoteDraftBySneaker[sneakerApprovalDraftKey] || ""}
                  onChange={(event) => onChangeApprovalNoteDraft(sneakerApprovalDraftKey, event.target.value)}
                  placeholder="Describe what needs to be corrected before approval."
                />
                <s-button
                  size="slim"
                  tone="critical"
                  onClick={() => onRejectSneaker(sneakerIndex)}
                  loading={isSubmitting && activeActionType === "UPDATE_CLEANING_APPROVAL"}
                >
                  Submit Rejection
                </s-button>
              </div>
            )}
            {sneaker.cleanedImagesApprovalStatus === "rejected" && sneaker.cleanedImagesApprovalNote && (
              <div className="booking-view-approval-note">
                <div className="booking-view-approval-note__label">Rejection Reason</div>
                <s-text variant="bodySm">{sneaker.cleanedImagesApprovalNote}</s-text>
              </div>
            )}
          </div>
        )}

        <div className="booking-view-upload-box">
          <label className="booking-view-upload-label" htmlFor={`cleaned-images-${uploadKey}`}>
            Upload cleaned images
          </label>
          <input
            id={`cleaned-images-${uploadKey}`}
            className="booking-view-file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => onCleanedImagesChange(bookingId, sneakerIndex, event.target.files)}
          />
          {draftFiles.length > 0 && (
            <div className="booking-view-upload-previews">
              {draftFiles.map((draft, draftIndex) => (
                <img
                  key={`${uploadKey}-${draftIndex}`}
                  src={draft.previewUrl}
                  alt={`Selected cleaned sneaker preview ${draftIndex + 1}`}
                  className="booking-view-upload-preview"
                />
              ))}
            </div>
          )}
          <div className="booking-view-upload-actions">
            <s-button
              variant="primary"
              onClick={() => onUploadCleanedImages(bookingId, sneakerIndex)}
              loading={isSubmitting && activeActionType === "UPLOAD_CLEANED_IMAGES"}
            >
              Upload cleaned images
            </s-button>
            <s-text variant="bodySm" tone="subdued">
              You can upload multiple after-cleaning images at once, and new uploads are added to the current gallery.
            </s-text>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingViewModal({
  modalRef,
  viewingBooking,
  cleanedImageDrafts,
  approvalStatus,
  approvalNoteDraftBySneaker,
  bookingShippingSelection,
  isSubmitting,
  activeActionType,
  refundLoading,
  onPreviewImage,
  onDownloadImage,
  onSneakerApprovalNoteDraftChange,
  onRefundBooking,
  onSendCleanedEmail,
  onUpdateSneakerStatus,
  onDeleteCleanedImage,
  onApproveSneaker,
  onRejectSneaker,
  onSendCleanedEmailPerSneaker,
  onCleanedImagesChange,
  onUploadCleanedImages,
}) {
  const customerShippingAddress = bookingShippingSelection?.customerAddress;
  const pickupReturnAddress = bookingShippingSelection?.customerAddress;
  const packageDetails = bookingShippingSelection?.parcel;
  const selectedForwardRate = bookingShippingSelection?.selectedForwardRate;
  const selectedReturnRate = bookingShippingSelection?.selectedReturnRate;
  const sneakersWithCleanedImages = (viewingBooking?.sneakers || []).filter(
    (sneaker) => Array.isArray(sneaker.cleanedImages) && sneaker.cleanedImages.length > 0,
  );
  const displayApprovalStatus = sneakersWithCleanedImages.length > 0
    && sneakersWithCleanedImages.every((sneaker) => sneaker.cleanedImagesApprovalStatus === "approved")
    ? "approved"
    : approvalStatus;

  return (
    <s-modal id="view-modal" ref={modalRef} heading="Booking Details">
      {viewingBooking && (
        <div className="booking-view-modal">
          <div className="booking-view-topbar">
            <div className="booking-view-topbar__summary">
              <div className="booking-view-topbar__ids">
                <span className="booking-view-pill">Booking #{getObjectIdString(viewingBooking._id)}</span>
                <span className="booking-view-pill">Order #{getObjectIdString(viewingBooking.shopifyOrderID.split("/").pop())}</span>
              </div>
              <div className="booking-view-topbar__badges">
                <s-badge tone={getStatusTone(viewingBooking.status)}>{viewingBooking.status}</s-badge>
                <s-badge tone={getApprovalBadgeTone(displayApprovalStatus)}>
                  {displayApprovalStatus === "approved"
                    ? "After Cleaning Approved"
                    : displayApprovalStatus === "rejected"
                      ? "After Cleaning Rejected"
                      : displayApprovalStatus === "pending"
                        ? "After Cleaning Pending"
                        : "After Cleaning Not Available"}
                </s-badge>
              </div>
            </div>
            {(viewingBooking.status === "Canceled"
              && viewingBooking.refund?.status !== "completed"
              && viewingBooking.handoffMethod === "shipping") && (
              <div className="booking-view-topbar__actions">
                <s-button
                  variant="primary"
                  tone="critical"
                  onClick={onRefundBooking}
                  loading={refundLoading}
                >
                  Refund customer
                </s-button>
              </div>
            )}
            {hasCleanedImages(viewingBooking) && (
              <div className="booking-view-topbar__actions">
                <s-button
                  variant="primary"
                  onClick={onSendCleanedEmail}
                  loading={isSubmitting && activeActionType === "SEND_CLEANED_EMAIL"}
                  disabled={hasPendingCleanedImages(viewingBooking)}
                >
                  Send email to customer
                </s-button>
              </div>
            )}
          </div>

          <section className="booking-view-block">
            <div className="booking-view-block__header">
              <s-text type="strong">Overview</s-text>
            </div>
            <div className="booking-view-grid booking-view-grid--overview">
              <BookingSummaryCard label="CUSTOMER">
                <s-text type="strong">{viewingBooking.name || viewingBooking.guestInfo?.name || "Guest User"}</s-text>
                <s-text variant="bodySm" tone="subdued">{viewingBooking.email || viewingBooking.guestInfo?.email || "No email"}</s-text>
              </BookingSummaryCard>
              <BookingSummaryCard label="PHONE">
                <s-text>{viewingBooking.guestInfo?.phone || viewingBooking.phone || "N/A"}</s-text>
              </BookingSummaryCard>
              <BookingSummaryCard label="HANDOFF">
                <s-text>{viewingBooking.handoffMethod || "N/A"}</s-text>
              </BookingSummaryCard>
              <BookingSummaryCard label="SUBMITTED">
                <s-text>{new Date(viewingBooking.submittedAt).toLocaleDateString()} {new Date(viewingBooking.submittedAt).toLocaleTimeString()}</s-text>
              </BookingSummaryCard>
              <BookingSummaryCard label="LAST CLEANING">
                <s-text>{formatDateTime(viewingBooking.lastCleaning)}</s-text>
              </BookingSummaryCard>
              <BookingSummaryCard label="AFTER CLEANING APPROVAL">
                <s-badge tone={getApprovalBadgeTone(displayApprovalStatus)}>
                  {displayApprovalStatus === "approved"
                    ? "Approved"
                    : displayApprovalStatus === "rejected"
                      ? "Rejected"
                      : displayApprovalStatus === "pending"
                        ? "Pending"
                        : "Not available"}
                </s-badge>
              </BookingSummaryCard>
              <BookingSummaryCard label="REFUND">
                {viewingBooking.refund?.status === "completed" ? (
                  <>
                    <s-badge tone="success">Refunded</s-badge>
                    <s-text>
                      {formatMoney(viewingBooking.refund.amount, viewingBooking.refund.currencyCode)}
                    </s-text>
                    <s-text variant="bodySm" tone="subdued">
                      {formatDateTime(viewingBooking.refund.processedAt)}
                    </s-text>
                  </>
                ) : (
                  <s-text>
                    {(viewingBooking.status === "Canceled" && viewingBooking.handoffMethod === "shipping") ? "Pending refund" : "Not available"}
                  </s-text>
                )}
              </BookingSummaryCard>
              {displayApprovalStatus === "rejected" && viewingBooking.cleanedImagesApprovalNote && (
                <BookingSummaryCard label="REJECTION NOTE">
                  <s-text>{viewingBooking.cleanedImagesApprovalNote}</s-text>
                </BookingSummaryCard>
              )}
            </div>
          </section>

          {(viewingBooking.handoffMethod === "shipping" || viewingBooking.handoffMethod === "pickup_delivery") && (
            <section className="booking-view-block">
              <div className="booking-view-block__header">
                <s-text type="strong">Logistics</s-text>
              </div>
              <div className="booking-view-grid booking-view-grid--logistics">
              {viewingBooking.handoffMethod === "shipping" && customerShippingAddress && (
                <BookingSummaryCard label="CUSTOMER SHIPPING ADDRESS">
                  {getAddressLines(customerShippingAddress).map((line, index) => (
                    <s-text key={`shipping-address-${index}`}>{line}</s-text>
                  ))}
                </BookingSummaryCard>
              )}

              {viewingBooking.handoffMethod === "pickup_delivery" && pickupReturnAddress && (
                <BookingSummaryCard label="PICKUP & RETURN ADDRESS">
                  {getAddressLines(pickupReturnAddress).map((line, index) => (
                    <s-text key={`pickup-address-${index}`}>{line}</s-text>
                  ))}
                </BookingSummaryCard>
              )}

              {viewingBooking.handoffMethod === "shipping" && packageDetails && (
                <BookingSummaryCard label="PACKAGE DETAILS">
                  <s-text>Length: {packageDetails.length || "N/A"}</s-text>
                  <s-text>Width: {packageDetails.width || "N/A"}</s-text>
                  <s-text>Height: {packageDetails.height || "N/A"}</s-text>
                  <s-text>Weight: {packageDetails.weight || "N/A"}</s-text>
                </BookingSummaryCard>
              )}

              {viewingBooking.handoffMethod === "shipping" && (
                <>
                  <BookingSummaryCard label="CUSTOMER TO STORE RATE">
                    <s-text>{formatRateSummary(selectedForwardRate)}</s-text>
                  </BookingSummaryCard>
                  <BookingSummaryCard label="STORE TO CUSTOMER RATE">
                    <s-text>{formatRateSummary(selectedReturnRate)}</s-text>
                  </BookingSummaryCard>
                </>
              )}
              </div>
            </section>
          )}

          <section className="booking-view-block booking-view-qr-section">
            <div className="booking-view-block__header">
              <s-text type="strong">Access</s-text>
            </div>
            <div className="booking-view-qr-card">
              <div className="booking-view-qr-copy">
                <s-text type="strong" color="subdued">Booking QR Code</s-text>
                <s-text variant="bodySm" tone="subdued">
                  Scan this code to open the customer booking details page.
                </s-text>
                {viewingBooking.secureAccessUrl && (
                  <s-button
                    size="slim"
                    variant="secondary"
                    href={viewingBooking.secureAccessUrl}
                    target="_blank"
                  >
                    Open booking page
                  </s-button>
                )}
              </div>
              {getBookingQrCodeUrl(viewingBooking) ? (
                <img
                  src={getBookingQrCodeUrl(viewingBooking)}
                  alt={`QR code for booking ${getObjectIdString(viewingBooking._id)}`}
                  className="booking-view-qr-image"
                />
              ) : (
                <div className="booking-view-qr-empty">
                  <s-text variant="bodySm" tone="subdued">No QR code saved for this booking yet.</s-text>
                </div>
              )}
            </div>
          </section>

          <section className="booking-view-block booking-view-section">
            <div className="booking-view-block__header">
              <s-text type="strong">Sneakers ({Array.isArray(viewingBooking.sneakers) ? viewingBooking.sneakers.length : 0})</s-text>
            </div>
            <div className="booking-view-sneakers">
              {(viewingBooking.sneakers || []).map((sneaker, sneakerIndex) => (
                <BookingSneakerCard
                  key={`${getObjectIdString(sneaker._id) || sneaker.id || sneakerIndex}`}
                  bookingId={getObjectIdString(viewingBooking._id)}
                  sneaker={sneaker}
                  sneakerIndex={sneakerIndex}
                  cleanedImageDrafts={cleanedImageDrafts}
                  approvalNoteDraftBySneaker={approvalNoteDraftBySneaker}
                  isSubmitting={isSubmitting}
                  activeActionType={activeActionType}
                  onPreviewImage={onPreviewImage}
                  onDownloadImage={onDownloadImage}
                  onDeleteCleanedImage={onDeleteCleanedImage}
                  onUpdateSneakerStatus={onUpdateSneakerStatus}
                  onApproveSneaker={onApproveSneaker}
                  onRejectSneaker={onRejectSneaker}
                  onSendCleanedEmailPerSneaker={onSendCleanedEmailPerSneaker}
                  onChangeApprovalNoteDraft={onSneakerApprovalNoteDraftChange}
                  onCleanedImagesChange={onCleanedImagesChange}
                  onUploadCleanedImages={onUploadCleanedImages}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </s-modal>
  );
}
