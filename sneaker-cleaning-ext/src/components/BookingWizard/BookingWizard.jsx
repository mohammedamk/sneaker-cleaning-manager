import React, { useState } from 'react';
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

// reading shopify customer id if available
function getCustomerID() {
  try {
    return window?.ShopifyAnalytics?.meta?.page?.customerId || null;
  } catch {
    return null;
  }
}

const TOTAL_STEPS = 10;

function BookingWizard() {
  const customerID = getCustomerID();

  // top-level view management: 'landing', 'wizard', 'shoe-rack'
  const [currentView, setCurrentView] = useState('landing');

  // navigation within the wizard
  const [step, setStep] = useState(1);
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
  const [currentSneakerHistory, setCurrentSneakerHistory] = useState({
    professionallyCleaned: '',
    alterations: [],
  });
  const [currentSneakerNotes, setCurrentSneakerNotes] = useState('');

  // tracking whether we are in "re-register" flow from Step 6
  const [returningToManage, setReturningToManage] = useState(false);

  const [services, setServices] = useState({});

  const [handoffMethod, setHandoffMethod] = useState('');

  const handleSneakerSave = (sneakerData) => {
    if (editingSneaker) {
      setSneakers((prev) =>
        prev.map((s) =>
          s.id === sneakerData.id ? { ...s, ...sneakerData } : s
        )
      );
      setEditingSneaker(null);
      // jumping back to manage step if we came from there
      if (returningToManage) {
        setReturningToManage(false);
        setStep(6);
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
    setStep(3);
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
    setCurrentSneakerHistory({ professionallyCleaned: '', alterations: [] });
    setCurrentSneakerNotes('');
    setStep(3);
  };

  const handleServiceChange = (sneakerId, serviceData) => {
    setServices((prev) => ({ ...prev, [sneakerId]: serviceData }));
  };

  // step 3→4 and 4→5 navigation
  // these steps are part of a per-sneaker sub-flow:
  // step 3: registration → step 4: history → step 5: notes → step 6: manage
  // however, when editing from step 6, we skip history/notes and go straight back
  const handleRegistrationNext = (sneakerData) => handleSneakerSave(sneakerData);

  const showIndicator = currentView === 'wizard' && step > 1 && step < TOTAL_STEPS;

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
          />
        )}

        {currentView === 'shoe-rack' && (
          <ShoeRackManagement
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

            {step === 3 && (
              customerID ? (
                <ShoeRackSelectionStep
                  customerID={customerID}
                  sneakers={sneakers}
                  onAddExisting={(snk) => {
                    if (sneakers.some(s => s._id === snk._id)) {
                      setSneakers(prev => prev.filter(s => s._id !== snk._id));
                    } else {
                      setSneakers(prev => [...prev, snk]);
                    }
                  }}
                  onAddNew={(full) => setSneakers(prev => [...prev, full])}
                  onEditExisting={handleEditSneaker}
                  onNext={() => setStep(6)}
                  onPrev={() => setStep(1)}
                />
              ) : (
                <SneakerRegistrationStep
                  editingSneaker={editingSneaker}
                  onSave={handleRegistrationNext}
                  onPrev={() => {
                    if (returningToManage) {
                      setReturningToManage(false);
                      setEditingSneaker(null);
                      setStep(6);
                    } else {
                      goPrev();
                    }
                  }}
                />
              )
            )}

            {step === 4 && (
              <SneakerHistoryStep
                history={currentSneakerHistory}
                onHistoryChange={setCurrentSneakerHistory}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}

            {step === 5 && (
              <AdditionalNotesStep
                notes={currentSneakerNotes}
                onNotesChange={setCurrentSneakerNotes}
                onNext={() => {
                  // committing the last sneaker with accumulated history + notes
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

            {step === 6 && (
              <AddMoreSneakersStep
                sneakers={sneakers}
                onAddAnother={handleAddAnotherSneaker}
                onEdit={handleEditSneaker}
                onRemove={handleRemoveSneaker}
                onNext={sneakers.length > 0 ? goNext : null}
                onPrev={() => {
                  if (customerID) {
                    setStep(3);
                  } else {
                    goPrev();
                  }
                }}
              />
            )}

            {step === 7 && (
              <ServiceSelectionStep
                sneakers={sneakers}
                services={services}
                onServiceChange={handleServiceChange}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}

            {step === 8 && (
              <SummaryStep
                sneakers={sneakers}
                services={services}
                notes={currentSneakerNotes}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}

            {step === 9 && (
              <HandoffMethodStep
                handoffMethod={handoffMethod}
                onHandoffChange={setHandoffMethod}
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

            {step === 10 && <ConfirmationStep handoffMethod={handoffMethod} />}
          </>
        )}
      </div>
    </div>
  );
}

export default BookingWizard;
