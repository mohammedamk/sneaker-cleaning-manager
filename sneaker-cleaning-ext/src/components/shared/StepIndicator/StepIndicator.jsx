import React from 'react';
import './StepIndicator.css';

const STEP_LABELS = [
  'Account', 'Sneakers', 'History', 'Notes', 'Review',
  'Services', 'Summary', 'Handoff', 'Done',
];

function StepIndicator({ currentStep, totalSteps = 10 }) {
  const steps = STEP_LABELS.slice(0, totalSteps);

  return (
    <nav className="stepper-container">
      <ol className="stepper">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <li
              key={stepNumber}
              className={`stepper__item ${isCompleted || currentStep === 9 ? 'is-completed' : ''} ${isActive ? 'is-active' : ''}`}
            >
              <div className="stepper__icon">
                {isCompleted || currentStep === 9 ? <span className="stepper__check">✓</span> : stepNumber}
              </div>
              <span className="stepper__label">{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default StepIndicator;