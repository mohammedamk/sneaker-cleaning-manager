import React from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import SneakerCard from '../../shared/SneakerCard/SneakerCard.jsx';
import './ServiceSelectionStep.css';

function ServiceSelectionStep({ sneakers, services, onServiceChange, onNext, onPrev }) {
  const allHaveTier = sneakers.every(
    (sneaker) => services[sneaker.id]?.tier
  );

  const handleNext = () => {
    if (!allHaveTier) {
      alert('Please select a cleaning tier for each sneaker before continuing.');
      return;
    }
    onNext();
  };

  return (
    <StepLayout
      title="Select Services"
      onNext={handleNext}
      onPrev={onPrev}
      nextLabel="Review Summary"
    >
      <p className="step-description">
        Choose a cleaning tier for each sneaker and add any optional services you need.
      </p>
      <div className="sneaker-list">
        {sneakers.map((sneaker) => (
          <SneakerCard
            key={sneaker.id}
            sneaker={sneaker}
            mode="service"
            serviceSelection={services[sneaker.id] || { tier: '', addOns: [] }}
            onServiceChange={onServiceChange}
          />
        ))}
      </div>
    </StepLayout>
  );
}

export default ServiceSelectionStep;
