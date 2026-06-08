/* eslint-disable react/prop-types */
import './LandingStep.css';
import AppIcon from '../../shared/AppIcon/AppIcon.jsx';

function LandingStep({ onStart, customerID, onViewShoeRack, onViewBookings, onViewGuestBooking }) {
  return (
    <div className="landing-step">
      {customerID && (
        <div className="landing-step__top-right">
          <button
            className="btn btn--secondary btn--shoe-rack-top"
            onClick={onViewShoeRack}
          >
            <span className="btn__content">
              <AppIcon name="shoeRack" />
              <span>My Shoe Rack</span>
            </span>
          </button>
          <button
            className="btn btn--secondary btn--shoe-rack-top"
            onClick={onViewBookings}
          >
            <span className="btn__content">
              <AppIcon name="bookings" />
              <span>My Bookings</span>
            </span>
          </button>
        </div>
      )}
      <div className="landing-step__content">
        <h1 className="landing-step__title">Professional Footwear Cleaning</h1>
        <p className="landing-step__description">
          Give your footwear the care they deserve. Our expert cleaning professionals handle everything from everyday grime to deep restoration - tailored specifically to your footwear.
        </p>
        <ul className="landing-step__features">
          <li>Multiple cleaning tiers available</li>
          <li>Optional add-on services</li>
          <li>Multiple hand-off options</li>
          <li>Final price confirmed after inspection</li>
        </ul>
        <div className="landing-step__actions">
          <button className="btn btn--primary btn--large" onClick={onStart}>
            Schedule Cleaning Now
          </button>
          {!customerID && (
            <button className="btn btn--secondary btn--large" onClick={onViewGuestBooking}>
              View Your Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LandingStep;
