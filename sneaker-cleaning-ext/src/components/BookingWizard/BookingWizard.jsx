import { useState, useEffect } from 'react';
import { fetchAdminSettings } from '../../utils/adminSettings.js';
import StepIndicator from '../shared/StepIndicator/StepIndicator.jsx';
import React from 'react';
import './BookingWizard.css';

import LandingStep from '../steps/LandingStep/LandingStep.jsx';
import CustomerCheckStep from '../steps/CustomerCheckStep/CustomerCheckStep.jsx';
import SneakerRegistrationStep from '../steps/SneakerRegistrationStep/SneakerRegistrationStep.jsx';
import SneakerHistoryStep from '../steps/SneakerHistoryStep/SneakerHistoryStep.jsx';
import AdditionalNotesStep from '../steps/AdditionalNotesStep/AdditionalNotesStep.jsx';
import AddMoreSneakersStep from '../steps/AddMoreSneakersStep/AddMoreSneakersStep.jsx';
import ServiceSelectionStep from '../steps/ServiceSelectionStep/ServiceSelectionStep.jsx';
import SummaryStep from '../steps/SummaryStep/SummaryStep.jsx';
import AgreementStep from '../steps/AgreementStep/AgreementStep.jsx';
import HandoffMethodStep from '../steps/HandoffMethodStep/HandoffMethodStep.jsx';
import ConfirmationStep from '../steps/ConfirmationStep/ConfirmationStep.jsx';
import ShoeRackSelectionStep from '../steps/ShoeRackSelectionStep/ShoeRackSelectionStep.jsx';
import ShoeRackManagement from '../ShoeRackManagement/ShoeRackManagement.jsx';
import BookingsManagement from '../BookingsManagement/BookingsManagement.jsx';
import GuestBookingLookup from '../BookingsManagement/GuestBookingLookup.jsx';
import { toast } from '../../utils/toast.js';
const EMPTY_HISTORY = {
  professionallyCleaned: '',
  alterations: [],
};

