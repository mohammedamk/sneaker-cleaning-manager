import React from 'react';
import './StepLayout.css';

function StepLayout({ title, children, onNext, onPrev, nextLabel, prevLabel, isFirstStep, isLastStep, isLoading }) {
  return (
    <div className="step-layout">
      {title && <h2 className="step-layout__title">{title}</h2>}
      <div className="step-layout__content">{children}</div>
      <div className="step-layout__nav">
        {!isFirstStep && (
          <button className="btn btn--secondary" onClick={onPrev} disabled={isLoading}>
            {prevLabel || 'Previous'}
          </button>
        )}
        {onNext && (
          <button className="btn btn--primary" onClick={onNext} disabled={isLoading}>
            {isLoading ? 'Processing...' : (nextLabel || (isLastStep ? 'Finish' : 'Next'))}
          </button>
        )}
      </div>
    </div>
  );
}

export default StepLayout;
