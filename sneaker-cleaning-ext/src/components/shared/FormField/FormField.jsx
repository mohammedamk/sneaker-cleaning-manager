import React from 'react';
import './FormField.css';

function FormField({ label, required, error, children }) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-field__label">
          {label}
          {required && <span className="form-field__required"> *</span>}
        </label>
      )}
      {children}
      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
}

export default FormField;
