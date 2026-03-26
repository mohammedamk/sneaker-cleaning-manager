import React, { useState, useEffect } from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import SneakerCard from '../../shared/SneakerCard/SneakerCard.jsx';
import './ShoeRackSelectionStep.css';
import { PROXY_SUB_PATH } from '../../../utils/global.js';

function ShoeRackSelectionStep({ customerID, sneakers, onAddExisting, onAddNew, onEditExisting, onNext, onPrev }) {
    const [savedSneakers, setSavedSneakers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

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
        onAddNew();
    };

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
