import { useEffect, useState } from 'react';
import './BookingsManagement.css';
import { PROXY_SUB_PATH } from '../../utils/global.js';
import FormField from '../shared/FormField/FormField.jsx';
import BookingDetails from './BookingDetails.jsx';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GuestBookingLookup({ onBack }) {
  const [hasSecureLink] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('bookingId') && params.get('accessToken'));
    } catch {
      return false;
    }
  });
  const [formData, setFormData] = useState({ bookingID: '', email: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(hasSecureLink);
  const [serverError, setServerError] = useState('');
  const [booking, setBooking] = useState(null);

  const fetchBooking = async ({ bookingID, email, accessToken }) => {
    setIsLoading(true);
    setServerError('');
    setBooking(null);

    try {
      const response = await fetch(`/apps/${PROXY_SUB_PATH}/api/get/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingID,
          ...(email ? { email } : {}),
          ...(accessToken ? { accessToken } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setServerError(data.message || 'We could not find a booking with those details.');
        return;
      }

      setBooking(data.booking);
    } catch (error) {
      console.error('Error looking up booking:', error);
      setServerError('Something went wrong while looking up your booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingID = params.get('bookingId')?.trim();
    const accessToken = params.get('accessToken')?.trim();

    if (bookingID) {
      setFormData((prev) => ({ ...prev, bookingID }));
    }

    if (bookingID && accessToken) {
      fetchBooking({ bookingID, accessToken });
    }
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setServerError('');

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    const bookingID = formData.bookingID.trim();
    const email = formData.email.trim();

    if (!bookingID) {
      nextErrors.bookingID = 'Booking ID is required.';
    } else if (!/^[a-f\d]{24}$/i.test(bookingID)) {
      nextErrors.bookingID = 'Enter a valid booking ID.';
    }

    if (!email) {
      nextErrors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    fetchBooking({
      bookingID: formData.bookingID.trim(),
      email: formData.email.trim(),
    });
  };

  if (booking) {
    return (
      <BookingDetails
        booking={booking}
        onBookingUpdate={setBooking}
        onBack={() => setBooking(null)}
        title="Your Booking"
        backLabel="← Back to Lookup"
      />
    );
  }

  if (hasSecureLink && isLoading) {
    return (
      <div className="bookings-management booking-lookup">
        <div className="bookings-management__header">
          <h2 className="bookings-management__title">Loading Your Booking</h2>
          <button className="btn btn--secondary" onClick={onBack}>← Back</button>
        </div>

        <p className="booking-lookup__description">
          Opening your secure booking details...
        </p>
      </div>
    );
  }

  return (
    <div className="bookings-management booking-lookup">
      <div className="bookings-management__header">
        <h2 className="bookings-management__title">View Your Booking</h2>
        <button className="btn btn--secondary" onClick={onBack}>← Back</button>
      </div>

      <p className="booking-lookup__description">
        Enter the booking ID from your confirmation email and the email address used for the booking.
      </p>

      <form className="booking-lookup__form" onSubmit={handleSubmit}>
        <FormField label="Booking ID" required error={errors.bookingID} htmlFor="guest-booking-id">
          <input
            id="guest-booking-id"
            className="input"
            type="text"
            placeholder="64f123abc456def789012345"
            value={formData.bookingID}
            onChange={(event) => handleFieldChange('bookingID', event.target.value)}
          />
        </FormField>

        <FormField label="Email Address" required error={errors.email} htmlFor="guest-booking-email">
          <input
            id="guest-booking-email"
            className="input"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(event) => handleFieldChange('email', event.target.value)}
          />
        </FormField>

        {serverError && <p className="booking-lookup__error">{serverError}</p>}

        <div className="booking-lookup__actions">
          <button className="btn btn--primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Looking Up Booking...' : 'View Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default GuestBookingLookup;
