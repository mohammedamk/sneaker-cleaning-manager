import React, { useState, useEffect } from 'react';
import './SneakerCard.css';
import { fetchAdminSettings } from '../../../utils/adminSettings.js';
import { SNEAKER_PLACEHOLDER_SRC } from '../../../utils/assets.js';

export let SERVICE_TIERS = [];
export let ADD_ONS = [];
export let QUOTED_SERVICES = [];

function SneakerCard({ sneaker, mode, onEdit, onRemove, serviceSelection, onServiceChange }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredTierId, setHoveredTierId] = useState(null);
  const [hoveredAddOnId, setHoveredAddOnId] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    fetchAdminSettings()
      .then(settings => {
        SERVICE_TIERS = settings.cleaningTiers || [];
        ADD_ONS = settings.addOns || [];
        QUOTED_SERVICES = (settings.quotedServices || []).filter(s => s.enabled !== false);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading admin settings:', error);
        setIsLoading(false);
      });
  }, []);

  const getImageSrc = (image) => {
    if (typeof image === 'string') return image;
    return image?.preview || image?.url || '';
  };

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

  const handleQuotedServiceToggle = (serviceId) => {
    const currentQuoted = serviceSelection?.quotedServices || [];
    const updated = currentQuoted.includes(serviceId)
      ? currentQuoted.filter((id) => id !== serviceId)
      : [...currentQuoted, serviceId];
    onServiceChange(sneaker.id, { ...serviceSelection, quotedServices: updated });
  };

  const isTierSelected = Boolean(serviceSelection?.tier);

  return (
    <div className="sneaker-card">
      <div className="sneaker-card__header">
        <div className="sneaker-card__info">
          <strong className="sneaker-card__nickname">{sneaker.nickname || 'Unnamed Footwear'}</strong>
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
          <div className="sneaker-card__thumbnails">
            {sneaker.images && sneaker.images.length > 0 ? (
              getImageSrc(sneaker.images[0]) ? (
                <img
                  src={getImageSrc(sneaker.images[0])}
                  alt={sneaker.nickname}
                  className="sneaker-card__thumbnail"
                />
              ) : (
                <div className="sneaker-card__thumbnail sneaker-card__thumbnail--placeholder">
                  Processing
                </div>
              )
            ) : (
              <div className="sneaker-card__thumbnail--no-photo">
                <img
                  src={SNEAKER_PLACEHOLDER_SRC}
                  alt=""
                  className="sneaker-card__no-photo-icon"
                />
              </div>
            )}
          </div>
        </div>
        {mode === 'manage' && (
          <div className="sneaker-card__actions">
            <button className="btn btn--small btn--secondary" onClick={() => onEdit(sneaker)}>
              Edit
            </button>
            <button className="btn btn--small btn--danger" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          </div>
        )}
      </div>

      {mode === 'manage' && confirmingDelete && (
        <div className="sneaker-card__delete-confirm">
          <p className="sneaker-card__delete-confirm-msg">
            This will permanently delete this shoe from your Shoe Rack. Are you sure you want to proceed?
          </p>
          <div className="sneaker-card__delete-confirm-actions">
            <button
              className="btn btn--small btn--secondary"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn--small btn--danger"
              onClick={() => { setConfirmingDelete(false); onRemove(sneaker.id); }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {mode === 'service' && serviceSelection !== undefined && (
        <div className="sneaker-card__services">
          <div className="sneaker-card__tier-select">
            <p className="sneaker-card__section-label">Cleaning Tier</p>
            <div className="tier-options">
              {SERVICE_TIERS.map((tier) => (
                <div key={tier.id} className="tier-option-wrapper">
                  <label className="tier-option">
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
                  {tier.description && (
                    <div
                      className="tier-info-group"
                      onMouseEnter={() => setHoveredTierId(tier.id)}
                      onMouseLeave={() => setHoveredTierId(null)}
                      onClick={() => setHoveredTierId(hoveredTierId === tier.id ? null : tier.id)}
                      role="button"
                      tabIndex="0"
                    >
                      <div className="tier-info-icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </div>
                      {hoveredTierId === tier.id && (
                        <div className={`tier-tooltip${tier.learnMoreUrl ? ' tier-tooltip--clickable' : ''}`}>
                          {tier.description}
                          {tier.learnMoreUrl && (
                            <a
                              href={tier.learnMoreUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tier-tooltip__learn-more"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Learn More
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="sneaker-card__addons">
            <p className="sneaker-card__section-label">
              Optional Add-ons
              {!isTierSelected && (
                <span className="sneaker-card__disabled-note">
                  Select a cleaning tier first
                </span>
              )}
            </p>

            <div className={`addon-options ${!isTierSelected ? 'addon-options--disabled' : ''}`}>
              {ADD_ONS.map((addon) => (
                <div key={addon.id} className="addon-option-wrapper">
                  <label className={`addon-option ${!isTierSelected ? 'addon-option--disabled' : ''}`}>
                    <input
                      type="checkbox"
                      disabled={!isTierSelected}
                      checked={(serviceSelection?.addOns || []).includes(addon.id)}
                      onChange={() => handleAddOnToggle(addon.id)}
                    />
                    <span className="addon-option__label">
                      {addon.label}
                      <span className="addon-option__price">
                        (+${addon.price})
                      </span>
                    </span>
                  </label>
                  {addon.description && (
                    <div
                      className="addon-info-group"
                      onMouseEnter={() => setHoveredAddOnId(addon.id)}
                      onMouseLeave={() => setHoveredAddOnId(null)}
                      onClick={() => setHoveredAddOnId(hoveredAddOnId === addon.id ? null : addon.id)}
                      role="button"
                      tabIndex="0"
                    >
                      <div className="tier-info-icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </div>
                      {hoveredAddOnId === addon.id && (
                        <div className={`tier-tooltip${addon.learnMoreUrl ? ' tier-tooltip--clickable' : ''}`}>
                          {addon.description}
                          {addon.learnMoreUrl && (
                            <a
                              href={addon.learnMoreUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tier-tooltip__learn-more"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Learn More
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {QUOTED_SERVICES.length > 0 && (
            <div className="sneaker-card__quoted-services">
              <p className="sneaker-card__section-label">Quoted Add-on Services</p>
              <div className="quoted-services__notice">
                Pricing for these services will be determined after inspection and will be charged separately.
              </div>
              <div className="addon-options">
                {QUOTED_SERVICES.map((service) => (
                  <label key={service.id} className="addon-option">
                    <input
                      type="checkbox"
                      checked={(serviceSelection?.quotedServices || []).includes(service.id)}
                      onChange={() => handleQuotedServiceToggle(service.id)}
                    />
                    <span className="addon-option__label">{service.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SneakerCard;
