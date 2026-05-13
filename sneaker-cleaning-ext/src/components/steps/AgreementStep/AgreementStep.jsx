/* eslint-disable react/prop-types */
import React from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import './AgreementStep.css';

const POLICY_REFERENCES = [
  { id: 'terms', label: 'Terms of Service' },
  { id: 'shipping', label: 'Shipping Instructions & Disclaimer' },
  { id: 'refunds', label: 'Refund Policy' },
  { id: 'service', label: 'Service Disclaimer / Restoration Risk Policy' },
  { id: 'intake', label: 'Intake Accuracy & Customer Disclosure Policy' },
  { id: 'privacy', label: 'Privacy Policy' },
];

function PolicyReferenceList() {
  return (
    <>
      {POLICY_REFERENCES.map((policy, index) => {
        const isLastItem = index === POLICY_REFERENCES.length - 1;
        const isSecondToLastItem = index === POLICY_REFERENCES.length - 2;

        return (
          <React.Fragment key={policy.id}>
            <span className="agreement-step__policy-link">{policy.label}</span>
            {!isLastItem && (isSecondToLastItem ? ', and ' : ', ')}
          </React.Fragment>
        );
      })}
      <span>, and all other applicable policies.</span>
    </>
  );
}

function AgreementStep({ bookingAgreements, onBookingAgreementsChange, onNext, onPrev }) {
  const handleNext = () => {
    if (!bookingAgreements?.policiesAccepted) {
      alert('Please accept the agreement before continuing.');
      return;
    }

    onNext();
  };

  return (
    <StepLayout
      title="Agreement"
      onNext={handleNext}
      onPrev={onPrev}
      nextLabel="Choose Handoff Method"
    >
      <div className="agreement-step">
        <div className="agreement-step__card">
          <p className="agreement-step__text">
            I have reviewed and agree to the Save Our Soles <PolicyReferenceList /> I understand that footwear cleaning, sanitation, deodorization, and restoration involve inherent risk, that results are not guaranteed, that I am responsible for providing accurate order information, and that Save Our Soles may contact me about my order.
          </p>

          <label className="agreement-step__checkbox">
            <input
              type="checkbox"
              checked={Boolean(bookingAgreements?.policiesAccepted)}
              onChange={(event) =>
                onBookingAgreementsChange((current) => ({
                  ...current,
                  policiesAccepted: event.target.checked,
                }))}
            />
            <span>I agree to the policies and acknowledgments above.</span>
          </label>
        </div>
      </div>
    </StepLayout>
  );
}

export default AgreementStep;
