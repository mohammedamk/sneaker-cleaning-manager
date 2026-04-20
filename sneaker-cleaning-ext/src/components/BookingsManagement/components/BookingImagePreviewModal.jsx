export default function BookingImagePreviewModal({ imageUrl, onClose }) {
    if (!imageUrl) {
        return null;
    }

    return (
        <div className="image-preview-modal" role="dialog" aria-modal="true" aria-label="Sneaker image preview">
            <button
                type="button"
                className="image-preview-modal__backdrop"
                onClick={onClose}
                aria-label="Close image preview"
            />
            <div className="image-preview-modal__content">
                <button
                    type="button"
                    className="image-preview-modal__close"
                    onClick={onClose}
                    aria-label="Close image preview"
                >
                    ×
                </button>
                <img src={imageUrl} alt="Sneaker preview" className="image-preview-modal__image" />
            </div>
        </div>
    );
}
