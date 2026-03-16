import React from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import { SERVICE_TIERS, ADD_ONS } from '../../shared/SneakerCard/SneakerCard.jsx';
import './SummaryStep.css';

function getTierPrice(tierId) {
  return SERVICE_TIERS.find((t) => t.id === tierId)?.price || 0;
}

function getAddonPrice(addonId) {
  return ADD_ONS.find((a) => a.id === addonId)?.price || 0;
}

function SneakerSummaryRow({ sneaker, service }) {
  const tier = SERVICE_TIERS.find((t) => t.id === service?.tier);
  const selectedAddons = ADD_ONS.filter((a) => (service?.addOns || []).includes(a.id));
  const subtotal =
    getTierPrice(service?.tier) +
    (service?.addOns || []).reduce((sum, id) => sum + getAddonPrice(id), 0);

  return (
    <div className="summary-row">
      <div className="summary-row__sneaker">
        <strong>{sneaker.nickname}</strong>
        {sneaker.brand && (
          <span className="summary-row__details">
            {sneaker.brand} {sneaker.model}
          </span>
        )}
      </div>
      <div className="summary-row__services">
        <div className="summary-row__tier">
          {tier ? tier.label : <span className="summary-row__missing">No tier selected</span>}
          {tier && <span className="summary-row__price"> ${tier.price}</span>}
        </div>
        {selectedAddons.length > 0 && (
          <ul className="summary-row__addons">
            {selectedAddons.map((addon) => (
              <li key={addon.id}>
                {addon.label} <span className="summary-row__price">+${addon.price}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="summary-row__subtotal">Subtotal: ${subtotal}</div>
      </div>
    </div>
  );
}

function SummaryStep({ sneakers, services, notes, onNext, onPrev }) {
  const estimatedTotal = sneakers.reduce((total, sneaker) => {
    const service = services[sneaker.id];
    const tierPrice = getTierPrice(service?.tier);
    const addonsPrice = (service?.addOns || []).reduce((sum, id) => sum + getAddonPrice(id), 0);
    return total + tierPrice + addonsPrice;
  }, 0);

  return (
    <StepLayout
      title="Booking Summary"
      onNext={onNext}
      onPrev={onPrev}
      nextLabel="Choose Handoff Method"
    >
      <div className="summary">
        <div className="summary__sneakers">
          {sneakers.map((sneaker) => (
            <SneakerSummaryRow
              key={sneaker.id}
              sneaker={sneaker}
              service={services[sneaker.id]}
            />
          ))}
        </div>

        {notes && (
          <div className="summary__notes">
            <strong>Special Instructions:</strong>
            <p>{notes}</p>
          </div>
        )}

        <div className="summary__total">
          <span>Estimated Total</span>
          <span className="summary__total-price">${estimatedTotal}</span>
        </div>

        <div className="summary__disclaimer">
          <strong>Note:</strong> The final price may change after our team inspects your
          sneakers. You will receive the confirmed price and a payment link by email before
          the service begins.
        </div>
      </div>
    </StepLayout>
  );
}

export default SummaryStep;
