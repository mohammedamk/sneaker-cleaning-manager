import React from 'react';
import './BookingsManagement.css';

function BookingDetails({ booking, onBack, onDelete }) {
    return (
        <div className="bookings-management booking-details">
            <div className="bookings-management__header">
                <h2 className="bookings-management__title">Booking Details</h2>
                <button className="btn btn--secondary" onClick={onBack}>← Back to List</button>
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
                        <span className={`booking-card__status booking-card__status--${booking.status}`}>
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
                </div>
            </div>

            {booking.guestInfo && (booking.guestInfo.name || booking.guestInfo.email) && (
                <div className="booking-details__section">
                    <span className="booking-details__section-title">Customer Information</span>
                    <div className="booking-details__grid">
                        <div className="detail-item">
                            <span className="detail-item__label">Name</span>
                            <span className="detail-item__value">{booking.guestInfo.name || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item__label">Email</span>
                            <span className="detail-item__value">{booking.guestInfo.email || 'N/A'}</span>
                        </div>
                        {booking.guestInfo.phone && (
                            <div className="detail-item">
                                <span className="detail-item__label">Phone</span>
                                <span className="detail-item__value">{booking.guestInfo.phone}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="booking-details__section">
                <span className="booking-details__section-title">Registered Sneakers ({booking.sneakers?.length || 0})</span>
                <div className="booking-details__sneaker-list">
                    {booking.sneakers?.map((snk, i) => (
                        <div key={i} className="sneaker-item">
                            {snk.images?.[0] && (
                                <img src={snk.images[0]} alt={snk.nickname} className="sneaker-item__img" />
                            )}
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
    );
}

export default BookingDetails;
