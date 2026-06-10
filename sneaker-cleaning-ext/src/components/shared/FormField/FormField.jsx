/* eslint-disable react/prop-types */
import { useState } from 'react';
import './FormField.css';

function FormField({ label, required, error, children, htmlFor, tooltip }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="form-field">
      {label && (
        <label className="form-field__label" htmlFor={htmlFor}>
          {label}
          {required && <span className="form-field__required"> *</span>}
          {tooltip && (
            <span
              className="form-field__tooltip-wrap"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(v => !v)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowTooltip(v => !v);
                }
              }}
              aria-label="More information"
            >
              <svg
                className="form-field__tooltip-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              {showTooltip && (
                <div className="form-field__tooltip" role="tooltip">
                  {tooltip}
                </div>
              )}
            </span>
          )}
        </label>
      )}
      {children}
      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
}

export default FormField;
