import React from 'react';
import './StepLayout.css';

function StepLayout({ title, children, onNext, onPrev, nextLabel, prevLabel, isFirstStep, isLastStep }) {
  return (
    <div className="step-layout">
      {title && <h2 className="step-layout__title">{title}</h2>}
      <div className="step-layout__content">{children}</div>
      <div className="step-layout__nav">
        {!isFirstStep && (
          <button className="btn btn--secondary" onClick={onPrev}>
            {prevLabel || 'Previous'}
          </button>
        )}
        {onNext && (
          <button className="btn btn--primary" onClick={onNext}>
            {nextLabel || (isLastStep ? 'Finish' : 'Next')}
          </button>
        )}
      </div>
    </div>
  );
}

export default StepLayout;
