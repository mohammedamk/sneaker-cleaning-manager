import React from 'react';
import './SneakerCard.css';

const SERVICE_TIERS = [
  { id: 'standard', label: 'Standard Cleaning', price: 25 },
  { id: 'deep', label: 'Deep Cleaning', price: 45 },
  { id: 'extreme', label: 'Extreme Cleaning', price: 70 },
];

const ADD_ONS = [
  { id: 'deoxidation', label: 'Deoxidation', price: 15 },
  { id: 'deodorization', label: 'Deodorization', price: 10 },
  { id: 'waterproofing', label: 'Waterproofing', price: 12 },
  { id: 'sole_cleaning', label: 'Sole Cleaning', price: 10 },
  { id: 'lace_replacement', label: 'Lace Replacement', price: 8 },
];

const getImageSrc = (image) => {
  if (typeof image === 'string') return image;
  return image?.preview || image?.url || '';
};

function SneakerCard({ sneaker, mode, onEdit, onRemove, serviceSelection, onServiceChange }) {
  const handleTierChange = (tierId) => {
    onServiceChange(sneaker.id, { ...serviceSelection, tier: tierId });
  };

  const handleAddOnToggle = (addOnId) => {
    const currentAddOns = serviceSelection?.addOns || [];
    const updated = currentAddOns.includes(addOnId)
      ? currentAddOns.filter((id) => id !== addOnId)
      : [...currentAddOns, addOnId];
    onServiceChange(sneaker.id, { ...serviceSelection, addOns: updated });
  };

  return (
    <div className="sneaker-card">
      <div className="sneaker-card__header">
        <div className="sneaker-card__info">
          <strong className="sneaker-card__nickname">{sneaker.nickname || 'Unnamed Sneaker'}</strong>
          {sneaker.brand && (
            <span className="sneaker-card__brand">
              {sneaker.brand} {sneaker.model}
            </span>
          )}
          {sneaker.colorway && (
            <span className="sneaker-card__colorway">Colorway: {sneaker.colorway}</span>
          )}
          {sneaker.size && (
            <span className="sneaker-card__size">
              Size: {sneaker.size} ({sneaker.sizeUnit})
            </span>
          )}
          {sneaker.images && sneaker.images.length > 0 && (
            <div className="sneaker-card__thumbnails">
              {sneaker.images.slice(0, 3).map((img, i) => (
                getImageSrc(img) ? (
                  <img
                    key={i}
                    src={getImageSrc(img)}
                    alt={`${sneaker.nickname} ${i + 1}`}
                    className="sneaker-card__thumbnail"
                  />
                ) : (
                  <div key={i} className="sneaker-card__thumbnail sneaker-card__thumbnail--placeholder">
                    Processing
                  </div>
                )
              ))}
              {sneaker.images.length > 3 && (
                <span className="sneaker-card__more-images">+{sneaker.images.length - 3}</span>
              )}
            </div>
          )}
        </div>
        {mode === 'manage' && (
          <div className="sneaker-card__actions">
            <button className="btn btn--small btn--secondary" onClick={() => onEdit(sneaker)}>
              Edit
            </button>
            <button className="btn btn--small btn--danger" onClick={() => onRemove(sneaker.id)}>
              Remove
            </button>
          </div>
        )}
      </div>

      {mode === 'service' && serviceSelection !== undefined && (
        <div className="sneaker-card__services">
          <div className="sneaker-card__tier-select">
            <p className="sneaker-card__section-label">Cleaning Tier</p>
            <div className="tier-options">
              {SERVICE_TIERS.map((tier) => (
                <label key={tier.id} className="tier-option">
                  <input
                    type="radio"
                    name={`tier-${sneaker.id}`}
                    value={tier.id}
                    checked={serviceSelection?.tier === tier.id}
                    onChange={() => handleTierChange(tier.id)}
                  />
                  <span className="tier-option__label">
                    {tier.label}
                    <span className="tier-option__price"> (from ${tier.price})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="sneaker-card__addons">
            <p className="sneaker-card__section-label">Optional Add-ons</p>
            <div className="addon-options">
              {ADD_ONS.map((addon) => (
                <label key={addon.id} className="addon-option">
                  <input
                    type="checkbox"
                    checked={(serviceSelection?.addOns || []).includes(addon.id)}
                    onChange={() => handleAddOnToggle(addon.id)}
                  />
                  <span className="addon-option__label">
                    {addon.label}
                    <span className="addon-option__price"> (+${addon.price})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { SERVICE_TIERS, ADD_ONS };
export default SneakerCard;
