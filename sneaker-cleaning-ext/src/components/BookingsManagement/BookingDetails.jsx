import { useState } from 'react';
import './BookingsManagement.css';

function BookingDetails({
    booking,
    onBack,
    title = 'Booking Details',
    backLabel = '← Back to List'
}) {
    const [previewImage, setPreviewImage] = useState(null);
    const hasAnyCleanedImages = (booking.sneakers || []).some(
        (sneaker) => Array.isArray(sneaker.cleanedImages) && sneaker.cleanedImages.length > 0
    );

    const handleDownloadImage = async (imageUrl, sneakerName, imageIndex) => {
        if (!imageUrl) return;

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const sanitizedName = (sneakerName || 'sneaker')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            link.href = objectUrl;
            link.download = `${sanitizedName || 'sneaker'}-${imageIndex + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error('Failed to download sneaker image:', error);
            window.open(imageUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <>
            <div className="bookings-management booking-details">
                <div className="bookings-management__header">
                    <h2 className="bookings-management__title">{title}</h2>
                    <button className="btn btn--secondary" onClick={onBack}>{backLabel}</button>
                </div>

                <div className="booking-details__section">
                    <span className="booking-details__section-title">General Information</span>
                    <div className="booking-details__grid">
                        <div className="detail-item">
                            <span className="detail-item__label">Booking ID</span>
                            <span className="detail-item__value">#{booking._id}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item__label">Status</span>
                            <span
                                className={`booking-card__status booking-card__status--${booking.status
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")
                                    .replace(/\//g, "-")}`}
                            >
                                {booking.status}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item__label">Submitted On</span>
                            <span className="detail-item__value">
                                {new Date(booking.submittedAt).toLocaleDateString()} {new Date(booking.submittedAt).toLocaleTimeString()}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item__label">Handoff Method</span>
                            <span className="detail-item__value" style={{ textTransform: 'capitalize' }}>
                                {booking.handoffMethod}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item__label">Cleaning Photos</span>
                            <span className="detail-item__value">
                                {hasAnyCleanedImages ? 'Uploaded and ready to view' : 'Will appear after cleaning is completed'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="booking-details__section">
                    <span className="booking-details__section-title">Customer Information</span>
                    <div className="booking-details__grid">
                        <div className="detail-item">
                            <span className="detail-item__label">Name</span>
                            <span className="detail-item__value">{booking.guestInfo?.name || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item__label">Email</span>
                            <span className="detail-item__value">{booking.guestInfo?.email || 'N/A'}</span>
                        </div>
                        {booking.guestInfo?.phone && (
                            <div className="detail-item">
                                <span className="detail-item__label">Phone</span>
                                <span className="detail-item__value">{booking.guestInfo.phone}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="booking-details__section">
                    <span className="booking-details__section-title">Registered Sneakers ({booking.sneakers?.length || 0})</span>
                    <div className="booking-details__sneaker-list">
                        {booking.sneakers?.map((snk, i) => (
                            <div key={i} className="sneaker-item">
                                <div className="sneaker-item__gallery">
                                    <div className="sneaker-item__gallery-section">
                                        <span className="sneaker-item__gallery-title">Before cleaning</span>
                                        <div className="sneaker-item__gallery-grid">
                                            {snk.images?.length ? (
                                                snk.images.map((imageUrl, imageIndex) => (
                                                    <div key={`${snk._id || i}-before-${imageIndex}`} className="sneaker-item__image-card">
                                                        <img
                                                            src={imageUrl}
                                                            alt={`${snk.nickname || 'Sneaker'} before cleaning ${imageIndex + 1}`}
                                                            className="sneaker-item__img sneaker-item__img--interactive"
                                                            onClick={() => setPreviewImage(imageUrl)}
                                                        />
                                                        <div className="sneaker-item__image-actions">
                                                            <button
                                                                type="button"
                                                                className="btn btn--secondary btn--small"
                                                                onClick={() => setPreviewImage(imageUrl)}
                                                            >
                                                                Preview
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn--secondary btn--small"
                                                                onClick={() => handleDownloadImage(imageUrl, `${snk.nickname || 'sneaker'}-before`, imageIndex)}
                                                            >
                                                                Download
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="sneaker-item__empty-image">No image uploaded</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="sneaker-item__gallery-section sneaker-item__gallery-section--cleaned">
                                        <span className="sneaker-item__gallery-title">After cleaning</span>
                                        <div className="sneaker-item__gallery-grid">
                                            {snk.cleanedImages?.length ? (
                                                snk.cleanedImages.map((imageUrl, imageIndex) => (
                                                    <div key={`${snk._id || i}-after-${imageIndex}`} className="sneaker-item__image-card">
                                                        <img
                                                            src={imageUrl}
                                                            alt={`${snk.nickname || 'Sneaker'} after cleaning ${imageIndex + 1}`}
                                                            className="sneaker-item__img sneaker-item__img--interactive"
                                                            onClick={() => setPreviewImage(imageUrl)}
                                                        />
                                                        <div className="sneaker-item__image-actions">
                                                            <button
                                                                type="button"
                                                                className="btn btn--secondary btn--small"
                                                                onClick={() => setPreviewImage(imageUrl)}
                                                            >
                                                                Preview
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn--secondary btn--small"
                                                                onClick={() => handleDownloadImage(imageUrl, `${snk.nickname || 'sneaker'}-after`, imageIndex)}
                                                            >
                                                                Download
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="sneaker-item__empty-image">Cleaning photos will appear here once uploaded</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="sneaker-item__info">
                                    <span className="sneaker-item__name">{snk.nickname || 'Unnamed'}</span>
                                    <span className="sneaker-item__brand">
                                        {snk.brand} {snk.model} {snk.colorway && ` - ${snk.colorway}`}
                                    </span>
                                    {snk.services && (
                                        <div className="sneaker-item__service">
                                            <strong>Service:</strong> {snk.services.tier}
                                            {snk.services.addOns?.length > 0 && ` + ${snk.services.addOns.join(', ')}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* <div className="booking-details__actions">
                    <button 
                        className="btn btn--secondary" 
                        onClick={() => alert("Edit feature coming soon. Please contact us for changes.")}
                    >
                        Edit Booking
                    </button>
                    <button 
                        className="btn btn--danger" 
                        onClick={() => onDelete(booking._id)}
                    >
                        Delete Booking
                    </button>
                </div> */}
            </div>

            {previewImage && (
                <div className="image-preview-modal" role="dialog" aria-modal="true" aria-label="Sneaker image preview">
                    <button
                        type="button"
                        className="image-preview-modal__backdrop"
                        onClick={() => setPreviewImage(null)}
                        aria-label="Close image preview"
                    />
                    <div className="image-preview-modal__content">
                        <button
                            type="button"
                            className="image-preview-modal__close"
                            onClick={() => setPreviewImage(null)}
                            aria-label="Close image preview"
                        >
                            ×
                        </button>
                        <img src={previewImage} alt="Sneaker preview" className="image-preview-modal__image" />
                    </div>
                </div>
            )}
        </>
    );
}

export default BookingDetails;
