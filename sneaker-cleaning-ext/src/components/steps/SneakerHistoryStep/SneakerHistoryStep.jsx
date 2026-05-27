import React, { useState, useEffect } from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import FormField from '../../shared/FormField/FormField.jsx';
import './SneakerHistoryStep.css';
import { fetchAdminSettings } from '../../../utils/adminSettings.js';

function SneakerHistoryStep({ history, onHistoryChange, onNext, onPrev }) {
  const [alterationOptions, setAlterationOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminSettings()
      .then(settings => {
        setAlterationOptions(settings.alterationOptions || []);
      })
      .catch(error => {
        console.error('Error loading admin settings:', error);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleAlterationToggle = (alterationId) => {
    const current = history.alterations || [];
    const updated = current.includes(alterationId)
      ? current.filter((id) => id !== alterationId)
      : [...current, alterationId];
    onHistoryChange({ ...history, alterations: updated });
  };

  if (isLoading) {
    return <StepLayout title="Footwear History" onNext={onNext} onPrev={onPrev}><div>Loading...</div></StepLayout>;
  }

  return (
    <StepLayout title="Footwear History" onNext={onNext} onPrev={onPrev}>
      <p className="step-description">
        This helps our team prepare the most effective cleaning method for your footwear.
      </p>

      <FormField label="Has this footwear been professionally cleaned before?">
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

      <FormField label="Has this footwear undergone any alterations?">
        <div className="checkbox-group">
          {alterationOptions.map((option) => (
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
