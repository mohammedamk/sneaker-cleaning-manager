export default function BookingInfoSection({ title, children }) {
    return (
        <div className="booking-details__section">
            <span className="booking-details__section-title">{title}</span>
            {children}
        </div>
    );
}
