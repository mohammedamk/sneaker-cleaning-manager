import React, { useState } from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import FormField from '../../shared/FormField/FormField.jsx';
import './CustomerCheckStep.css';

const RETURN_URL = '/pages/book-sneaker-pick-up';

// login/register urls
const SHOPIFY_LOGIN_URL =
  `/customer_authentication/login?return_to=${encodeURIComponent(
    RETURN_URL
  )}`;


const SHOPIFY_REGISTER_URL =
  `/customer_authentication/login?return_to=${encodeURIComponent(
    RETURN_URL
  )}`;

function CustomerCheckStep({
  customerID,
  guestInfo,
  onGuestInfoChange,
  onNext,
  onPrev,
}) {
  const [mode, setMode] = useState(customerID ? 'logged-in' : null);
  const [errors, setErrors] = useState({});
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const validate = () => {
    const newErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    }

    if (!guestInfo.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (!guestInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (mode === 'guest') {
      if (!validate()) return;
    }
    onNext();
  };

  const handleFieldChange = (field, value) => {
    onGuestInfoChange({
      ...guestInfo,
      [field]: value,
    });

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // HANDLE LOGIN CLICK
  const handleLoginClick = () => {
    window.location.href = SHOPIFY_LOGIN_URL;
  };

  // HANDLE REGISTER CLICK
  const handleRegisterClick = () => {
    window.location.href = SHOPIFY_REGISTER_URL;
  };

  // already logged in
  if (customerID) {
    return (
      <StepLayout
        title="Welcome Back!"
        onNext={onNext}
        nextLabel="Continue"
        isFirstStep={true}
      >
        <p className="customer-check__message">
          You are signed in. We&apos;ll use your account details for this booking.
        </p>
      </StepLayout>
    );
  }

  // login/register options
  if (!mode) {
    return (
      <StepLayout title="Account" onPrev={onPrev} isFirstStep={false}>
        <p className="customer-check__message">
          Sign in to save your sneakers and keep track of your orders,
          or continue as a guest.
        </p>

        <div className="customer-check__options">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleLoginClick}
          >
            Sign In
          </button>

          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleRegisterClick}
          >
            Create Account
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setMode('guest')}
          >
            Continue as Guest
          </button>
        </div>
      </StepLayout>
    );
  }

  // guest form
  return (
    <StepLayout
      title="Your Details"
      onNext={handleNext}
      onPrev={() => setMode(null)}
    >
      <FormField label="First Name" required error={errors.firstName}>
        <input
          className="input"
          type="text"
          placeholder="John"
          value={firstName}
          onChange={(e) => {
            const val = e.target.value;
            setFirstName(val);
            onGuestInfoChange({ ...guestInfo, name: `${val} ${lastName}`.trim() });
            if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
          }}
        />
      </FormField>
      <FormField label="Last Name" required error={errors.lastName}>
        <input
          className="input"
          type="text"
          placeholder="Doe"
          value={lastName}
          onChange={(e) => {
            const val = e.target.value;
            setLastName(val);
            onGuestInfoChange({ ...guestInfo, name: `${firstName} ${val}`.trim() });
            if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
          }}
        />
      </FormField>
      <FormField label="Email Address" required error={errors.email}>
        <input
          className="input"
          type="email"
          placeholder="john@example.com"
          value={guestInfo.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
        />
      </FormField>
      <FormField label="Phone Number" required error={errors.phone}>
        <input
          className="input"
          type="tel"
          placeholder="+1 555 000 0000"
          value={guestInfo.phone}
          onChange={(e) => handleFieldChange('phone', e.target.value)}
        />
      </FormField>
    </StepLayout>
  );
}

export default CustomerCheckStep;
