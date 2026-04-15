import React, { useState, useEffect, useCallback } from 'react';
import './ShoeRackManagement.css';
import { PROXY_SUB_PATH } from '../../utils/global.js';
import ShoeRackSneakerStep from '../steps/ShoeRackSneakerStep/ShoeRackSneakerStep.jsx';
import AppIcon from '../shared/AppIcon/AppIcon.jsx';

const IMAGE_POLL_INTERVAL_MS = 3000;

const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

function ShoeRackManagement({ customerID, onBack }) {
    const [sneakers, setSneakers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingSneaker, setEditingSneaker] = useState(null);

    // Temporary state for the form
    const [tempSneaker, setTempSneaker] = useState(null);

    const fetchSneakers = useCallback(async ({ showLoader = true } = {}) => {
        if (showLoader) {
            setIsLoading(true);
        }
        try {
            const res = await fetch(`/apps/${PROXY_SUB_PATH}/api/get/sneakers?customerID=${customerID}`);
            const data = await res.json();
            if (data.success) {
                setSneakers(data.sneakers);
            }
        } catch (err) {
            console.error("Error fetching sneakers:", err);
        } finally {
            if (showLoader) {
                setIsLoading(false);
            }
        }
    }, [customerID]);

    useEffect(() => {
        if (customerID) {
            fetchSneakers();
        }
    }, [customerID, fetchSneakers]);

    useEffect(() => {
        if (!customerID || !sneakers.some((snk) => snk.imageProcessing)) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            fetchSneakers({ showLoader: false });
        }, IMAGE_POLL_INTERVAL_MS);

        return () => window.clearTimeout(timeoutId);
    }, [customerID, fetchSneakers, sneakers]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this sneaker from your rack?")) return;

        try {
            const res = await fetch(`/apps/${PROXY_SUB_PATH}/api/delete/sneaker`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        setShowForm(true);
    };

    const handleEditClick = (sneaker) => {
        setEditingSneaker(sneaker);
        setTempSneaker(sneaker);
        setShowForm(true);
    };

    const handleFinalSave = async (data) => {
        setIsLoading(true);

        const processedImages = [];

        if (data.images && Array.isArray(data.images)) {
            for (const img of data.images) {
                if (img.file) {
                    const base64 = await convertToBase64(img.file);
                    processedImages.push(base64);
                }
                else if (img.id && !img.file) {
                    processedImages.push(img.id);
                }
                else if (typeof img === "string") {
                    processedImages.push(img);
                }
            }
        }

        const payload = {
            ...data,
            images: processedImages,
            // preserving history and notes from editingSneaker if it exists
            history: editingSneaker?.history || { professionallyCleaned: '', alterations: [] },
            notes: editingSneaker?.notes || '',
            customerID,
            id: editingSneaker?._id
        };

        try {
            const url = editingSneaker
                ? `/apps/${PROXY_SUB_PATH}/api/update/sneaker`
                : `/apps/${PROXY_SUB_PATH}/api/create/sneaker`;

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const resData = await res.json();
            if (resData.success) {
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
                    <ShoeRackSneakerStep
                        editingSneaker={tempSneaker}
                        onSave={handleFinalSave}
                        onCancel={() => setShowForm(false)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="shoe-rack-management">
            <div className="shoe-rack-management__header">
                <h2>My Shoe Rack</h2>
                <div className="shoe-rack-management__actions">
                    <button className="btn btn--secondary" onClick={onBack}>
                        <span className="btn__content">
                            <AppIcon name="arrowLeft" />
                            <span>Back to Booking</span>
                        </span>
                    </button>
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
                                            {snk.imageProcessing ? (
                                                <div className="table-img table-img--placeholder" aria-label="Sneaker image is processing">
                                                    <span className="table-img__spinner" />
                                                    <span className="table-img__label">Processing</span>
                                                </div>
                                            ) : snk.images && snk.images[0]?.url ? (
                                                <img src={snk.images[0].url} alt={snk.nickname} className="table-img" />
                                            ) : (
                                                <div className="table-img table-img--empty">No image</div>
                                            )}
                                        </td>
                                        <td><strong>{snk.nickname}</strong></td>
                                        <td>{snk.brand} {snk.model}</td>
                                        <td>{snk.colorway}</td>
                                        <td>{snk.size} {snk.sizeUnit}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="btn btn--small btn--secondary" onClick={() => handleEditClick(snk)}>Edit</button>
                                                <button className="btn btn--small btn--danger" onClick={() => handleDelete(snk._id)}>Delete</button>
                                            </div>
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
