/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import FormField from '../../shared/FormField/FormField.jsx';
import './HandoffMethodStep.css';
import { PROXY_SUB_PATH } from '../../../utils/global.js';

const REQUIRED_ADDRESS_FIELDS = ['name', 'street1', 'city', 'state', 'zip', 'phone'];
const REQUIRED_PARCEL_FIELDS = ['length', 'width', 'height', 'weight'];
const PICKUP_AND_RETURN_METHOD = 'pickup_delivery';

function getShippingTotal(shippingSelection) {
  return (
    Number(shippingSelection?.selectedForwardRate?.amount || 0) +
    Number(shippingSelection?.selectedReturnRate?.amount || 0)
  );
}

function HandoffMethodStep({
  handoffMethod,
  onHandoffChange,
  shippingSelection,
  onShippingChange,
  onNext,
  onPrev,
  bookingData,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [shippingError, setShippingError] = useState('');

  const shippingAddress = shippingSelection?.customerAddress || {};
  const parcel = shippingSelection?.parcel || {};
  const shippingRates = shippingSelection?.rates;

  const selectedShippingTotal = useMemo(
    () => getShippingTotal(shippingSelection).toFixed(2),
    [shippingSelection],
  );

  const updateShippingSelection = (updater) => {
    onShippingChange(typeof updater === 'function' ? updater(shippingSelection) : updater);
  };

  const clearRates = (nextSelection) => ({
    ...nextSelection,
    rates: null,
    selectedForwardRate: null,
    selectedReturnRate: null,
  });

  const requiresCustomerAddress = handoffMethod === 'shipping' || handoffMethod === PICKUP_AND_RETURN_METHOD;

  const handleAddressChange = (field, value) => {
    setShippingError('');
    updateShippingSelection((current) =>
      clearRates({
        ...current,
        customerAddress: {
          ...current.customerAddress,
          [field]: value,
        },
      }),
    );
  };

  const handleParcelChange = (field, value) => {
    setShippingError('');
    updateShippingSelection((current) =>
      clearRates({
        ...current,
        parcel: {
          ...current.parcel,
          [field]: value,
        },
      }),
    );
  };

  const handleRateSelect = (direction, rate) => {
    setShippingError('');
    updateShippingSelection((current) => ({
      ...current,
      [direction === 'forward' ? 'selectedForwardRate' : 'selectedReturnRate']: rate,
    }));
  };

  const validateShippingInputs = () => {
    const missingAddressFields = REQUIRED_ADDRESS_FIELDS.filter((field) => !String(shippingAddress[field] || '').trim());
    const missingParcelFields = REQUIRED_PARCEL_FIELDS.filter((field) => !String(parcel[field] || '').trim());

    if (missingAddressFields.length || missingParcelFields.length) {
      const messages = [];
      if (missingAddressFields.length) {
        messages.push(`address: ${missingAddressFields.join(', ')}`);
      }
      if (missingParcelFields.length) {
        messages.push(`package: ${missingParcelFields.join(', ')}`);
      }
      throw new Error(`Please complete the required shipping details (${messages.join(' | ')})`);
    }
  };

  const validateCustomerAddress = () => {
    const missingAddressFields = REQUIRED_ADDRESS_FIELDS.filter((field) => !String(shippingAddress[field] || '').trim());

    if (missingAddressFields.length) {
      throw new Error(`Please complete the required address details (${missingAddressFields.join(', ')})`);
    }
  };

  const handleFetchRates = async () => {
    try {
      validateShippingInputs();
      setIsFetchingRates(true);
      setShippingError('');

      const response = await fetch(`/apps/${PROXY_SUB_PATH}/api/shipping/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerAddress: {
            ...shippingAddress,
            email: shippingAddress.email || bookingData.guestInfo?.email || '',
          },
          parcel,
          referencePrefix: bookingData.customerID || bookingData.guestInfo?.email || 'booking',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to fetch shipping rates');
      }

      updateShippingSelection((current) => ({
        ...current,
        rates: result.quotes,
        storeAddress: result.quotes.storeAddress,
        selectedForwardRate: null,
        selectedReturnRate: null,
      }));
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      setShippingError(error.message || 'Unable to fetch shipping rates');
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleNext = async () => {
    if (!handoffMethod) {
      alert('Please select a handoff method to continue.');
      return;
    }

    if (handoffMethod === 'shipping') {
      try {
        validateShippingInputs();
      } catch (error) {
        setShippingError(error.message);
        return;
      }

      if (!shippingRates?.customerToStore?.rates?.length || !shippingRates?.storeToCustomer?.rates?.length) {
        setShippingError('Fetch available USPS and UPS rates before continuing.');
        return;
      }

      if (!shippingSelection?.selectedForwardRate || !shippingSelection?.selectedReturnRate) {
        setShippingError('Select one rate for both customer-to-store and store-to-customer shipping.');
        return;
      }
    }

    if (handoffMethod === PICKUP_AND_RETURN_METHOD) {
      try {
        validateCustomerAddress();
      } catch (error) {
        setShippingError(error.message);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // converting all sneaker image files to base64
      const sneakersWithBase64Images = await Promise.all(
        bookingData.sneakers.map(async (sneaker) => {
          const base64Images = await Promise.all(
            sneaker.images.map((img) => {
              return new Promise((resolve, reject) => {
                // if it's already a string/URL somehow, ignoring
                if (typeof img === 'string') return resolve(img);
                if (img.id && !img.file) return resolve(img.id);
                if (!img.file) return resolve(img.url || img.preview || '');
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(img.file);
              });
            })
          );
          // returning the sneaker clone with base64 images string array
          return { ...sneaker, images: base64Images };
        })
      );

      const payload = {
        ...bookingData,
        sneakers: sneakersWithBase64Images,
        handoffMethod,
        shippingSelection:
          requiresCustomerAddress
            ? {
              ...shippingSelection,
              customerAddress: {
                ...shippingAddress,
                email: shippingAddress.email || bookingData.guestInfo?.email || '',
              },
            }
            : null,
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch(`/apps/${PROXY_SUB_PATH}/api/create/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();

      if (result.success && result.invoiceUrl) {
        window.location.href = result.invoiceUrl;
      } else {
        onNext();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error saving your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRateOptions = (title, direction, rates, selectedRate) => {
    return (
      <div className="shipping-rates__group">
        <div className="shipping-rates__header">
          <h4>{title}</h4>
          <span>{rates?.length || 0} rates</span>
        </div>

        {rates?.length ? (
          <div className="shipping-rate-list">
            {rates.map((rate) => {
              const isSelected = selectedRate?.carrier === rate.carrier
                && selectedRate?.service === rate.service
                && Number(selectedRate?.amount) === Number(rate.amount);
              const inputId = `shipping-rate-${direction}-${rate.carrier}-${rate.service}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');

              return (
                <div key={`${direction}-${rate.carrier}-${rate.service}-${rate.amount}`} className={`shipping-rate-card ${isSelected ? 'shipping-rate-card--selected' : ''}`}>
                  <input
                    id={inputId}
                    type="radio"
                    name={`shipping-rate-${direction}`}
                    checked={isSelected}
                    onChange={() => handleRateSelect(direction, rate)}
                  />
                  <button
                    type="button"
                    className="shipping-rate-card__content shipping-rate-card__content-button"
                    onClick={() => handleRateSelect(direction, rate)}
                  >
                    <span className="shipping-rate-card__topline">
                      <strong>{rate.carrier}</strong>
                      <span>${Number(rate.amount).toFixed(2)}</span>
                    </span>
                    <span className="shipping-rate-card__meta">
                      <span>{rate.service}</span>
                      <span>
                        {rate.deliveryDays ? `${rate.deliveryDays} business day${rate.deliveryDays > 1 ? 's' : ''}` : 'Transit time unavailable'}
                      </span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="shipping-rates__empty">No USPS or UPS rates available for this direction yet.</p>
        )}
      </div>
    );
  };

  return (
    <StepLayout
      title="How Will You Send Your Sneakers?"
      onNext={handleNext}
      onPrev={onPrev}
      nextLabel="Confirm Booking"
      isLoading={isSubmitting}
    >
      <div className="handoff-options">
        <div
          className={`handoff-card ${handoffMethod === 'dropoff' ? 'handoff-card--selected' : ''}`}
          onClick={() => {
            setShippingError('');
            onHandoffChange('dropoff');
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setShippingError('');
              onHandoffChange('dropoff');
            }
          }}
        >
          <div className="handoff-card__icon">📍</div>
          <h3 className="handoff-card__title">Drop-Off</h3>
          <p className="handoff-card__desc">Bring your sneakers directly to our location.</p>
          {handoffMethod === 'dropoff' && (
            <div className="handoff-card__instructions">
              <p><strong>Drop-off Location:</strong></p>
              <p>123 Sneaker Lane, Suite 4<br />New York, NY 10001</p>
              <p><strong>Hours:</strong> Mon-Sat, 9 AM - 6 PM</p>
              <div className="handoff-policy-info">
                <p><strong>Time Window:</strong> Please drop off your sneakers within 48 hours of booking. <b>Orders not completed within this window will be automatically canceled.</b></p>
                <p><strong>Pickup Policy:</strong> Once cleaned, sneakers must be picked up by the customer from our location. <b>Items will be held for up to 6 months before being disposed of.</b></p>
              </div>
              <p><strong>Next Steps:</strong> Bring your sneakers in any bag and mention your booking reference at the counter. <b>No scheduling is required;</b> just drop by during our opening hours.</p>
            </div>
          )}
        </div>

        <div
          className={`handoff-card ${handoffMethod === 'shipping' ? 'handoff-card--selected' : ''}`}
          onClick={() => {
            setShippingError('');
            onHandoffChange('shipping');
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setShippingError('');
              onHandoffChange('shipping');
            }
          }}
        >
          <div className="handoff-card__icon">📦</div>
          <h3 className="handoff-card__title">Shipping</h3>
          <p className="handoff-card__desc">Ship your sneakers with EasyPost-backed USPS and UPS options.</p>
          {handoffMethod === 'shipping' && (
            <div className="handoff-card__instructions">
              <p><strong>Shipping Instructions:</strong></p>
              <ol className="handoff-instructions-list">
                <li>Label each pair with your booking ID (sent to your email).</li>
                <li>Place each pair in a separate plastic bag.</li>
                <li>Pack all pairs into one shipping box.</li>
                <li>Ship to: <strong>123 Sneaker Lane, Suite 4, New York, NY 10001</strong></li>
              </ol>
              <p><em>We recommend using a tracked shipping service. We are not responsible for items lost during shipping.</em></p>
            </div>
          )}
        </div>

        <div
          className={`handoff-card ${handoffMethod === PICKUP_AND_RETURN_METHOD ? 'handoff-card--selected' : ''}`}
          onClick={() => {
            setShippingError('');
            onHandoffChange(PICKUP_AND_RETURN_METHOD);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setShippingError('');
              onHandoffChange(PICKUP_AND_RETURN_METHOD);
            }
          }}
        >
          <div className="handoff-card__icon">🚚</div>
          <h3 className="handoff-card__title">Pickup & Return</h3>
          <p className="handoff-card__desc">A store employee will collect your sneakers and deliver them back after cleaning.</p>
          {handoffMethod === PICKUP_AND_RETURN_METHOD && (
            <div className="handoff-card__instructions">
              <p><strong>How it works:</strong></p>
              <ol className="handoff-instructions-list">
                <li>Enter the address where our team should pick up your sneakers.</li>
                <li>Keep all pairs together and ready for collection.</li>
                <li>After cleaning, we will return the sneakers to the same address unless arranged otherwise.</li>
              </ol>
              <p><em>We will use your submitted address and phone number to coordinate pickup and return.</em></p>
            </div>
          )}
        </div>
      </div>

      {requiresCustomerAddress && (
        <div className="handoff-card__instructions handoff-card__instructions--shipping handoff-shipping-panel">
          <div className="shipping-section">
            <h4 className="shipping-section__title">
              {handoffMethod === 'shipping' ? 'Customer Shipping Address' : 'Pickup & Return Address'}
            </h4>
            <div className="shipping-grid">
              <FormField label="Full Name" required htmlFor="shipping-name">
                <input id="shipping-name" className="input" value={shippingAddress.name || ''} onChange={(event) => handleAddressChange('name', event.target.value)} />
              </FormField>
              <FormField label="Company" htmlFor="shipping-company">
                <input id="shipping-company" className="input" value={shippingAddress.company || ''} onChange={(event) => handleAddressChange('company', event.target.value)} />
              </FormField>
              <FormField label="Street Address" required htmlFor="shipping-street1">
                <input id="shipping-street1" className="input" value={shippingAddress.street1 || ''} onChange={(event) => handleAddressChange('street1', event.target.value)} />
              </FormField>
              <FormField label="Apartment, Suite, etc." htmlFor="shipping-street2">
                <input id="shipping-street2" className="input" value={shippingAddress.street2 || ''} onChange={(event) => handleAddressChange('street2', event.target.value)} />
              </FormField>
              <FormField label="City" required htmlFor="shipping-city">
                <input id="shipping-city" className="input" value={shippingAddress.city || ''} onChange={(event) => handleAddressChange('city', event.target.value)} />
              </FormField>
              <FormField label="State" required htmlFor="shipping-state">
                <input id="shipping-state" className="input" maxLength={2} value={shippingAddress.state || ''} onChange={(event) => handleAddressChange('state', event.target.value.toUpperCase())} />
              </FormField>
              <FormField label="ZIP Code" required htmlFor="shipping-zip">
                <input id="shipping-zip" className="input" value={shippingAddress.zip || ''} onChange={(event) => handleAddressChange('zip', event.target.value)} />
              </FormField>
              <FormField label="Phone" required htmlFor="shipping-phone">
                <input id="shipping-phone" className="input" value={shippingAddress.phone || ''} onChange={(event) => handleAddressChange('phone', event.target.value)} />
              </FormField>
              <FormField label="Email" htmlFor="shipping-email">
                <input id="shipping-email" className="input" type="email" value={shippingAddress.email || ''} onChange={(event) => handleAddressChange('email', event.target.value)} />
              </FormField>
            </div>
          </div>

          {handoffMethod === 'shipping' && (
            <div className="shipping-section">
              <h4 className="shipping-section__title">Package Details</h4>
              <div className="shipping-grid shipping-grid--parcel">
                <FormField label="Length (in)" required htmlFor="parcel-length">
                  <input id="parcel-length" className="input" inputMode="decimal" value={parcel.length || ''} onChange={(event) => handleParcelChange('length', event.target.value)} />
                </FormField>
                <FormField label="Width (in)" required htmlFor="parcel-width">
                  <input id="parcel-width" className="input" inputMode="decimal" value={parcel.width || ''} onChange={(event) => handleParcelChange('width', event.target.value)} />
                </FormField>
                <FormField label="Height (in)" required htmlFor="parcel-height">
                  <input id="parcel-height" className="input" inputMode="decimal" value={parcel.height || ''} onChange={(event) => handleParcelChange('height', event.target.value)} />
                </FormField>
                <FormField label="Weight (oz)" required htmlFor="parcel-weight">
                  <input id="parcel-weight" className="input" inputMode="decimal" value={parcel.weight || ''} onChange={(event) => handleParcelChange('weight', event.target.value)} />
                </FormField>
              </div>
              <button type="button" className="btn btn--secondary shipping-rates__button" onClick={handleFetchRates} disabled={isFetchingRates}>
                {isFetchingRates ? 'Fetching Rates...' : 'Fetch USPS & UPS Rates'}
              </button>
            </div>
          )}

          {shippingError && <p className="shipping-error">{shippingError}</p>}

          {handoffMethod === 'shipping' && shippingRates && (
            <div className="shipping-section shipping-rates">
              {renderRateOptions(
                'Customer -> Store',
                'forward',
                shippingRates.customerToStore?.rates,
                shippingSelection?.selectedForwardRate,
              )}

              {renderRateOptions(
                'Store -> Customer',
                'return',
                shippingRates.storeToCustomer?.rates,
                shippingSelection?.selectedReturnRate,
              )}

              <div className="shipping-total">
                <span>Selected Shipping Total</span>
                <strong>${selectedShippingTotal}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </StepLayout>
  );
}

export default HandoffMethodStep;
