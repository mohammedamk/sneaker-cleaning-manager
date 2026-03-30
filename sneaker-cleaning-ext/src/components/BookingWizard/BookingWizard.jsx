import { useEffect, useState } from 'react';
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
  const [customerID, setCustomerID] = useState(null);
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

  useEffect(() => {
    console.log("step...........", step)
  }, [step])

  // sneaker registry
  const [sneakers, setSneakers] = useState([]);
  const [editingSneaker, setEditingSneaker] = useState(null);
  const [currentSneakerHistory, setCurrentSneakerHistory] = useState({
    professionallyCleaned: '',
    alterations: [],
  });
  const [currentSneakerNotes, setCurrentSneakerNotes] = useState('');

  // tracking whether we are in "re-register" flow from Step 6
  const [returningToManage, setReturningToManage] = useState(false);

  const [services, setServices] = useState({});

  const [handoffMethod, setHandoffMethod] = useState('');
  const [shippingSelection, setShippingSelection] = useState(DEFAULT_SHIPPING_SELECTION);

  useEffect(() => {
    const id = getCustomerID();
    setCustomerID(id);
  }, []);

  const handleSneakerSave = (sneakerData) => {
    if (editingSneaker) {
      setSneakers((prev) =>
        prev.map((s) =>
          (s._id || s.id) === (sneakerData._id || sneakerData.id) ? { ...s, ...sneakerData } : s
        )
      );
      setEditingSneaker(null);
      // jumping back to manage step if we came from there
      if (returningToManage) {
        setReturningToManage(false);
        setEditingSneaker(null);
        setIsAddingNew(false);
        setStep(5);
        return;
      }
    } else {
      // brand new sneaker — attaching current history and notes
      const full = {
        ...sneakerData,
        history: currentSneakerHistory,
        notes: currentSneakerNotes,
      };
      setSneakers((prev) => [...prev, full]);
      // resetting per-sneaker working state
      setCurrentSneakerHistory({ professionallyCleaned: '', alterations: [] });
      setCurrentSneakerNotes('');
    }
    goNext();
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
    setCurrentSneakerHistory({ professionallyCleaned: '', alterations: [] });
    setCurrentSneakerNotes('');
    setStep(2);
  };

  const handleServiceChange = (sneakerId, serviceData) => {
    setServices((prev) => ({ ...prev, [sneakerId]: serviceData }));
  };

  // step 3→4 and 4→5 navigation
  // these steps are part of a per-sneaker sub-flow:
  // step 3: registration → step 4: history → step 5: notes → step 6: manage
  // however, when editing from step 6, we skip history/notes and go straight back
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
                  onAddExisting={(snk) => {
                    if (sneakers.some(s => (s._id || s.id) === (snk._id || snk.id))) {
                      handleRemoveSneaker(snk._id || snk.id);
                    } else {
                      setSneakers(prev => [...prev, snk]);
                    }
                  }}
                  onAddNew={() => setIsAddingNew(true)}
                  onEditExisting={handleEditSneaker}
                  onNext={() => setStep(5)} // skipping History/Notes for saved shoes as they have them
                  onPrev={goPrev}
                />
              ) : (
                <SneakerRegistrationStep
                  editingSneaker={editingSneaker}
                  onSave={(data) => {
                    handleRegistrationNext(data);
                    setIsAddingNew(false);
                    // if editing, handleRegistrationNext already handled step 5 return via returningToManage
                    // else it goes to step 3 via goNext inside handleSneakerSave
                  }}
                  onPrev={() => {
                    if (customerID && (isAddingNew || editingSneaker)) {
                      setIsAddingNew(false);
                      setEditingSneaker(null);
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
                onNext={() => {
                  const lastPending = sneakers[sneakers.length - 1];
                  if (lastPending && !lastPending.history) {
                    setSneakers((prev) =>
                      prev.map((s, i) =>
                        i === prev.length - 1
                          ? { ...s, history: currentSneakerHistory, notes: currentSneakerNotes }
                          : s
                      )
                    );
                  }
                  goNext();
                }}
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
                notes={currentSneakerNotes}
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
