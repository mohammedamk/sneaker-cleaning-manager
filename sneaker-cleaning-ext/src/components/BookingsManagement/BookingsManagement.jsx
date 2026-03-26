import React, { useState, useEffect } from 'react';
import './BookingsManagement.css';
import { PROXY_SUB_PATH } from '../../utils/global.js';
import BookingDetails from './BookingDetails.jsx';

function BookingsManagement({ customerID, onBack }) {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        if (customerID) {
            fetchBookings(1);
        }
    }, [customerID]);

    const fetchBookings = async (page = 1) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/apps/${PROXY_SUB_PATH}/api/get/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerID, page, limit: 10 })
            });
            const data = await res.json();
            if (data.success) {
                setBookings(data.bookings);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error("Error fetching bookings:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBooking = async (id) => {
        if (!window.confirm("Are you sure you want to delete this booking?")) return;

        try {
            const res = await fetch(`/apps/${PROXY_SUB_PATH}/api/delete/booking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.success) {
                setBookings(prev => prev.filter(b => b._id !== id));
                setSelectedBooking(null);
            } else {
                alert(data.message || "Failed to delete booking");
            }
        } catch (err) {
            console.error("Error deleting booking:", err);
            alert("An error occurred while deleting the booking.");
        }
    };

    if (selectedBooking) {
        return (
            <BookingDetails
                booking={selectedBooking}
                onBack={() => setSelectedBooking(null)}
                onDelete={handleDeleteBooking}
            />
        );
    }

    return (
        <div className="bookings-management">
            <div className="bookings-management__header">
                <h2 className="bookings-management__title">My Bookings</h2>
                <button className="btn btn--secondary" onClick={onBack}>← Back</button>
            </div>

            {isLoading && !bookings.length ? (
                <div className="loading-state">Loading your bookings...</div>
            ) : (
                <>
                    <div className="bookings-grid">
                        {bookings.length === 0 ? (
                            <p className="empty-state">No bookings found.</p>
                        ) : (
                            bookings.map(booking => (
                                <div
                                    key={booking._id}
                                    className="booking-card"
                                    onClick={() => setSelectedBooking(booking)}
                                >
                                    <div className="booking-card__header">
                                        <span className="booking-card__id">#{booking._id.slice(-6).toUpperCase()}</span>
                                        <span className={`booking-card__status booking-card__status--${booking.status}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="booking-card__body">
                                        <span className="booking-card__sneakers">
                                            {booking.sneakers?.length || 0} Sneaker(s)
                                        </span>
                                        <span className="booking-card__date">
                                            {new Date(booking.submittedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="booking-card__footer">
                                        {booking.sneakers?.slice(0, 3).map((snk, i) => (
                                            snk.images?.[0] && (
                                                <img
                                                    key={i}
                                                    src={snk.images[0]}
                                                    alt="thumb"
                                                    className="booking-card__thumb"
                                                />
                                            )
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn--small"
                                disabled={pagination.page === 1}
                                onClick={() => fetchBookings(pagination.page - 1)}
                            >
                                Previous
                            </button>
                            <span>Page {pagination.page} of {pagination.totalPages}</span>
                            <button
                                className="btn btn--small"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => fetchBookings(pagination.page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default BookingsManagement;
