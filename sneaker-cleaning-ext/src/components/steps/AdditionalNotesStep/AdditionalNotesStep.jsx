import React from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import FormField from '../../shared/FormField/FormField.jsx';
import './AdditionalNotesStep.css';

function AdditionalNotesStep({ notes, onNotesChange, onNext, onPrev }) {
  return (
    <StepLayout title="Additional Notes" onNext={onNext} onPrev={onPrev}>
      <p className="step-description">
        Let us know about any specific problem areas, stains, odours, or special instructions
        for your sneakers.
      </p>
      <FormField label="Special Instructions">
        <textarea
          className="textarea"
          rows={6}
          placeholder="e.g. There is a scuff mark on the left toe box. The insoles smell bad. Please be extra careful with the suede panels."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </FormField>
    </StepLayout>
  );
}

export default AdditionalNotesStep;
