/* eslint-disable react/prop-types */
export default function ImagePreviewModal({ imageUrl, onClose }) {
  if (!imageUrl) {
    return null;
  }

  return (
    <div className="booking-image-preview" role="dialog" aria-modal="true" aria-label="Booking sneaker image preview">
      <button
        type="button"
        className="booking-image-preview__backdrop"
        onClick={onClose}
        aria-label="Close booking image preview"
      />
      <div className="booking-image-preview__content">
        <button
          type="button"
          className="booking-image-preview__close"
          onClick={onClose}
          aria-label="Close booking image preview"
        >
          ×
        </button>
        <img src={imageUrl} alt="Booking sneaker preview" className="booking-image-preview__image" />
      </div>
    </div>
  );
}
