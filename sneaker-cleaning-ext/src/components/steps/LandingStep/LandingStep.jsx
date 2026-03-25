import React from 'react';
import './LandingStep.css';

function LandingStep({ onStart, customerID, onViewShoeRack }) {
  return (
    <div className="landing-step">
      {customerID && (
        <div className="landing-step__top-right">
          <button 
            className="btn btn--secondary btn--shoe-rack-top" 
            onClick={onViewShoeRack}
          >
            👟 My Shoe Rack
          </button>
        </div>
      )}
      <div className="landing-step__content">
        <h1 className="landing-step__title">Professional Sneaker Cleaning</h1>
        <p className="landing-step__description">
          Give your kicks the care they deserve. Our expert cleaning service handles everything
          from everyday grime to deep restoration — tailored specifically to your sneakers.
        </p>
        <ul className="landing-step__features">
          <li>Multiple cleaning tiers available</li>
          <li>Optional add-on services</li>
          <li>Drop-off or shipping options</li>
          <li>Final price confirmed after inspection</li>
        </ul>
        <div className="landing-step__actions">
          <button className="btn btn--primary btn--large" onClick={onStart}>
            Schedule Cleaning Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingStep;
