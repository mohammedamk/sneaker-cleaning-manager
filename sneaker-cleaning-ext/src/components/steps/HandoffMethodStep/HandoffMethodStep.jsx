/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import FormField from '../../shared/FormField/FormField.jsx';
import './HandoffMethodStep.css';
import { PROXY_SUB_PATH } from '../../../utils/global.js';

const REQUIRED_ADDRESS_FIELDS = ['name', 'street1', 'city', 'state', 'zip', 'phone'];
const PICKUP_AND_RETURN_METHOD = 'pickup_delivery';
const DEFAULT_SHIPPING_CREDIT_PER_PAIR = 10;
const SNEAKER_WEIGHT_LB = 4;
const SHIPPING_BOX_LIBRARY = {
  1: { length: 17, width: 11, height: 8, boxWeightLb: 1 },
  2: { length: 15, width: 12, height: 10, boxWeightLb: 1.5 },
  3: { length: 14, width: 14, height: 14, boxWeightLb: 1.5 },
  4: { length: 14, width: 14, height: 14, boxWeightLb: 1.5 },
  5: { length: 20, width: 20, height: 12, boxWeightLb: 3 },
  6: { length: 20, width: 20, height: 12, boxWeightLb: 3 },
  7: { length: 18, width: 18, height: 18, boxWeightLb: 3 },
  8: { length: 18, width: 18, height: 18, boxWeightLb: 3 },
  9: { length: 24, width: 18, height: 18, boxWeightLb: 3.5 },
  10: { length: 24, width: 18, height: 18, boxWeightLb: 3.5 },
};
const OUNCES_PER_POUND = 16;

function calculateShippingSummary(shippingSelection, sneakerCount) {
  const forwardAmount = Number(shippingSelection?.selectedForwardRate?.amount || 0);
  const returnAmount = Number(shippingSelection?.selectedReturnRate?.amount || 0);
  const shippingCreditPerPair = Number(
    shippingSelection?.shippingCreditPerPair ?? DEFAULT_SHIPPING_CREDIT_PER_PAIR,
  );
  const returnShippingBufferPercentage = Number(
    shippingSelection?.returnShippingBufferPercentage || 0,
  );
  const subtotal = forwardAmount + returnAmount;
  const bufferedTotal = subtotal * (1 + (returnShippingBufferPercentage / 100));
  const shippingCredit = sneakerCount * shippingCreditPerPair;

  return {
    forwardAmount,
    returnAmount,
    shippingCredit,
    customerFacingTotal: Math.max(Number((bufferedTotal - shippingCredit).toFixed(2)), 0),
  };
}