const createLocalSneakerId = () =>
  `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getSneakerKey = (sneaker) => sneaker?._id || sneaker?.id;

const normalizeHistory = (history) => ({
  professionallyCleaned: history?.professionallyCleaned || '',
  alterations: Array.isArray(history?.alterations) ? history.alterations : [],
});

// reading shopify customer id if available
function getCustomerID() {
  try {
    return window?.ShopifyAnalytics?.meta?.page?.customerId || null;
  } catch {
    return null;
  }
}

const TOTAL_STEPS = 10;

const DEFAULT_BOOKING_AGREEMENTS = {
  hasHighValueItems: false,
  highValueAcknowledged: false,
  policiesAccepted: false,
};

const DEFAULT_SHIPPING_SELECTION = {
  customerAddress: {
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    email: '',
  },
  parcel: {
    length: '',
    width: '',
    height: '',
    weight: '',
  },
  rates: null,
  selectedForwardRate: null,
  selectedReturnRate: null,
  returnShippingBufferPercentage: 0,
  shippingCreditPerPair: 10,
  customerFacingShippingTotal: 0,
  upsellOptions: [],
  storeAddress: null,
  disclaimerAccepted: false,
  insurance: {
    selected: false,
    recommended: false,
    highValueItemsDeclared: false,
    config: {
      enabled: true,
      price: 0,
      coverageAmount: 0,
      label: 'Shipping Insurance',
    },
  },
};

const FOOTWEAR_SUB_STEPS = [
  { label: 'Details', internalStep: 2 },
  { label: 'History', internalStep: 3 },
  { label: 'Notes',   internalStep: 4 },
];

function BookingWizard() {
  const [customerID] = useState(() => getCustomerID());
  const [hasSecureBookingParams] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('bookingId') && params.get('accessToken'));
    } catch {
      return false;
    }
  });
  // top-level view management: 'landing', 'wizard', 'shoe-rack', 'bookings', 'guest-booking-lookup'
  const [currentView, setCurrentView] = useState(
    hasSecureBookingParams ? 'guest-booking-lookup' : 'landing'
  );

  // navigation within the wizard
  const [step, setStep] = useState(1);
  const [highestReachedStep, setHighestReachedStep] = useState(1);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Track the furthest step the user has reached so we know which tabs are clickable
  useEffect(() => {
    setHighestReachedStep(prev => Math.max(prev, step));
  }, [step]);

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goPrev = () => {
    if (step === 1) {
      setCurrentView('landing');
    } else {
      setStep((s) => Math.max(s - 1, 1));
    }
  };

  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });

  // sneaker registry
  const [sneakers, setSneakers] = useState([]);
  const [editingSneaker, setEditingSneaker] = useState(null);
  const [currentSneakerHistory, setCurrentSneakerHistory] = useState(EMPTY_HISTORY);
  const [currentSneakerNotes, setCurrentSneakerNotes] = useState('');
  const [reviewQueue, setReviewQueue] = useState([]);
  const [currentReviewSneakerId, setCurrentReviewSneakerId] = useState(null);

  // tracking whether we are in "re-register" flow from Step 6
  const [returningToManage, setReturningToManage] = useState(false);

  const [services, setServices] = useState({});
  const [bookingAgreements, setBookingAgreements] = useState(DEFAULT_BOOKING_AGREEMENTS);

  const [handoffMethod, setHandoffMethod] = useState('');
  const [shippingSelection, setShippingSelection] = useState(DEFAULT_SHIPPING_SELECTION);

  const [adminSettings, setAdminSettings] = useState(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  useEffect(() => {
    console.log("may-27-6:17")
    fetchAdminSettings().then((settings) => {
      setAdminSettings(settings);

      // Update shipping selection with values from settings
      setShippingSelection(prev => ({
        ...prev,
        returnShippingBufferPercentage: settings.returnShippingBufferPercentage,
        shippingCreditPerPair: settings.shippingCreditPerPair,
      }));

      setIsSettingsLoading(false);
    });
  }, []);

  // Compute maxSneakerPairs dynamically
  const maxSneakerPairs = adminSettings?.shippingBoxLibrary
    ? adminSettings.shippingBoxLibrary.reduce((max, box) => Math.max(max, box.sneakerQuantity), 0)
    : 10;

  const handleStepClick = (targetInternalStep) => {
    if (targetInternalStep > highestReachedStep) return;

    let actualTarget = targetInternalStep;

    // "Footwear" tab (target=2): once the user has moved past the sub-steps,
    // jump to the review list (step 5) rather than the blank registration form.
    if (targetInternalStep === 2 && highestReachedStep >= 5) {
      actualTarget = 5;
    }

    // When landing on the review list, clear any in-progress sub-step state.
    if (actualTarget === 5) {
      setEditingSneaker(null);
      setIsAddingNew(false);
      setReviewQueue([]);
      setCurrentReviewSneakerId(null);
    }

    setStep(actualTarget);
  };

  const showLimitToast = () => {
    toast.warning(`A maximum of ${maxSneakerPairs} footwear pairs is allowed per booking.`);
  };

  const loadSneakerReviewState = (sneaker) => {
    setCurrentSneakerHistory(normalizeHistory(sneaker?.history));
    setCurrentSneakerNotes(sneaker?.notes || '');
  };

  const startReviewFlow = (nextSneakers, sneakerIds) => {
    const queue = sneakerIds.filter(Boolean);

    if (!queue.length) {
      setReviewQueue([]);
      setCurrentReviewSneakerId(null);
      setStep(5);
      return;
    }

    const firstSneaker = nextSneakers.find((sneaker) => getSneakerKey(sneaker) === queue[0]);

    setReviewQueue(queue);
    setCurrentReviewSneakerId(queue[0]);
    loadSneakerReviewState(firstSneaker);
    setStep(3);
  };

  const handleSneakerSave = (sneakerData) => {
    if (!editingSneaker && sneakers.length >= maxSneakerPairs) {
      showLimitToast();
      return;
    }

    const fallbackId = createLocalSneakerId();

    const newImages = sneakerData.images || [];

    // Only use images uploaded in this booking session — never pull in previously saved images.
    const combinedImages = newImages;

    let mergedData = { ...sneakerData, images: combinedImages };

    const nextSneaker = editingSneaker
      ? {
        ...editingSneaker,
        ...mergedData,
        id: getSneakerKey({ ...editingSneaker, ...mergedData }) || fallbackId,
      }
      : {
        ...mergedData,
        id: getSneakerKey(mergedData) || fallbackId,
      };

    if (nextSneaker.existingImages !== undefined) {
      delete nextSneaker.existingImages;
    }

    const isAlreadyInOrder = editingSneaker && sneakers.some(s => getSneakerKey(s) === getSneakerKey(editingSneaker));

    const nextSneakers = isAlreadyInOrder
      ? sneakers.map((s) =>
        getSneakerKey(s) === getSneakerKey(editingSneaker) ? nextSneaker : s
      )
      : [...sneakers, nextSneaker];

    setSneakers(nextSneakers);
    setEditingSneaker(null);
    setIsAddingNew(false);
    startReviewFlow(nextSneakers, [getSneakerKey(nextSneaker)]);
  };

  const handleReviewComplete = () => {
    const nextSneakers = sneakers.map((sneaker) =>
      getSneakerKey(sneaker) === currentReviewSneakerId
        ? {
          ...sneaker,
          history: currentSneakerHistory,
          notes: currentSneakerNotes,
        }
        : sneaker
    );

    const remainingQueue = reviewQueue.slice(1);

    setSneakers(nextSneakers);

    if (remainingQueue.length) {
      const nextSneaker = nextSneakers.find(
        (sneaker) => getSneakerKey(sneaker) === remainingQueue[0]
      );
      setReviewQueue(remainingQueue);
      setCurrentReviewSneakerId(remainingQueue[0]);
      loadSneakerReviewState(nextSneaker);
      setStep(3);
      return;
    }

    setReviewQueue([]);
    setCurrentReviewSneakerId(null);

    if (returningToManage) {
      setReturningToManage(false);
    }

    setStep(5);
  };

  const handleEditSneaker = (sneaker) => {
    setEditingSneaker(sneaker);
    setReturningToManage(true);
    setStep(2);
  };

  const handleRemoveSneaker = (sneakerId) => {
    setSneakers((prev) => prev.filter((s) => (s.id || s._id) !== sneakerId));
    // removing associated service selection too
    setServices((prev) => {
      const updated = { ...prev };
      delete updated[sneakerId];
      return updated;
    });
  };

  const handleAddAnotherSneaker = () => {
    if (sneakers.length >= maxSneakerPairs) {
      showLimitToast();
      return;
    }

    setEditingSneaker(null);
    setIsAddingNew(false);
    setReturningToManage(false);
    setCurrentSneakerHistory(EMPTY_HISTORY);
    setCurrentSneakerNotes('');
    setReviewQueue([]);
    setCurrentReviewSneakerId(null);
    setStep(2);
  };

  const handleServiceChange = (sneakerId, serviceData) => {
    setServices((prev) => ({ ...prev, [sneakerId]: serviceData }));
  };

  const handleAddExistingSneaker = (sneaker) => {
    const sneakerId = getSneakerKey(sneaker);
    const alreadySelected = sneakers.some((item) => getSneakerKey(item) === sneakerId);

    if (alreadySelected) {
      handleRemoveSneaker(sneakerId);
      return;
    }

    if (sneakers.length >= maxSneakerPairs) {
      showLimitToast();
      return;
    }

    const sneakerForOrder = {
      ...sneaker,
      id: sneakerId,
      existingImages: sneaker.images || [],
      images: []
    };

    setEditingSneaker(sneakerForOrder);
    setReturningToManage(false);
  };

  const handleStartAddingNewSneaker = () => {
    if (sneakers.length >= maxSneakerPairs) {
      showLimitToast();
      return;
    }

    setIsAddingNew(true);
  };

  const handleRegistrationNext = (sneakerData) => handleSneakerSave(sneakerData);

  const showIndicator = currentView === 'wizard';

  if (isSettingsLoading) {
    return (
      <div className="booking-wizard">
        <div className="booking-wizard__loading-container">
          <div className="booking-wizard__spinner"></div>
          <h3 className="booking-wizard__loading-title">Loading Booking Wizard</h3>
          <p className="booking-wizard__loading-text">Preparing your footwear cleaning experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-wizard">
      {showIndicator && (
        <StepIndicator
          currentStep={step}
          highestReachedStep={highestReachedStep}
          onStepClick={handleStepClick}
        />
      )}

      {/* Sub-step progress bar visible while moving through the Footwear stage */}
      {currentView === 'wizard' && step >= 2 && step <= 4 && (
        <div className="booking-wizard__footwear-substeps">
          <span className="booking-wizard__footwear-stage-label">Footwear:</span>
          {FOOTWEAR_SUB_STEPS.map((ss, i) => (
            <React.Fragment key={ss.label}>
              {i > 0 && <span className="booking-wizard__substep-sep" aria-hidden="true">›</span>}
              <span
                className={[
                  'booking-wizard__substep',
                  step === ss.internalStep ? 'booking-wizard__substep--active' : '',
                  step > ss.internalStep  ? 'booking-wizard__substep--done'   : '',
                ].filter(Boolean).join(' ')}
              >
                {step > ss.internalStep && <span aria-hidden="true">✓ </span>}
                {ss.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="booking-wizard__body">
        {currentView === 'landing' && (
          <LandingStep
            onStart={() => {
              setCurrentView('wizard');
              setStep(1);
            }}
            customerID={customerID}
            onViewShoeRack={() => setCurrentView('shoe-rack')}
            onViewBookings={() => setCurrentView('bookings')}
            onViewGuestBooking={() => setCurrentView('guest-booking-lookup')}
          />
        )}

        {currentView === 'shoe-rack' && (
          <ShoeRackManagement
            customerID={customerID}
            onBack={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'bookings' && (
          <BookingsManagement
            customerID={customerID}
            onBack={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'guest-booking-lookup' && (
          <GuestBookingLookup onBack={() => setCurrentView('landing')} />
        )}

        {currentView === 'wizard' && (
          <>
            {step === 1 && (
              <CustomerCheckStep
                customerID={customerID}
                guestInfo={guestInfo}
                onGuestInfoChange={setGuestInfo}
                onNext={goNext}
                onPrev={() => setCurrentView('landing')}
              />
            )}

            {step === 2 && (
              (customerID && !isAddingNew && !editingSneaker) ? (
                <ShoeRackSelectionStep
                  customerID={customerID}
                  sneakers={sneakers}
                  maxSneakers={maxSneakerPairs}
                  onAddExisting={handleAddExistingSneaker}
                  onAddNew={handleStartAddingNewSneaker}
                  onLimitReached={showLimitToast}
                  onEditExisting={handleEditSneaker}
                  onNext={sneakers.length > 0 ? () => setStep(5) : null}
                  onPrev={goPrev}
                />
              ) : (
                <SneakerRegistrationStep
                  editingSneaker={editingSneaker}
                  onSave={(data) => {
                    handleRegistrationNext(data);
                  }}
                  onPrev={() => {
                    if (customerID && editingSneaker) {
                      const isAlreadyInOrder = sneakers.some(s => getSneakerKey(s) === getSneakerKey(editingSneaker));
                      setEditingSneaker(null);
                      setReturningToManage(false);
                      if (isAlreadyInOrder) {
                        setStep(5);
                      } else {
                        setIsAddingNew(false);
                      }
                      return;
                    }
                    if (customerID && isAddingNew) {
                      setIsAddingNew(false);
                      return;
                    }
                    goPrev();
                  }}
                />
              )
            )}

            {step === 3 && (
              <SneakerHistoryStep
                history={currentSneakerHistory}
                onHistoryChange={setCurrentSneakerHistory}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}

            {step === 4 && (
              <AdditionalNotesStep
                notes={currentSneakerNotes}
                onNotesChange={setCurrentSneakerNotes}
                onNext={handleReviewComplete}
                onPrev={goPrev}
              />
            )}

            {step === 5 && (
              <AddMoreSneakersStep
                sneakers={sneakers}
                maxSneakers={maxSneakerPairs}
                onAddAnother={handleAddAnotherSneaker}
                onLimitReached={showLimitToast}
                onEdit={handleEditSneaker}
                onRemove={handleRemoveSneaker}
                onNext={sneakers.length > 0 ? goNext : null}
                onPrev={() => {
                  if (customerID) {
                    setStep(2);
                  } else {
                    setStep(4);
                  }
                }}
              />
            )}

            {step === 6 && (
              <ServiceSelectionStep
                sneakers={sneakers}
                services={services}
                onServiceChange={handleServiceChange}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}

            {step === 7 && (
              <SummaryStep
                sneakers={sneakers}
                services={services}
                bookingAgreements={bookingAgreements}
                onBookingAgreementsChange={setBookingAgreements}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}

            {step === 8 && (
              <AgreementStep
                bookingAgreements={bookingAgreements}
                onBookingAgreementsChange={setBookingAgreements}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}

            {step === 9 && (
              <HandoffMethodStep
                handoffMethod={handoffMethod}
                onHandoffChange={setHandoffMethod}
                shippingSelection={shippingSelection}
                onShippingChange={setShippingSelection}
                bookingData={{
                  customerID,
                  guestInfo,
                  sneakers,
                  services,
                  agreements: bookingAgreements,
                }}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}

            {step === 10 && <ConfirmationStep handoffMethod={handoffMethod} />}
          </>
        )}
      </div>
    </div>
  );
}

export default BookingWizard;
