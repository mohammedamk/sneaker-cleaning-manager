import React, { useState, useEffect } from 'react';
import './ShoeRackManagement.css';
import { PROXY_SUB_PATH } from '../../utils/global.js';
import SneakerRegistrationStep from '../steps/SneakerRegistrationStep/SneakerRegistrationStep.jsx';
import SneakerHistoryStep from '../steps/SneakerHistoryStep/SneakerHistoryStep.jsx';
import AdditionalNotesStep from '../steps/AdditionalNotesStep/AdditionalNotesStep.jsx';

function ShoeRackManagement({ customerID, onBack }) {
    const [sneakers, setSneakers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingSneaker, setEditingSneaker] = useState(null);
    const [formStep, setFormStep] = useState('registration'); // registration, history, notes

    // Temporary state for the form
    const [tempSneaker, setTempSneaker] = useState(null);
    const [tempHistory, setTempHistory] = useState({ professionallyCleaned: '', alterations: [] });
    const [tempNotes, setTempNotes] = useState('');

    useEffect(() => {
        if (customerID) {
            fetchSneakers();
        }
    }, [customerID]);

    const fetchSneakers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/apps/${PROXY_SUB_PATH}/api/get/sneakers?customerID=${customerID}`);
            const data = await res.json();
            if (data.success) {
                setSneakers(data.sneakers);
            }
        } catch (err) {
            console.error("Error fetching sneakers:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this sneaker from your rack?")) return;
        
        try {
            const res = await fetch(`/apps/${PROXY_SUB_PATH}/api/delete/sneaker`, {
                method: 'POST',
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.success) {
                setSneakers(prev => prev.filter(s => s._id !== id));
            }
        } catch (err) {
            console.error("Error deleting sneaker:", err);
        }
    };

    const handleAddClick = () => {
        setEditingSneaker(null);
        setTempSneaker(null);
        setTempHistory({ professionallyCleaned: '', alterations: [] });
        setTempNotes('');
        setFormStep('registration');
        setShowForm(true);
    };

    const handleEditClick = (sneaker) => {
        setEditingSneaker(sneaker);
        setTempSneaker(sneaker);
        setTempHistory(sneaker.history || { professionallyCleaned: '', alterations: [] });
        setTempNotes(sneaker.notes || '');
        setFormStep('registration');
        setShowForm(true);
    };

    const handleRegistrationSave = (data) => {
        setTempSneaker(data);
        setFormStep('history');
    };

    const handleHistoryNext = () => {
        setFormStep('notes');
    };

    const handleFinalSave = async () => {
        setIsLoading(true);
        const payload = {
            ...tempSneaker,
            history: tempHistory,
            notes: tempNotes,
            customerID,
            id: editingSneaker?._id
        };

        const endpoint = editingSneaker ? 'update' : 'create/booking'; // Using create/booking logic if they don't have a direct create endpoint that just saves to rack. 
        // Actually, let's assume api.create.booking handles it if we send it in a specific way OR we should have a dedicated create sneaker API.
        // Given api.create.booking exists and saves sneakers if customerID is present, but it also creates a booking.
        // The user might want a direct "Save to Rack" API. I'll use api.update.sneaker for updates.
        // For NEW ones, I'll need a new API or reuse booking if that's what's expected.
        // Let's create api.create.sneaker.js to be safe.

        try {
            const url = editingSneaker 
                ? `/apps/${PROXY_SUB_PATH}/api/update/sneaker` 
                : `/apps/${PROXY_SUB_PATH}/api/create/sneaker`;
            
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setShowForm(false);
                fetchSneakers();
            }
        } catch (err) {
            console.error("Error saving sneaker:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (showForm) {
        return (
            <div className="shoe-rack-form-overlay">
                <div className="shoe-rack-form-container">
                    <button className="btn btn--ghost btn--close" onClick={() => setShowForm(false)}>✕ Close</button>
                    {formStep === 'registration' && (
                        <SneakerRegistrationStep 
                            editingSneaker={tempSneaker} 
                            onSave={handleRegistrationSave} 
                            onPrev={() => setShowForm(false)} 
                        />
                    )}
                    {formStep === 'history' && (
                        <SneakerHistoryStep 
                            history={tempHistory} 
                            onHistoryChange={setTempHistory} 
                            onNext={handleHistoryNext} 
                            onPrev={() => setFormStep('registration')} 
                        />
                    )}
                    {formStep === 'notes' && (
                        <AdditionalNotesStep 
                            notes={tempNotes} 
                            onNotesChange={setTempNotes} 
                            onNext={handleFinalSave} 
                            onPrev={() => setFormStep('history')} 
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="shoe-rack-management">
            <div className="shoe-rack-management__header">
                <h2>My Shoe Rack</h2>
                <div className="shoe-rack-management__actions">
                    <button className="btn btn--secondary" onClick={onBack}>← Back to Booking</button>
                    <button className="btn btn--primary" onClick={handleAddClick}>+ Add New Sneaker</button>
                </div>
            </div>

            {isLoading && !sneakers.length ? (
                <div className="loading-state">Loading your collection...</div>
            ) : (
                <div className="shoe-rack-table-container">
                    <table className="shoe-rack-table">
                        <thead>
                            <tr>
                                <th>Sneaker</th>
                                <th>Nickname</th>
                                <th>Brand / Model</th>
                                <th>Colorway</th>
                                <th>Size</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sneakers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-row">Your Shoe Rack is empty. Add your first pair!</td>
                                </tr>
                            ) : (
                                sneakers.map(snk => (
                                    <tr key={snk._id}>
                                        <td>
                                            {snk.images && snk.images[0] && (
                                                <img src={snk.images[0]} alt={snk.nickname} className="table-img" />
                                            )}
                                        </td>
                                        <td><strong>{snk.nickname}</strong></td>
                                        <td>{snk.brand} {snk.model}</td>
                                        <td>{snk.colorway}</td>
                                        <td>{snk.size} {snk.sizeUnit}</td>
                                        <td className="table-actions">
                                            <button className="btn btn--small btn--secondary" onClick={() => handleEditClick(snk)}>Edit</button>
                                            <button className="btn btn--small btn--danger" onClick={() => handleDelete(snk._id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ShoeRackManagement;
