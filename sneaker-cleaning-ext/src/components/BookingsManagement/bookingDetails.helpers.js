export function formatDateTime(value, fallback = 'Not completed yet') {
    if (!value) return fallback;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;

    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

export function getBookingStatusClassName(status) {
    return `booking-card__status booking-card__status--${status
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/\//g, '-')}`;
}

export function getSneakerApprovalStatus(sneaker) {
    const hasCleanedImages = Array.isArray(sneaker.cleanedImages) && sneaker.cleanedImages.length > 0;

    return {
        hasCleanedImages,
        approvalStatus: sneaker.cleanedImagesApprovalStatus || (hasCleanedImages ? 'pending' : null),
    };
}

export async function downloadImage(imageUrl, sneakerName, imageIndex) {
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
}
