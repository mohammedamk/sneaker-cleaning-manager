import { useState } from 'react';
import StepIndicator from '../shared/StepIndicator/StepIndicator.jsx';
import './BookingWizard.css';

import LandingStep from '../steps/LandingStep/LandingStep.jsx';
import CustomerCheckStep from '../steps/CustomerCheckStep/CustomerCheckStep.jsx';
import SneakerRegistrationStep from '../steps/SneakerRegistrationStep/SneakerRegistrationStep.jsx';
import SneakerHistoryStep from '../steps/SneakerHistoryStep/SneakerHistoryStep.jsx';
import AdditionalNotesStep from '../steps/AdditionalNotesStep/AdditionalNotesStep.jsx';
import AddMoreSneakersStep from '../steps/AddMoreSneakersStep/AddMoreSneakersStep.jsx';
import ServiceSelectionStep from '../steps/ServiceSelectionStep/ServiceSelectionStep.jsx';
import SummaryStep from '../steps/SummaryStep/SummaryStep.jsx';
import HandoffMethodStep from '../steps/HandoffMethodStep/HandoffMethodStep.jsx';
import ConfirmationStep from '../steps/ConfirmationStep/ConfirmationStep.jsx';
import ShoeRackSelectionStep from '../steps/ShoeRackSelectionStep/ShoeRackSelectionStep.jsx';
import ShoeRackManagement from '../ShoeRackManagement/ShoeRackManagement.jsx';
import BookingsManagement from '../BookingsManagement/BookingsManagement.jsx';

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

const TOTAL_STEPS = 9;

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
  storeAddress: null,
};

function BookingWizard() {
  const [customerID] = useState(() => getCustomerID());
  // top-level view management: 'landing', 'wizard', 'shoe-rack', 'bookings'
  const [currentView, setCurrentView] = useState('landing');

  // navigation within the wizard
  const [step, setStep] = useState(1);
  const [isAddingNew, setIsAddingNew] = useState(false);
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

  const [handoffMethod, setHandoffMethod] = useState('');
  const [shippingSelection, setShippingSelection] = useState(DEFAULT_SHIPPING_SELECTION);

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
    const fallbackId = createLocalSneakerId();
    const nextSneaker = editingSneaker
      ? {
        ...editingSneaker,
        ...sneakerData,
        id: getSneakerKey({ ...editingSneaker, ...sneakerData }) || fallbackId,
      }
      : {
        ...sneakerData,
        id: getSneakerKey(sneakerData) || fallbackId,
      };

    const nextSneakers = editingSneaker
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

    const nextSneaker = { ...sneaker, id: sneakerId };
    const nextSneakers = [...sneakers, nextSneaker];

    setSneakers(nextSneakers);
    setReturningToManage(false);
    startReviewFlow(nextSneakers, [sneakerId]);
  };

  const handleRegistrationNext = (sneakerData) => handleSneakerSave(sneakerData);

  const showIndicator = currentView === 'wizard'

  return (
    <div className="booking-wizard">
      {showIndicator && (
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
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
                  onAddExisting={handleAddExistingSneaker}
                  onAddNew={() => setIsAddingNew(true)}
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
                      setEditingSneaker(null);
                      setReturningToManage(false);
                      setStep(5);
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
                onAddAnother={handleAddAnotherSneaker}
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
                onNext={goNext}
                onPrev={goPrev}
              />
            )}

            {step === 8 && (
              <HandoffMethodStep
                handoffMethod={handoffMethod}
                onHandoffChange={setHandoffMethod}
                shippingSelection={shippingSelection}
                onShippingChange={setShippingSelection}
                bookingData={{
                  customerID,
                  guestInfo,
                  sneakers,
                  services
                }}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}

            {step === 9 && <ConfirmationStep handoffMethod={handoffMethod} />}
          </>
        )}
      </div>
    </div>
  );
}

export default BookingWizard;
