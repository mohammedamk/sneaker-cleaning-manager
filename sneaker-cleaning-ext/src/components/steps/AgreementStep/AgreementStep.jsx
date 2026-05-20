/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import './AgreementStep.css';
import { fetchAdminSettings } from '../../../utils/adminSettings.js';

function AgreementStep({ bookingAgreements, onBookingAgreementsChange, onNext, onPrev }) {
  const [policyReferences, setPolicyReferences] = useState([]);
  const [agreementText, setAgreementText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminSettings()
      .then(settings => {
        setPolicyReferences(settings.policyReferences || []);
        setAgreementText(settings.agreementAcknowledgment || 'I have reviewed and agree to the Save Our Soles policies. I have reviewed and agree to the Save Our Soles {{PolicyReferences}}, and all other applicable policies. I understand that footwear cleaning, sanitation, deodorization, and restoration involve inherent risk, that results are not guaranteed, that I am responsible for providing accurate order information, and that Save Our Soles may contact me about my order.');
      })
      .catch(error => {
        console.error('Error loading admin settings:', error);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const PolicyReferenceList = () => {
    return (
      <>
        {policyReferences.map((policy, index) => {
          const isLastItem = index === policyReferences.length - 1;
          const isSecondToLastItem = index === policyReferences.length - 2;

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
  };

  const handleNext = () => {
    if (!bookingAgreements?.policiesAccepted) {
      alert('Please accept the agreement before continuing.');
      return;
    }

    onNext();
  };

  if (isLoading) {
    return <StepLayout title="Agreement" onNext={handleNext} onPrev={onPrev}><div>Loading...</div></StepLayout>;
  }

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
            {agreementText.includes('{{PolicyReferences}}') ? (
              <>
                {agreementText
                  .split('{{PolicyReferences}}')
                  .map((part, index, array) => (
                    <React.Fragment key={index}>
                      {part}

                      {index !== array.length - 1 && (
                        <PolicyReferenceList />
                      )}
                    </React.Fragment>
                  ))}
              </>
            ) : (
              agreementText
            )}
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
