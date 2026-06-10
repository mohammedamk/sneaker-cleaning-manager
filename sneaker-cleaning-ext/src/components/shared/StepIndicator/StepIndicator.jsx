import React from 'react';
import './StepIndicator.css';

// Maps each visual step to the internal wizard step range it covers
const VISUAL_STEPS = [
  { label: 'Account',  internalRange: [1, 1],   targetStep: 1 },
  { label: 'Footwear', internalRange: [2, 4],   targetStep: 2 },
  { label: 'Review',   internalRange: [5, 5],   targetStep: 5 },
  { label: 'Services', internalRange: [6, 6],   targetStep: 6 },
  { label: 'Summary',  internalRange: [7, 10],  targetStep: 7 },
];

function StepIndicator({ currentStep, highestReachedStep = 1, onStepClick }) {
  return (
    <nav className="stepper-container">
      <ol className="stepper">
        {VISUAL_STEPS.map((vs, index) => {
          const [rangeStart, rangeEnd] = vs.internalRange;
          const isActive    = currentStep >= rangeStart && currentStep <= rangeEnd;
          const isCompleted = !isActive && highestReachedStep >= rangeStart;
          const isClickable = Boolean(onStepClick) && highestReachedStep >= vs.targetStep;

          return (
            <li
              key={vs.label}
              className={[
                'stepper__item',
                isCompleted ? 'is-completed' : '',
                isActive    ? 'is-active'    : '',
                isClickable ? 'is-clickable' : '',
              ].filter(Boolean).join(' ')}
              onClick={isClickable ? () => onStepClick(vs.targetStep) : undefined}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={isClickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStepClick(vs.targetStep);
                }
              } : undefined}
            >
              <div className="stepper__icon">
                {isCompleted
                  ? <span className="stepper__check">✓</span>
                  : (index + 1)}
              </div>
              <span className="stepper__label">{vs.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default StepIndicator;