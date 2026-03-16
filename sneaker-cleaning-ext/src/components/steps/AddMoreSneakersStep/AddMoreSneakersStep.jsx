import React from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import SneakerCard from '../../shared/SneakerCard/SneakerCard.jsx';
import './AddMoreSneakersStep.css';

function AddMoreSneakersStep({ sneakers, onAddAnother, onEdit, onRemove, onNext, onPrev }) {
  return (
    <StepLayout
      title="Your Sneakers"
      onNext={onNext}
      onPrev={onPrev}
      nextLabel="Continue to Service Selection"
    >
      <p className="step-description">
        Review your registered sneakers. You can add more, edit, or remove any pair before
        proceeding.
      </p>

      {sneakers.length === 0 ? (
        <p className="empty-state">No sneakers registered yet.</p>
      ) : (
        <div className="sneaker-list">
          {sneakers.map((sneaker) => (
            <SneakerCard
              key={sneaker.id}
              sneaker={sneaker}
              mode="manage"
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}

      <button className="btn btn--secondary btn--add-sneaker" onClick={onAddAnother}>
        + Add Another Sneaker
      </button>
    </StepLayout>
  );
}

export default AddMoreSneakersStep;