function getEstimatedDelivery(rate) {
  if (rate?.deliveryDate) {
    return rate.deliveryDate;
  }

  if (rate?.deliveryDays) {
    return `${rate.deliveryDays} business day${rate.deliveryDays > 1 ? 's' : ''}`;
  }

  return 'Transit time unavailable';
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
  const shippingRates = shippingSelection?.rates;
  const sneakerCount = bookingData?.sneakers?.length || 0;
  const selectedBoxConfig = SHIPPING_BOX_LIBRARY[sneakerCount] || null;
  const recommendedParcel = useMemo(() => {
    if (!selectedBoxConfig) {
      return null;
    }

    const totalWeightLb = (sneakerCount * SNEAKER_WEIGHT_LB) + selectedBoxConfig.boxWeightLb;

    return {
      length: String(selectedBoxConfig.length),
      width: String(selectedBoxConfig.width),
      height: String(selectedBoxConfig.height),
      weight: String(totalWeightLb * OUNCES_PER_POUND),
      displayWeightLb: totalWeightLb,
    };
  }, [selectedBoxConfig, sneakerCount]);

  const shippingSummary = useMemo(
    () => calculateShippingSummary(shippingSelection, sneakerCount),
    [shippingSelection, sneakerCount],
  );

  const updateShippingSelection = useCallback((updater) => {
    onShippingChange(typeof updater === 'function' ? updater(shippingSelection) : updater);
  }, [onShippingChange, shippingSelection]);

  const clearRates = (nextSelection) => ({
    ...nextSelection,
    rates: null,
    selectedForwardRate: null,
    selectedReturnRate: null,
    customerFacingShippingTotal: 0,
    upsellOptions: [],
  });

  useEffect(() => {
    if (!recommendedParcel) {
      return;
    }

    const hasParcelChanged = ['length', 'width', 'height', 'weight'].some(
      (field) => String(shippingSelection?.parcel?.[field] || '') !== recommendedParcel[field],
    );

    if (!hasParcelChanged) {
      return;
    }

    updateShippingSelection((current) =>
      clearRates({
        ...current,
        parcel: {
          length: recommendedParcel.length,
          width: recommendedParcel.width,
          height: recommendedParcel.height,
          weight: recommendedParcel.weight,
        },
      }),
    );
  }, [recommendedParcel, shippingSelection, updateShippingSelection]);

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

  const validateShippingInputs = () => {
    const missingAddressFields = REQUIRED_ADDRESS_FIELDS.filter((field) => !String(shippingAddress[field] || '').trim());

    if (missingAddressFields.length || !recommendedParcel) {
      const messages = [];
      if (missingAddressFields.length) {
        messages.push(`address: ${missingAddressFields.join(', ')}`);
      }
      if (!recommendedParcel) {
        messages.push('package: valid sneaker quantity required');
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
          parcel: recommendedParcel,
          sneakerQuantity: sneakerCount,
          referencePrefix: bookingData.customerID || bookingData.guestInfo?.email || 'booking',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to fetch shipping rates');
      }

      if (!result.selectedForwardRate || !result.selectedReturnRate || !result.pricing) {
        throw new Error('Unable to find a valid roundtrip shipping option for this booking.');
      }

      updateShippingSelection((current) => ({
        ...current,
        rates: result.quotes,
        storeAddress: result.quotes.storeAddress,
        shippingCreditPerPair: result.shippingCreditPerPair,
        returnShippingBufferPercentage: result.returnShippingBufferPercentage,
        selectedForwardRate: result.selectedForwardRate,
        selectedReturnRate: result.selectedReturnRate,
        customerFacingShippingTotal: result.pricing.customerFacingTotal,
        upsellOptions: result.upsellOptions || [],
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
        setShippingError('Fetch shipping before continuing.');
        return;
      }

      if (!shippingSelection?.selectedForwardRate || !shippingSelection?.selectedReturnRate) {
        setShippingError('No valid shipping option is currently available for this address and package.');
        return;
      }

      if (!shippingSelection?.disclaimerAccepted) {
        setShippingError('Please accept the shipping instructions and disclaimer before continuing.');
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
      const sneakersWithImageRefs = await Promise.all(
        bookingData.sneakers.map(async (sneaker) => {
          const images = await Promise.all(
            (sneaker.images || []).map((img) => {
              if (typeof img === 'string') return Promise.resolve(img);
              if (img?.id) return Promise.resolve(img.id);
              if (!img?.file) return Promise.resolve('');

              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(img.file);
              });
            }),
          );

          return {
            ...sneaker,
            images: images.filter(Boolean),
          };
        }),
      );

      const payload = {
        ...bookingData,
        sneakers: sneakersWithImageRefs,
        handoffMethod,
        shippingSelection:
          requiresCustomerAddress
            ? {
              ...shippingSelection,
              parcel: recommendedParcel
                ? {
                  length: recommendedParcel.length,
                  width: recommendedParcel.width,
                  height: recommendedParcel.height,
                  weight: recommendedParcel.weight,
                }
                : shippingSelection?.parcel,
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

  const renderSelectedShippingSummary = (title, rate) => (
    <div className="shipping-rates__group">
      <div className="shipping-rates__header">
        <h4>{title}</h4>
      </div>
      <div className="shipping-rate-card shipping-rate-card--selected">
        <div className="shipping-rate-card__content">
          <span className="shipping-rate-card__topline">
            <strong>{rate?.carrier || 'N/A'}</strong>
            <span>{rate?.service || 'Service unavailable'}</span>
          </span>
          <span className="shipping-rate-card__meta">
            <span>Estimated delivery</span>
            <span>{getEstimatedDelivery(rate)}</span>
          </span>
        </div>
      </div>
    </div>
  );

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
              <h4 className="shipping-section__title">Recommended Package Details</h4>
              <div className="shipping-box-summary">
                <p><strong>Sneaker pairs:</strong> {sneakerCount}</p>
                {selectedBoxConfig ? (
                  <>
                    <p><strong>Box size:</strong> {selectedBoxConfig.length}&quot; x {selectedBoxConfig.width}&quot; x {selectedBoxConfig.height}&quot;</p>
                    <p><strong>Box weight:</strong> {selectedBoxConfig.boxWeightLb} lb</p>
                    <p><strong>Estimated sneaker weight:</strong> {sneakerCount * SNEAKER_WEIGHT_LB} lb</p>
                    <p><strong>Total estimated package weight:</strong> {recommendedParcel?.displayWeightLb} lb</p>
                  </>
                ) : (
                  <p>Please keep sneaker quantity between 1 and 10 to calculate shipping.</p>
                )}
              </div>
              <button type="button" className="btn btn--secondary shipping-rates__button" onClick={handleFetchRates} disabled={isFetchingRates}>
                {isFetchingRates ? 'Calculating Shipping...' : 'Calculate Shipping'}
              </button>
            </div>
          )}

          {shippingError && <p className="shipping-error">{shippingError}</p>}

          {handoffMethod === 'shipping' && shippingRates && shippingSelection?.selectedForwardRate && shippingSelection?.selectedReturnRate && (
            <div className="shipping-section shipping-rates">
              {renderSelectedShippingSummary('Customer -> Store', shippingSelection.selectedForwardRate)}
              {renderSelectedShippingSummary('Store -> Customer', shippingSelection.selectedReturnRate)}

              <div className="shipping-total">
                <span>Customer-Facing Shipping Total</span>
                <strong>${shippingSummary.customerFacingTotal.toFixed(2)}</strong>
              </div>

              {shippingSelection?.upsellOptions?.length > 0 && (
                <div className="shipping-rates__group">
                  <div className="shipping-rates__header">
                    <h4>Save More With More Pairs</h4>
                  </div>
                  <div className="shipping-box-summary">
                    {shippingSelection.upsellOptions.map((option) => (
                      <p key={option.quantity}>
                        <strong>{option.quantity} pairs:</strong> Save ${Number(option.savings || 0).toFixed(2)}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="shipping-disclaimer">
                <h4 className="shipping-section__title">Shipping Instructions & Disclaimer</h4>
                <p>To help keep shipping costs accurate and avoid delays, please package your footwear according to the box size recommended during checkout. You may use the recommended box size or a smaller box, as long as all footwear fits safely without forcing, bending, or damaging the shoes.</p>
                <p>If you do not have an appropriately sized box, we recommend asking your shipping carrier for assistance with selecting the correct box size before sending your items. Oversized packages may result in carrier price adjustments, shipping delays, or additional charges. Carrier measurements, weights, and rate adjustments may differ from the website estimate. Any additional charges caused by carrier remeasurement, oversized packaging, or incorrect packaging may be the customer’s responsibility.</p>
                <p>Please place each pair in a separate plastic bag before placing them in the shipping box. Do not include original shoeboxes unless specifically instructed, as this may increase package size and shipping cost. If original shoeboxes or additional packaging are included without instruction, Save Our Soles is not responsible for damage to, storage of, or return of those materials.</p>
                <p>Do not include cash, jewelry, accessories, personal items, or any items unrelated to your order. Save Our Soles is not responsible for storage, loss, or return of unauthorized items included in the shipment.</p>
                <p>Only ship the footwear included in your order. Additional, unauthorized, missing, or incorrect footwear may delay processing, pose additional charges, or require review before service can begin. Save Our Soles may pause service until shipment contents are reviewed and matched to the order.</p>
                <p>Customers are responsible for providing accurate shipping information. Save Our Soles is not responsible for delays, failed deliveries, returned packages, or additional charges caused by incorrect or incomplete addresses.</p>
                <p>Customers are responsible for packaging footwear securely and sealing the package properly before shipment. We recommend taking photos of the footwear and packaged box before drop-off and keeping your carrier drop-off receipt for your records.</p>
                <p>Save Our Soles is not responsible for damage caused by insufficient packaging before the shipment arrives at our facility. Save Our Soles is also not responsible for loss, damage, delays, or carrier issues that occur while items are in transit to or from our facility. Shipping carrier policies, timelines, scans, measurements, and delivery decisions are outside of our control.</p>
                <p>Shipping labels must be used within the stated timeframe. Expired, unused, or incorrectly used labels may require a new label at the customer’s expense.</p>
                <p>Service turnaround time begins only after footwear has been received, checked in, and matched to the order.</p>
                <p>Once return shipment is marked delivered by the carrier, Save Our Soles is not responsible for theft, loss, or damage occurring after delivery.</p>
                <p>Refunds do not include shipping costs. Shipping charges are nonrefundable once a shipping label has been generated, purchased, or used.</p>
                <p>By shipping your footwear, you acknowledge that you are responsible for following the packaging instructions and providing accurate shipment contents.</p>
                <label className="shipping-disclaimer__checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(shippingSelection?.disclaimerAccepted)}
                    onChange={(event) => {
                      setShippingError('');
                      updateShippingSelection((current) => ({
                        ...current,
                        disclaimerAccepted: event.target.checked,
                      }));
                    }}
                  />
                  <span>I agree to the shipping instructions and disclaimer.</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </StepLayout>
  );
}

export default HandoffMethodStep;
