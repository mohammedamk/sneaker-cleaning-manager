/* eslint-disable react/prop-types */
import { useState } from 'react';

export default function CreateChargeModal({
    modalRef,
    bookingId,
    customerEmail,
    customerName,
    onSuccess,
    onCancel,
    loading = false,
}) {
    const [chargeItemName, setChargeItemName] = useState('');
    const [chargeAmount, setChargeAmount] = useState('');
    const [customEmailContent, setCustomEmailContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        // Validate inputs
        if (!chargeItemName.trim()) {
            setError('Please enter a charge item name');
            return;
        }
        if (!chargeAmount || Number(chargeAmount) <= 0) {
            setError('Please enter a valid charge amount');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/create/charge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    chargeItemName,
                    chargeAmount: Number(chargeAmount),
                    customEmailContent,
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Reset form
                setChargeItemName('');
                setChargeAmount('');
                setCustomEmailContent('');

                // Close modal and notify parent
                if (modalRef?.current) {
                    modalRef.current?.hideOverlay?.();
                }

                // Call success callback
                if (onSuccess) {
                    onSuccess(result);
                }
            } else {
                setError(result.message || 'Failed to create charge');
            }
        } catch (err) {
            console.error('Error creating charge UI:', err);
            setError('An error occurred while creating the charge');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setChargeItemName('');
        setChargeAmount('');
        setCustomEmailContent('');
        setError('');
        console.log("modalRef?.current", modalRef?.current)
        if (modalRef?.current) {
            console.log("inside if modalRef?.current", modalRef?.current)
            modalRef.current?.hideOverlay?.();
        }
        console.log("onCancel", onCancel)
        if (onCancel) {
            console.log("inside if onCancel", onCancel)
            onCancel();
        }
    };

    return (
        <s-modal
            id="create-charge-modal"
            ref={modalRef}
            heading="Create Additional Charge"
        >
            <div style={{ padding: '0 20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <s-text tone="subdued">
                        Create a charge for additional carrier fees and send an invoice to the customer.
                    </s-text>
                </div>

                {error && (
                    <div
                        style={{
                            marginBottom: '20px',
                            padding: '12px 16px',
                            backgroundColor: '#fecdd3',
                            borderRadius: '4px',
                            border: '1px solid #fca5a5',
                        }}
                    >
                        <s-text tone="critical" variant="bodySm">
                            {error}
                        </s-text>
                    </div>
                )}

                <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <s-text type="strong" color="subdued">
                            {"Customer Information: "}
                        </s-text>
                        <s-text variant="bodySm">{`${customerName} ` || 'Unknown '}</s-text>
                        <s-text variant="bodySm" tone="subdued">
                            {`(${customerEmail})`}
                        </s-text>
                    </div>

                    <div>
                        <label htmlFor="charge-item-name" style={{ display: 'block', marginBottom: '8px' }}>
                            <s-text type="strong">Charge Item Name</s-text>
                        </label>
                        <s-text-field
                            id="charge-item-name"
                            placeholder="e.g., Additional Shipping Cost, Weight Surcharge"
                            value={chargeItemName}
                            onInput={(e) => {
                                setChargeItemName(e.currentTarget.value);
                                setError('');
                            }}
                            disabled={isSubmitting || loading}
                        />
                        <s-text variant="bodySm" tone="subdued">
                            Describe what the customer is being charged for
                        </s-text>
                    </div>

                    <div>
                        <label htmlFor="charge-amount" style={{ display: 'block', marginBottom: '8px' }}>
                            <s-text type="strong">Charge Amount</s-text>
                        </label>
                        <s-text-field
                            id="charge-amount"
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={chargeAmount}
                            onInput={(e) => {
                                setChargeAmount(e.currentTarget.value);
                                setError('');
                            }}
                            disabled={isSubmitting || loading}
                        />
                        <s-text variant="bodySm" tone="subdued">
                            Enter the amount in USD
                        </s-text>
                    </div>

                    <div>
                        <label htmlFor="email-content" style={{ display: 'block', marginBottom: '8px' }}>
                            <s-text type="strong">Custom Email Message (Optional)</s-text>
                        </label>
                        <textarea
                            id="email-content"
                            placeholder="Add any additional context or explanation for the customer..."
                            value={customEmailContent}
                            onChange={(e) => setCustomEmailContent(e.currentTarget.value)}
                            disabled={isSubmitting || loading}
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontFamily: 'Arial, sans-serif',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                            }}
                        />
                        <s-text variant="bodySm" tone="subdued">
                            This will be included in the email sent to the customer
                        </s-text>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <s-button
                        slot="secondary-actions"
                        commandFor="create-charge-modal"
                        command="--hide"
                        onClick={handleCancel}
                        disabled={isSubmitting || loading}
                    >
                        Cancel
                    </s-button>
                    <s-button
                        slot="primary-action"
                        variant="primary"
                        onClick={handleSubmit}
                        loading={isSubmitting || loading}
                    >
                        Create Charge & Send Invoice
                    </s-button>
                </div>
            </div>
        </s-modal>
    );
}
