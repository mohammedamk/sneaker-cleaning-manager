import React from 'react';
import './ConfirmationStep.css';

function ConfirmationStep({ handoffMethod }) {
  return (
    <div className="confirmation-step">
      <div className="confirmation-step__icon">✔️</div>
      <h2 className="confirmation-step__title">You&apos;re All Set!</h2>
      <p className="confirmation-step__subtitle">
        Your sneaker cleaning request has been submitted successfully.
      </p>

      <div className="confirmation-step__info">
        <h3>What Happens Next</h3>
        <ol className="confirmation-step__steps">
          {handoffMethod === 'shipping' ? (
            <>
              <li>You will receive an email with your booking ID and shipping instructions.</li>
              <li>Label each pair with your booking ID and seal them in a plastic bag.</li>
              <li>Pack all pairs into one box and ship to our address.</li>
            </>
          ) : (
            <li>Bring your sneakers to our location during business hours.</li>
          )}
          <li>Our team will inspect each sneaker upon arrival.</li>
          <li>
            After inspection, we will send you the <strong>final confirmed price</strong> by
            email, along with a secure payment link.
          </li>
          <li>The cleaning service begins once your payment is approved.</li>
        </ol>
      </div>

      <div className="confirmation-step__note">
        <strong>Please Note:</strong> Estimated prices shown in the summary are subject to
        change based on the condition of your sneakers after inspection. The final price will
        always be communicated to you before any work begins.
      </div>

      <p className="confirmation-step__thanks">Thank you for choosing our service — we'll take great care of your kicks! 👟</p>
    </div>
  );
}

export default ConfirmationStep;
