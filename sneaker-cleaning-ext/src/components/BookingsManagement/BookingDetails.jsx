import { useEffect, useState } from 'react';
import { PROXY_SUB_PATH } from '../../utils/global.js';
import './BookingsManagement.css';
import AppIcon from '../shared/AppIcon/AppIcon.jsx';
import BookingInfoSection from './components/BookingInfoSection.jsx';
import BookingImagePreviewModal from './components/BookingImagePreviewModal.jsx';
import BookingSneakerCard from './components/BookingSneakerCard.jsx';
import {
    downloadImage,
    formatDateTime,
    getBookingStatusClassName,
} from './bookingDetails.helpers.js';

function BookingDetails({
    booking,
    onBack,
    onBookingUpdate,
    title = 'Booking Details',
    backLabel = 'Back to List'
}) {
    const [currentBooking, setCurrentBooking] = useState(booking);
    const [previewImage, setPreviewImage] = useState(null);
    const [approvalLoadingBySneaker, setApprovalLoadingBySneaker] = useState({});
    const [approvalActionBySneaker, setApprovalActionBySneaker] = useState({});
    const [showRejectionNoteFormBySneaker, setShowRejectionNoteFormBySneaker] = useState({});
    const [rejectionNoteBySneaker, setRejectionNoteBySneaker] = useState({});

    useEffect(() => {
        setCurrentBooking(booking);
        setShowRejectionNoteFormBySneaker({});
        setRejectionNoteBySneaker({});
    }, [booking]);

    const handleSneakerApprovalUpdate = async (sneakerIndex, nextStatus, noteOverride = '') => {
        const sneaker = currentBooking.sneakers?.[sneakerIndex];

        if (!sneaker || !Array.isArray(sneaker.cleanedImages) || sneaker.cleanedImages.length === 0 || approvalLoadingBySneaker[sneakerIndex]) {
            return;
        }

        const trimmedNote = noteOverride.trim();

        if (nextStatus === 'rejected' && !trimmedNote) {
            alert('Please add a note before rejecting.');
            return;
        }

        setApprovalLoadingBySneaker((prev) => ({ ...prev, [sneakerIndex]: true }));
        setApprovalActionBySneaker((prev) => ({ ...prev, [sneakerIndex]: nextStatus }));

        try {
            const params = new URLSearchParams(window.location.search);
            const bookingID = params.get('bookingId')?.trim() || currentBooking._id;
            const accessToken = params.get('accessToken')?.trim();

            const response = await fetch(`/apps/${PROXY_SUB_PATH}/api/get/booking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actionType: 'UPDATE_CLEANING_APPROVAL',
                    bookingID,
                    sneakerIndex,
                    approvalStatus: nextStatus,
                    ...(nextStatus === 'rejected' ? { approvalNote: trimmedNote } : {}),
                    ...(accessToken ? { accessToken } : { email: (currentBooking.email || currentBooking.guestInfo?.email || '').trim() }),
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to update approval status.');
            }

            setCurrentBooking(data.booking);
            setShowRejectionNoteFormBySneaker((prev) => ({ ...prev, [sneakerIndex]: false }));
            setRejectionNoteBySneaker((prev) => ({ ...prev, [sneakerIndex]: '' }));
            onBookingUpdate?.(data.booking);
        } catch (error) {
            console.error('Failed to update cleaned image approval:', error);
            alert(error.message || 'Failed to update approval status.');
        } finally {
            setApprovalLoadingBySneaker((prev) => ({ ...prev, [sneakerIndex]: false }));
            setApprovalActionBySneaker((prev) => ({ ...prev, [sneakerIndex]: '' }));
        }
    };

    const handleApprove = (sneakerIndex) => {
        setShowRejectionNoteFormBySneaker((prev) => ({ ...prev, [sneakerIndex]: false }));
        setRejectionNoteBySneaker((prev) => ({ ...prev, [sneakerIndex]: '' }));
        handleSneakerApprovalUpdate(sneakerIndex, 'approved');
    };

    const handleShowRejectForm = (sneakerIndex) => {
        setShowRejectionNoteFormBySneaker((prev) => ({ ...prev, [sneakerIndex]: true }));
    };

    const handleHideRejectForm = (sneakerIndex) => {
        setShowRejectionNoteFormBySneaker((prev) => ({ ...prev, [sneakerIndex]: false }));
        setRejectionNoteBySneaker((prev) => ({ ...prev, [sneakerIndex]: '' }));
    };

    const handleRejectionNoteChange = (sneakerIndex, value) => {
        setRejectionNoteBySneaker((prev) => ({ ...prev, [sneakerIndex]: value }));
    };

    const handleSubmitReject = (sneakerIndex) => {
        handleSneakerApprovalUpdate(sneakerIndex, 'rejected', rejectionNoteBySneaker[sneakerIndex]);
    };

    return (
        <>
            <div className="bookings-management booking-details">
                <div className="bookings-management__header">
                    <h2 className="bookings-management__title">{title}</h2>
                    <button className="btn btn--secondary" onClick={onBack}>
                        <span className="btn__content">
                            <AppIcon name="arrowLeft" />
                            <span>{backLabel}</span>
                        </span>
                    </button>
                </div>

                <BookingInfoSection title="General Information">
                    <div className="booking-details__grid">
                        <div className="detail-item">
                            <span className="detail-item__label">Booking ID</span>
                            <span className="detail-item__value">#{currentBooking._id}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item__label">Status</span>
                            <span className={getBookingStatusClassName(currentBooking.status)}>
                                {currentBooking.status}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item__label">Submitted On</span>
                            <span className="detail-item__value">
                                {new Date(currentBooking.submittedAt).toLocaleDateString()} {new Date(currentBooking.submittedAt).toLocaleTimeString()}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item__label">Handoff Method</span>
                            <span className="detail-item__value" style={{ textTransform: 'capitalize' }}>
                                {currentBooking.handoffMethod}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item__label">Cleaning Photos</span>
                            <span className="detail-item__value">
                                Check each sneaker below for individual cleaning photo status
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item__label">Last Cleaning</span>
                            <span className="detail-item__value">
                                {formatDateTime(currentBooking.lastCleaning)}
                            </span>
                        </div>
                    </div>
                </BookingInfoSection>

                <BookingInfoSection title="Customer Information">
                    <div className="booking-details__grid">
                        <div className="detail-item">
                            <span className="detail-item__label">Name</span>
                            <span className="detail-item__value">{currentBooking?.name || currentBooking.guestInfo?.name || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-item__label">Email</span>
                            <span className="detail-item__value">{currentBooking?.email || currentBooking.guestInfo?.email || 'N/A'}</span>
                        </div>
                        {currentBooking.guestInfo?.phone && (
                            <div className="detail-item">
                                <span className="detail-item__label">Phone</span>
                                <span className="detail-item__value">{currentBooking.guestInfo.phone}</span>
                            </div>
                        )}
                    </div>
                </BookingInfoSection>

                <BookingInfoSection title={`Registered Sneakers (${currentBooking.sneakers?.length || 0})`}>
                    <div className="booking-details__sneaker-list">
                        {currentBooking.sneakers?.map((sneaker, sneakerIndex) => (
                            <BookingSneakerCard
                                key={sneaker._id || sneakerIndex}
                                sneaker={sneaker}
                                sneakerIndex={sneakerIndex}
                                approvalLoadingBySneaker={approvalLoadingBySneaker}
                                approvalActionBySneaker={approvalActionBySneaker}
                                showRejectionNoteFormBySneaker={showRejectionNoteFormBySneaker}
                                rejectionNoteBySneaker={rejectionNoteBySneaker}
                                onPreviewImage={setPreviewImage}
                                onDownloadImage={downloadImage}
                                onApprove={handleApprove}
                                onShowRejectForm={handleShowRejectForm}
                                onHideRejectForm={handleHideRejectForm}
                                onRejectionNoteChange={handleRejectionNoteChange}
                                onSubmitReject={handleSubmitReject}
                            />
                        ))}
                    </div>
                </BookingInfoSection>
            </div>

            <BookingImagePreviewModal
                imageUrl={previewImage}
                onClose={() => setPreviewImage(null)}
            />
        </>
    );
}

export default BookingDetails;
