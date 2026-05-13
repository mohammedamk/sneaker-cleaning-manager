/* eslint-disable react/prop-types */
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import { SERVICE_TIERS, ADD_ONS } from '../../shared/SneakerCard/SneakerCard.jsx';
import './SummaryStep.css';

const HIGH_VALUE_DISCLOSURE_LABEL = 'Are any of the items in your order luxury, rare, sentimental, irreplaceable, one-of-one, custom, collectible, vintage, or unusually valuable?';
const HIGH_VALUE_ACKNOWLEDGMENT_LABEL = 'I understand that I am submitting luxury, rare, sentimental, irreplaceable, one-of-one, custom, collectible, vintage, or unusually valuable footwear. I understand that Save Our Soles does not guarantee preservation of market value, resale value, sentimental value, collectible value, authentication value, factory originality, or replacement value, and that additional shipping coverage or special handling must be requested before shipping.';

function getTierPrice(tierId) {
  return SERVICE_TIERS.find((t) => t.id === tierId)?.price || 0;
}

function getAddonPrice(addonId) {
  return ADD_ONS.find((a) => a.id === addonId)?.price || 0;
}

function getSneakerImageSrc(image) {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.preview || image.url || '';
}

function SneakerSummaryRow({ sneaker, service }) {
  const tier = SERVICE_TIERS.find((t) => t.id === service?.tier);
  const selectedAddons = ADD_ONS.filter((a) => (service?.addOns || []).includes(a.id));
  const sneakerImages = (sneaker.images || [])
    .map(getSneakerImageSrc)
    .filter(Boolean);
  const subtotal =
    getTierPrice(service?.tier) +
    (service?.addOns || []).reduce((sum, id) => sum + getAddonPrice(id), 0);

  return (
    <div className="summary-row">
      <div className="summary-row__sneaker">
        {sneakerImages.length > 0 && (
          <div className="summary-row__images">
            {sneakerImages.map((imageSrc, index) => (
              <img
                key={`${sneaker.id || sneaker.nickname || 'sneaker'}-${index}`}
                src={imageSrc}
                alt={`${sneaker.nickname || 'Sneaker'} ${index + 1}`}
                className="summary-row__image"
              />
            ))}
          </div>
        )}
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
        {sneaker.notes && (
          <div className="summary-row__notes">
            <strong>Special Instructions:</strong>
            <p>{sneaker.notes}</p>
          </div>
        )}
        <div className="summary-row__subtotal">Subtotal: ${subtotal}</div>
      </div>
    </div>
  );
}

function SummaryStep({
  sneakers,
  services,
  bookingAgreements,
  onBookingAgreementsChange,
  onNext,
  onPrev,
}) {
  const estimatedTotal = sneakers.reduce((total, sneaker) => {
    const service = services[sneaker.id];
    const tierPrice = getTierPrice(service?.tier);
    const addonsPrice = (service?.addOns || []).reduce((sum, id) => sum + getAddonPrice(id), 0);
    return total + tierPrice + addonsPrice;
  }, 0);

  const handleNext = () => {
    if (bookingAgreements?.hasHighValueItems && !bookingAgreements?.highValueAcknowledged) {
      alert('Please acknowledge the high-value footwear notice before continuing.');
      return;
    }

    onNext();
  };

  const handleHighValueToggle = (checked) => {
    onBookingAgreementsChange((current) => ({
      ...current,
      hasHighValueItems: checked,
      highValueAcknowledged: checked ? current.highValueAcknowledged : false,
    }));
  };

  return (
    <StepLayout
      title="Booking Summary"
      onNext={handleNext}
      onPrev={onPrev}
      nextLabel="Review Agreement"
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

        <div className="summary__total">
          <span>Estimated Total</span>
          <span className="summary__total-price">${estimatedTotal}</span>
        </div>

        <div className="summary__disclaimer">
          <strong>Note:</strong> The final price may change after our team inspects your
          sneakers. You will receive the confirmed price and a payment link by email before
          the service begins.
        </div>

        <div className="summary__agreements">
          <label className="summary__checkbox">
            <input
              type="checkbox"
              checked={Boolean(bookingAgreements?.hasHighValueItems)}
              onChange={(event) => handleHighValueToggle(event.target.checked)}
            />
            <span>{HIGH_VALUE_DISCLOSURE_LABEL}</span>
          </label>

          {bookingAgreements?.hasHighValueItems && (
            <label className="summary__checkbox summary__checkbox--nested">
              <input
                type="checkbox"
                checked={Boolean(bookingAgreements?.highValueAcknowledged)}
                onChange={(event) =>
                  onBookingAgreementsChange((current) => ({
                    ...current,
                    highValueAcknowledged: event.target.checked,
                  }))}
              />
              <span>{HIGH_VALUE_ACKNOWLEDGMENT_LABEL}</span>
            </label>
          )}
        </div>
      </div>
    </StepLayout>
  );
}

export default SummaryStep;
