import React, { useState, useEffect } from 'react';
import StepLayout from '../../shared/StepLayout/StepLayout.jsx';
import SneakerCard from '../../shared/SneakerCard/SneakerCard.jsx';
import './ShoeRackSelectionStep.css';
import { PROXY_SUB_PATH } from '../../../utils/global.js';

function ShoeRackSelectionStep({ customerID, sneakers, maxSneakers, onAddExisting, onAddNew, onLimitReached, onEditExisting, onNext, onPrev }) {
    const [savedSneakers, setSavedSneakers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const hasReachedLimit = sneakers.length >= maxSneakers;

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

    const handleDeleteSneaker = async (sneakerId) => {
        try {
            const res = await fetch(`/apps/${PROXY_SUB_PATH}/api/delete/sneaker`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: sneakerId }),
            });
            const data = await res.json();
            if (data.success) {
                // Deselect from current order if it was selected
                const sneaker = savedSneakers.find(s => s._id === sneakerId);
                if (sneaker && sneakers.some(s => s._id === sneakerId)) {
                    onAddExisting(sneaker);
                }
                setSavedSneakers(prev => prev.filter(s => s._id !== sneakerId));
            }
        } catch (err) {
            console.error('Error deleting sneaker:', err);
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
                Select footwear from your Shoe Rack or add a new pair for this order.
            </p>
            {hasReachedLimit && (
                <p className="step-description step-description--warning">A maximum of {maxSneakers} footwear pairs is allowed per booking.</p>
            )}

            {isLoading ? (
                <p>Loading your footwear...</p>
            ) : (
                <div className="shoe-rack-grid">
                    {savedSneakers.map(snk => (
                        <div key={snk._id} className={`shoe-rack-item ${sneakers.some(s => s._id === snk._id) ? 'selected' : ''}`}>
                            <SneakerCard
                                sneaker={{ ...snk, id: snk._id }}
                                mode="manage"
                                onEdit={() => onEditExisting(snk)}
                                onRemove={handleDeleteSneaker}
                            />
                            <button
                                className={`btn ${sneakers.some(s => s._id === snk._id) ? 'btn--danger' : 'btn--primary'}`}
                                onClick={() => {
                                    console.log("sneaker already selected", sneakers.some(s => s._id === snk._id))
                                    console.log("hi....")
                                    console.log("hasReachedLimit", hasReachedLimit)
                                    console.log("!sneakers.some(s => s._id === snk._id) && hasReachedLimit", !sneakers.some(s => s._id === snk._id) && hasReachedLimit)
                                    if (!sneakers.some(s => s._id === snk._id) && hasReachedLimit) {
                                        onLimitReached();
                                        return;
                                    }
                                    console.log("adding sneaker", snk);

                                    onAddExisting(snk);
                                }}
                            >
                                {sneakers.some(s => s._id === snk._id) ? 'Remove from Order' : 'Add to Order'}
                            </button>
                        </div>
                    ))}
                    <button className="btn btn--secondary btn--add-new" onClick={hasReachedLimit ? onLimitReached : handleAddNewClick}>
                        + Add New Footwear
                    </button>
                </div>
            )}

            {sneakers.length > 0 && (
                <div className="selected-count">
                    <strong>{sneakers.length}</strong> footwear(s) selected for this order.
                </div>
            )}
        </StepLayout>
    );
}

export default ShoeRackSelectionStep;
