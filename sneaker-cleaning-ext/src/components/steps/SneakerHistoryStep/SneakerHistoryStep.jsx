import React from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import FormField from '../../shared/FormField/FormField.jsx';
import './SneakerHistoryStep.css';

const ALTERATION_OPTIONS = [
  { id: 'repainting', label: 'Repainting' },
  { id: 'resoling', label: 'Resoling' },
  { id: 'deoxidation', label: 'Deoxidation' },
  { id: 'modifications', label: 'Other Modifications' },
];

function SneakerHistoryStep({ history, onHistoryChange, onNext, onPrev }) {
  const handleAlterationToggle = (alterationId) => {
    const current = history.alterations || [];
    const updated = current.includes(alterationId)
      ? current.filter((id) => id !== alterationId)
      : [...current, alterationId];
    onHistoryChange({ ...history, alterations: updated });
  };

  return (
    <StepLayout title="Sneaker History" onNext={onNext} onPrev={onPrev}>
      <p className="step-description">
        This helps our team prepare the most effective cleaning method for your sneakers.
      </p>

      <FormField label="Has this sneaker been professionally cleaned before?">
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="professionally-cleaned"
              value="yes"
              checked={history.professionallyCleaned === 'yes'}
              onChange={() => onHistoryChange({ ...history, professionallyCleaned: 'yes' })}
            />
            <span>Yes</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="professionally-cleaned"
              value="no"
              checked={history.professionallyCleaned === 'no'}
              onChange={() => onHistoryChange({ ...history, professionallyCleaned: 'no' })}
            />
            <span>No</span>
          </label>
        </div>
      </FormField>

      <FormField label="Has this sneaker undergone any alterations?">
        <div className="checkbox-group">
          {ALTERATION_OPTIONS.map((option) => (
            <label key={option.id} className="checkbox-option">
              <input
                type="checkbox"
                checked={(history.alterations || []).includes(option.id)}
                onChange={() => handleAlterationToggle(option.id)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </FormField>
    </StepLayout>
  );
}

export default SneakerHistoryStep;
