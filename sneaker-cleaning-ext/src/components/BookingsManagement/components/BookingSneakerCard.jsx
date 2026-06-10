import { getSneakerApprovalStatus } from '../bookingDetails.helpers.js';

function SneakerImageCard({
    imageUrl,
    imageIndex,
    sneakerName,
    imageType,
    emptyLabel,
    onPreview,
    onDownload,
}) {
    if (!imageUrl) {
        return <div className="sneaker-item__empty-image">{emptyLabel}</div>;
    }

    return (
        <div className="sneaker-item__image-card">
            <img
                src={imageUrl}
                alt={`${sneakerName || 'Footwear'} ${imageType} ${imageIndex + 1}`}
                className="sneaker-item__img sneaker-item__img--interactive"
                onClick={() => onPreview(imageUrl)}
            />
            <div className="sneaker-item__image-actions">
                <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() => onPreview(imageUrl)}
                >
                    Preview
                </button>
                <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={onDownload}
                >
                    Download
                </button>
            </div>
        </div>
    );
}

function ServicesSection({ services, settingsLookup }) {
    if (!services) return null;

    const tierLabel = settingsLookup?.tierMap?.[services.tier] || services.tier;
    const addOns = (services.addOns || []).map(
        id => settingsLookup?.addonMap?.[id] || id
    );
    const quotedServices = (services.quotedServices || []).map(
        id => settingsLookup?.quotedServiceMap?.[id] || id
    );

    const hasAnything = services.tier || addOns.length > 0 || quotedServices.length > 0;
    if (!hasAnything) return null;

    return (
        <div className="sneaker-item__services-section">
            <span className="sneaker-item__services-heading">Selected Services</span>

            {services.tier && (
                <div className="sneaker-item__service-row">
                    <span className="sneaker-item__service-cat-label">Cleaning Tier</span>
                    <span className="sneaker-item__tier-badge">{tierLabel}</span>
                </div>
            )}

            {addOns.length > 0 && (
                <div className="sneaker-item__service-row">
                    <span className="sneaker-item__service-cat-label">Optional Add-ons</span>
                    <div className="sneaker-item__chips">
                        {addOns.map((label, i) => (
                            <span key={i} className="sneaker-item__chip">{label}</span>
                        ))}
                    </div>
                </div>
            )}

            {quotedServices.length > 0 && (
                <div className="sneaker-item__service-row">
                    <span className="sneaker-item__service-cat-label">Quoted Services</span>
                    <div className="sneaker-item__chips">
                        {quotedServices.map((label, i) => (
                            <span key={i} className="sneaker-item__chip sneaker-item__chip--quoted">
                                {label}
                                <span className="sneaker-item__chip-tbd">Quote Pending</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BookingSneakerCard({
    sneaker,
    sneakerIndex,
    settingsLookup,
    approvalLoadingBySneaker,
    approvalActionBySneaker,
    showRejectionNoteFormBySneaker,
    rejectionNoteBySneaker,
    onPreviewImage,
    onDownloadImage,
    onApprove,
    onShowRejectForm,
    onHideRejectForm,
    onRejectionNoteChange,
    onSubmitReject,
}) {
    const { hasCleanedImages, approvalStatus } = getSneakerApprovalStatus(sneaker);

    return (
        <div className="sneaker-item">
            {/* Header: name, brand, status */}
            <div className="sneaker-item__header">
                <div className="sneaker-item__header-info">
                    <span className="sneaker-item__name">{sneaker.nickname || 'Unnamed Footwear'}</span>
                    {(sneaker.brand || sneaker.model) && (
                        <span className="sneaker-item__brand">
                            {[sneaker.brand, sneaker.model, sneaker.colorway].filter(Boolean).join(' · ')}
                        </span>
                    )}
                </div>
                {sneaker.status && (
                    <span className="sneaker-item__status-pill">{sneaker.status}</span>
                )}
            </div>

            {/* Photo galleries */}
            <div className="sneaker-item__gallery">
                <div className="sneaker-item__gallery-section">
                    <span className="sneaker-item__gallery-title">Before cleaning</span>
                    <div className="sneaker-item__gallery-grid">
                        {sneaker.images?.length ? (
                            sneaker.images.map((imageUrl, imageIndex) => (
                                <SneakerImageCard
                                    key={`${sneaker._id || sneakerIndex}-before-${imageIndex}`}
                                    imageUrl={imageUrl}
                                    imageIndex={imageIndex}
                                    sneakerName={sneaker.nickname}
                                    imageType="before cleaning"
                                    onPreview={onPreviewImage}
                                    onDownload={() => onDownloadImage(imageUrl, `${sneaker.nickname || 'footwear'}-before`, imageIndex)}
                                />
                            ))
                        ) : (
                            <SneakerImageCard emptyLabel="No image uploaded" />
                        )}
                    </div>
                </div>

                <div className="sneaker-item__gallery-section sneaker-item__gallery-section--cleaned">
                    <div className="sneaker-item__gallery-header">
                        <span className="sneaker-item__gallery-title">After cleaning</span>
                        {hasCleanedImages && (
                            <span className={`booking-approval-pill booking-approval-pill--${approvalStatus}`}>
                                {approvalStatus === 'approved'
                                    ? 'Approved'
                                    : approvalStatus === 'rejected'
                                        ? 'Rejected'
                                        : 'Approval Pending'}
                            </span>
                        )}
                    </div>
                    <div className="sneaker-item__gallery-grid">
                        {sneaker.cleanedImages?.length ? (
                            sneaker.cleanedImages.map((imageUrl, imageIndex) => (
                                <SneakerImageCard
                                    key={`${sneaker._id || sneakerIndex}-after-${imageIndex}`}
                                    imageUrl={imageUrl}
                                    imageIndex={imageIndex}
                                    sneakerName={sneaker.nickname}
                                    imageType="after cleaning"
                                    onPreview={onPreviewImage}
                                    onDownload={() => onDownloadImage(imageUrl, `${sneaker.nickname || 'footwear'}-after`, imageIndex)}
                                />
                            ))
                        ) : (
                            <SneakerImageCard emptyLabel="Cleaning photos will appear here once uploaded" />
                        )}
                    </div>
                </div>

                {hasCleanedImages && (
                    <div className="sneaker-item__approval-section">
                        <div className="sneaker-item__approval-actions">
                            <button
                                type="button"
                                className="btn btn--primary btn--small approve-button"
                                onClick={() => onApprove(sneakerIndex)}
                                disabled={approvalLoadingBySneaker[sneakerIndex] || sneaker.cleanedImagesApprovalStatus === 'approved'}
                            >
                                {approvalLoadingBySneaker[sneakerIndex] && approvalActionBySneaker[sneakerIndex] === 'approved' ? 'Saving...' : 'Approve'}
                            </button>
                            <button
                                type="button"
                                className="btn btn--secondary btn--small"
                                onClick={() => onShowRejectForm(sneakerIndex)}
                                disabled={approvalLoadingBySneaker[sneakerIndex] || sneaker.cleanedImagesApprovalStatus === 'rejected'}
                            >
                                {approvalLoadingBySneaker[sneakerIndex] && approvalActionBySneaker[sneakerIndex] === 'rejected' ? 'Saving...' : 'Reject'}
                            </button>
                        </div>
                        {sneaker.cleanedImagesApprovalStatus === 'rejected' && sneaker.cleanedImagesApprovalNote && (
                            <div className="booking-details__note-box">
                                <label className="booking-details__note-label">Rejection Reason</label>
                                <div className="booking-details__note-display">
                                    {sneaker.cleanedImagesApprovalNote}
                                </div>
                            </div>
                        )}
                        {showRejectionNoteFormBySneaker[sneakerIndex] && sneaker.cleanedImagesApprovalStatus !== 'rejected' && (
                            <div className="booking-details__note-box">
                                <label className="booking-details__note-label" htmlFor={`rejection-note-${sneakerIndex}`}>
                                    What needs correction?
                                </label>
                                <textarea
                                    id={`rejection-note-${sneakerIndex}`}
                                    className="booking-details__note-input"
                                    rows={3}
                                    value={rejectionNoteBySneaker[sneakerIndex] || ''}
                                    onChange={(event) => onRejectionNoteChange(sneakerIndex, event.target.value)}
                                    placeholder="Tell us what still needs attention before approval."
                                />
                                <div className="booking-details__note-actions">
                                    <button
                                        type="button"
                                        className="btn btn--secondary btn--small"
                                        onClick={() => onHideRejectForm(sneakerIndex)}
                                        disabled={approvalLoadingBySneaker[sneakerIndex]}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn--secondary btn--small"
                                        onClick={() => onSubmitReject(sneakerIndex)}
                                        disabled={approvalLoadingBySneaker[sneakerIndex]}
                                    >
                                        {approvalLoadingBySneaker[sneakerIndex] && approvalActionBySneaker[sneakerIndex] === 'rejected' ? 'Saving...' : 'Submit Rejection'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Services section */}
            <ServicesSection services={sneaker.services} settingsLookup={settingsLookup} />
        </div>
    );
}
