import React, { useState } from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import './HandoffMethodStep.css';
import { PROXY_SUB_PATH } from '../../../utils/global.js';

function HandoffMethodStep({ handoffMethod, onHandoffChange, onNext, onPrev, bookingData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    if (!handoffMethod) {
      alert('Please select a handoff method to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      // converting all sneaker image files to base64
      const sneakersWithBase64Images = await Promise.all(
        bookingData.sneakers.map(async (sneaker) => {
          const base64Images = await Promise.all(
            sneaker.images.map((img) => {
              return new Promise((resolve, reject) => {
                // if it's already a string/URL somehow, ignoring
                if (typeof img === 'string') return resolve(img);
                if (img.id && !img.file) return resolve(img.id);
                if (!img.file) return resolve(img.url || img.preview || '');
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(img.file);
              });
            })
          );
          // returning the sneaker clone with base64 images string array
          return { ...sneaker, images: base64Images };
        })
      );

      const payload = {
        ...bookingData,
        sneakers: sneakersWithBase64Images,
        handoffMethod,
        submittedAt: new Date().toISOString()
      };

      console.log('Final Data ready to be sent to API:', payload);
      const response = await fetch(`/apps/${PROXY_SUB_PATH}/api/create/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      console.log("result .........", result)

      if (result.success && result.invoiceUrl) {
        window.location.href = result.invoiceUrl;
      } else {
        onNext();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error saving your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StepLayout
      title="How Will You Send Your Sneakers?"
      onNext={handleNext}
      onPrev={onPrev}
      nextLabel="Confirm Booking"
      isLoading={isSubmitting}
    >
      <div className="handoff-options">
        <div
          className={`handoff-card ${handoffMethod === 'dropoff' ? 'handoff-card--selected' : ''}`}
          onClick={() => onHandoffChange('dropoff')}
        >
          <div className="handoff-card__icon">📍</div>
          <h3 className="handoff-card__title">Drop-Off</h3>
          <p className="handoff-card__desc">Bring your sneakers directly to our location.</p>
          {handoffMethod === 'dropoff' && (
            <div className="handoff-card__instructions">
              <p><strong>Drop-off Location:</strong></p>
              <p>123 Sneaker Lane, Suite 4<br />New York, NY 10001</p>
              <p><strong>Hours:</strong> Mon–Sat, 9 AM – 6 PM</p>
              <div className="handoff-policy-info">
                <p><strong>Time Window:</strong> Please drop off your sneakers within 48 hours of booking. <b>Orders not completed within this window will be automatically canceled.</b></p>
                <p><strong>Pickup Policy:</strong> Once cleaned, sneakers must be picked up by the customer from our location. <b>Items will be held for up to 6 months before being disposed of.</b></p>
              </div>
              <p><strong>Next Steps:</strong> Bring your sneakers in any bag and mention your booking reference at the counter. <b>No scheduling is required;</b> just drop by during our opening hours.</p>
            </div>
          )}
        </div>

        <div
          className={`handoff-card ${handoffMethod === 'shipping' ? 'handoff-card--selected' : ''}`}
          onClick={() => onHandoffChange('shipping')}
        >
          <div className="handoff-card__icon">📦</div>
          <h3 className="handoff-card__title">Shipping</h3>
          <p className="handoff-card__desc">Ship your sneakers to us using any carrier.</p>
          {handoffMethod === 'shipping' && (
            <div className="handoff-card__instructions">
              <p><strong>Shipping Instructions:</strong></p>
              <ol className="handoff-instructions-list">
                <li>Label each pair with your booking ID (sent to your email).</li>
                <li>Place each pair in a separate plastic bag.</li>
                <li>Pack all pairs into one shipping box.</li>
                <li>Ship to: <strong>123 Sneaker Lane, Suite 4, New York, NY 10001</strong></li>
              </ol>
              <p><em>We recommend using a tracked shipping service. We are not responsible for items lost during shipping.</em></p>
            </div>
          )}
        </div>
      </div>
    </StepLayout>
  );
}

export default HandoffMethodStep;
