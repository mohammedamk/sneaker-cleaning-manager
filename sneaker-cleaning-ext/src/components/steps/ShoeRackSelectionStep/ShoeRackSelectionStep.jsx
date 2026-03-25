import React, { useState, useEffect } from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import SneakerCard from '../../shared/SneakerCard/SneakerCard.jsx';
import SneakerRegistrationStep from '../SneakerRegistrationStep/SneakerRegistrationStep.jsx';
import SneakerHistoryStep from '../SneakerHistoryStep/SneakerHistoryStep.jsx';
import AdditionalNotesStep from '../AdditionalNotesStep/AdditionalNotesStep.jsx';
import './ShoeRackSelectionStep.css';
import { PROXY_SUB_PATH } from '../../../utils/global.js';

function ShoeRackSelectionStep({ customerID, sneakers, onAddExisting, onAddNew, onEditExisting, onNext, onPrev }) {
    const [savedSneakers, setSavedSneakers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newSneakerMode, setNewSneakerMode] = useState('registration'); // registration, history, notes
    const [tempSneaker, setTempSneaker] = useState({
        nickname: '', brand: '', model: '', colorway: '', size: '', sizeUnit: 'US', images: []
    });
    const [tempHistory, setTempHistory] = useState({ professionallyCleaned: '', alterations: [] });
    const [tempNotes, setTempNotes] = useState('');
    const [saveToRack, setSaveToRack] = useState(true);

    useEffect(() => {
        if (customerID) {
            fetchSavedSneakers();
        }
    }, [customerID]);

    const fetchSavedSneakers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/apps/${PROXY_SUB_PATH}/api/get/sneakers?customerID=${customerID}`);
            const data = await res.json();
            if (data.success) {
                setSavedSneakers(data.sneakers);
            }
        } catch (err) {
            console.error("Error fetching saved sneakers:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNewClick = () => {
        setShowNewForm(true);
        setNewSneakerMode('registration');
    };

    const handleNewRegistrationSave = (data) => {
        setTempSneaker(data);
        setNewSneakerMode('history');
    };

    const handleNewHistoryNext = () => {
        setNewSneakerMode('notes');
    };

    const handleNewNotesSave = () => {
        const fullSneaker = {
            ...tempSneaker,
            history: tempHistory,
            notes: tempNotes,
            isTemporary: !saveToRack
        };
        onAddNew(fullSneaker);
        setShowNewForm(false);
        // Reset
        setTempSneaker({ nickname: '', brand: '', model: '', colorway: '', size: '', sizeUnit: 'US', images: [] });
        setTempHistory({ professionallyCleaned: '', alterations: [] });
        setTempNotes('');
    };

    if (showNewForm) {
        if (newSneakerMode === 'registration') {
            return (
                <div className="new-sneaker-subflow">
                    <SneakerRegistrationStep
                        onSave={handleNewRegistrationSave}
                        onPrev={() => setShowNewForm(false)}
                    />
                    <div className="save-rack-option">
                        <label>
                            <input type="checkbox" checked={saveToRack} onChange={e => setSaveToRack(e.target.checked)} />
                            Save this sneaker to my Shoe Rack
                        </label>
                    </div>
                </div>
            );
        }
        if (newSneakerMode === 'history') {
            return (
                <SneakerHistoryStep
                    history={tempHistory}
                    onHistoryChange={setTempHistory}
                    onNext={handleNewHistoryNext}
                    onPrev={() => setNewSneakerMode('registration')}
                />
            );
        }
        if (newSneakerMode === 'notes') {
            return (
                <AdditionalNotesStep
                    notes={tempNotes}
                    onNotesChange={setTempNotes}
                    onNext={handleNewNotesSave}
                    onPrev={() => setNewSneakerMode('history')}
                />
            );
        }
    }

    return (
        <StepLayout
            title="Your Shoe Rack"
            onNext={onNext}
            onPrev={onPrev}
            nextLabel="Continue to Services"
        >
            <p className="step-description">
                Select sneakers from your Shoe Rack or add a new pair for this order.
            </p>

            {isLoading ? (
                <p>Loading your sneakers...</p>
            ) : (
                <div className="shoe-rack-grid">
                    {savedSneakers.map(snk => (
                        <div key={snk._id} className={`shoe-rack-item ${sneakers.some(s => s._id === snk._id) ? 'selected' : ''}`}>
                            <SneakerCard
                                sneaker={{ ...snk, id: snk._id }}
                                mode="manage"
                                onEdit={() => onEditExisting(snk)}
                                onRemove={() => {/* maybe hide from this view */ }}
                            />
                            <button
                                className={`btn ${sneakers.some(s => s._id === snk._id) ? 'btn--danger' : 'btn--primary'}`}
                                onClick={() => onAddExisting(snk)}
                            >
                                {sneakers.some(s => s._id === snk._id) ? 'Remove from Order' : 'Add to Order'}
                            </button>
                        </div>
                    ))}
                    <button className="btn btn--secondary btn--add-new" onClick={handleAddNewClick}>
                        + Add New Sneaker
                    </button>
                </div>
            )}

            {sneakers.length > 0 && (
                <div className="selected-count">
                    <strong>{sneakers.length}</strong> sneaker(s) selected for this order.
                </div>
            )}
        </StepLayout>
    );
}

export default ShoeRackSelectionStep;
