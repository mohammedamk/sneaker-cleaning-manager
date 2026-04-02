import { useState, useEffect, useRef, useCallback } from "react";
import { useActionData, useSubmit, useNavigation } from "react-router";

const getStatusTone = (status) => {
    switch (status) {
        case "Pending": return "warning";
        case "Received": return "auto";
        case "Under Inspection": return "caution";
        case "In Cleaning": return "info";
        case "Awaiting Customer Approval": return "warning";
        case "Cleaning Complete": return "info";
        case "Ready for Pickup / Shipment": return "success";
        case "Completed": return "success";
        case "Canceled": return "critical";
        default: return "subdued";
    }
};

const PAGE_LIMIT = 10;

const STATUS_OPTIONS = [
    "Pending", "Received", "Under Inspection", "In Cleaning",
    "Awaiting Customer Approval", "Cleaning Complete",
    "Ready for Pickup / Shipment", "Completed", "Canceled"
];

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const getSneakerUploadKey = (bookingId, sneakerIndex) => `${bookingId}-${sneakerIndex}`;

const getObjectIdString = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();

    if (typeof value.toString === "function") {
        const stringValue = value.toString();
        if (stringValue && stringValue !== "[object Object]") {
            return stringValue;
        }
    }

    const bytes = value?.buffer?.data
        || (Array.isArray(value?.buffer) ? value.buffer : null)
        || (Array.isArray(value?.id?.buffer) ? value.id.buffer : null)
        || value?.id?.buffer?.data;

    if (Array.isArray(bytes) && bytes.length === 12) {
        return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    return "";
};

const hasCleanedImages = (booking) => (booking?.sneakers || []).some(
    (sneaker) => Array.isArray(sneaker.cleanedImages) && sneaker.cleanedImages.length > 0,
);

const updateBookingInList = (bookings, updatedBooking) => bookings.map((item) => (
    getObjectIdString(item._id) === getObjectIdString(updatedBooking._id) ? updatedBooking : item
));

export default function BookingsIndex() {
    const actionData = useActionData();
    const navigation = useNavigation();
    const submit = useSubmit();

    const editModalRef = useRef(null);
    const viewModalRef = useRef(null);
    const deleteModalRef = useRef(null);

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [tableLoading, setTableLoading] = useState(false);

    const [editingBooking, setEditingBooking] = useState(null);
    const [viewingBooking, setViewingBooking] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [cleanedImageDrafts, setCleanedImageDrafts] = useState({});

    const totalPages = Math.ceil(total / PAGE_LIMIT);

    const fetchPage = useCallback(async (targetPage, query = "") => {
        setTableLoading(true);
        try {
            const res = await fetch(
                "/api/admin/bookings",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ page: targetPage, limit: PAGE_LIMIT, search: query })
                }
            );
            const jsonRes = await res.json();
            if (jsonRes.success) {
                setItems(jsonRes.data);
                setTotal(jsonRes.total);
                setPage(jsonRes.page);
            }
        } catch (err) {
            console.error("Failed to fetch bookings", err);
        } finally {
            setTableLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPage(1);
    }, [fetchPage]);

    useEffect(() => {
        if (!actionData) return;
        if (actionData.success) {
            shopify.toast.show(actionData.message);

            if (actionData.booking) {
                setViewingBooking(actionData.booking);
                setItems((currentItems) => updateBookingInList(currentItems, actionData.booking));
            }

            if (actionData.actionType === "UPLOAD_CLEANED_IMAGES" && actionData.booking?._id) {
                setCleanedImageDrafts((currentDrafts) => {
                    const nextDrafts = { ...currentDrafts };
                    const bookingId = getObjectIdString(actionData.booking._id);
                    (actionData.booking.sneakers || []).forEach((_, sneakerIndex) => {
                        delete nextDrafts[getSneakerUploadKey(bookingId, sneakerIndex)];
                    });
                    return nextDrafts;
                });
                fetchPage(page, search);
                return;
            }

            if (actionData.actionType === "DELETE_CLEANED_IMAGE") {
                fetchPage(page, search);
                return;
            }

            if (actionData.actionType === "SEND_CLEANED_EMAIL") {
                fetchPage(page, search);
                return;
            }

            editModalRef.current?.hideOverlay?.();
            viewModalRef.current?.hideOverlay?.();
            deleteModalRef.current?.hideOverlay?.();
            setEditingBooking(null);
            setViewingBooking(null);
            setPreviewImage(null);
            setItemToDelete(null);
            fetchPage(page, search);
            return;
        }

        if (actionData.message) {
            shopify.toast.show(actionData.message, { isError: true });
        }
    }, [actionData, fetchPage, page, search]);

    const handleSearch = (val) => {
        setSearch(val);
        fetchPage(1, val);
    };

    const handleEdit = (item) => {
        setEditingBooking(item);
        editModalRef.current?.showOverlay?.();
    };

    const handleView = (item) => {
        setViewingBooking(item);
        viewModalRef.current?.showOverlay?.();
    };

    const handlePreviewImage = (imageUrl) => {
        viewModalRef.current?.hideOverlay?.();
        setPreviewImage(imageUrl);
    };

    const handleStatusUpdate = (status) => {
        if (editingBooking) {
            const formData = new FormData();
            formData.append("actionType", "UPDATE_STATUS");
            formData.append("id", getObjectIdString(editingBooking._id));
            formData.append("status", status);
            submit(formData, { method: "post" });
        }
    };

    const handleSendCleanedEmail = () => {
        if (!viewingBooking) return;

        const formData = new FormData();
        formData.append("actionType", "SEND_CLEANED_EMAIL");
        formData.append("id", getObjectIdString(viewingBooking._id));
        submit(formData, { method: "post" });
    };

    const handleDeleteCleanedImage = (bookingId, sneakerIndex, imageIndex) => {
        const formData = new FormData();
        formData.append("actionType", "DELETE_CLEANED_IMAGE");
        formData.append("id", getObjectIdString(bookingId));
        formData.append("sneakerIndex", String(sneakerIndex));
        formData.append("imageIndex", String(imageIndex));
        submit(formData, { method: "post" });
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            const formData = new FormData();
            formData.append("actionType", "DELETE");
            formData.append("id", itemToDelete);
            submit(formData, { method: "post" });
        }
    };

    const changePage = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        fetchPage(newPage, search);
    };

    const handleDownloadImage = async (imageUrl, sneakerName, imageIndex) => {
        if (!imageUrl) return;

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            const sanitizedName = (sneakerName || "sneaker")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");

            link.href = objectUrl;
            link.download = `${sanitizedName || "sneaker"}-${imageIndex + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error("Failed to download sneaker image:", error);
            window.open(imageUrl, "_blank", "noopener,noreferrer");
        }
    };

    const handleCleanedImagesChange = (bookingId, sneakerIndex, files) => {
        const uploadKey = getSneakerUploadKey(getObjectIdString(bookingId), sneakerIndex);
        const nextFiles = Array.from(files || []).map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
        }));

        setCleanedImageDrafts((currentDrafts) => {
            (currentDrafts[uploadKey] || []).forEach((draft) => URL.revokeObjectURL(draft.previewUrl));
            return {
                ...currentDrafts,
                [uploadKey]: nextFiles,
            };
        });
    };

    const handleUploadCleanedImages = async (bookingId, sneakerIndex) => {
        const normalizedBookingId = getObjectIdString(bookingId);
        const uploadKey = getSneakerUploadKey(normalizedBookingId, sneakerIndex);
        const draftFiles = cleanedImageDrafts[uploadKey] || [];

        if (!draftFiles.length) {
            shopify.toast.show("Choose at least one cleaned sneaker image first.", { isError: true });
            return;
        }

        try {
            const images = await Promise.all(draftFiles.map((draft) => readFileAsDataUrl(draft.file)));
            const formData = new FormData();
            formData.append("actionType", "UPLOAD_CLEANED_IMAGES");
            formData.append("id", normalizedBookingId);
            formData.append("cleanedUploads", JSON.stringify([{ sneakerIndex, images }]));
            submit(formData, { method: "post" });
        } catch (error) {
            console.error("Failed to prepare cleaned sneaker images:", error);
            shopify.toast.show("We could not prepare the cleaned images for upload.", { isError: true });
        }
    };

    const activeActionType = navigation.formData?.get("actionType");
    const isSubmitting = navigation.state === "submitting";

    return (
        <s-page heading="Sneaker Cleaning Bookings" subtitle="Manage and track customer cleaning orders">

            <div className="bookings-header">
                <div className="search-container">
                    <s-text-field placeholder="Search by ID, Name or Email..." value={search} onInput={(e) =>
                        handleSearch(e.target.value)}
                        prefix="🔍"
                    ></s-text-field>
                </div>
                <s-text variant="bodySm" tone="subdued">
                    Showing {items.length} of {total} results
                </s-text>
            </div>

            <s-section padding="none">
                {tableLoading ? (
                    <div className="loader-container">
                        <s-spinner size="large" />
                    </div>
                ) : (
                    <s-table paginate hasPreviousPage={page > 1}
                        hasNextPage={page < totalPages} onPreviousPage={() => changePage(page - 1)}
                        onNextPage={() => changePage(page + 1)}
                    >
                        <s-table-header-row>
                            <s-table-header>Order</s-table-header>
                            <s-table-header>Customer</s-table-header>
                            <s-table-header>Qty</s-table-header>
                            <s-table-header>Method</s-table-header>
                            <s-table-header>Status</s-table-header>
                            <s-table-header>Date</s-table-header>
                            <s-table-header>Actions</s-table-header>
                        </s-table-header-row>

                        <s-table-body>
                            {items.map((item, itemIndex) => (
                                <s-table-row key={getObjectIdString(item._id) || `booking-${itemIndex}`}>
                                    <s-table-cell>
                                        <code className="order-id-code">
                                            #{getObjectIdString(item._id)}
                                        </code>
                                    </s-table-cell>
                                    <s-table-cell>
                                        <div className="customer-info">
                                            <s-text type="strong">{item.name || item.guestInfo?.name || "Guest User"}</s-text>
                                            <s-text variant="bodySm" tone="subdued">{item.email || item.guestInfo?.email}</s-text>
                                        </div>
                                    </s-table-cell>
                                    <s-table-cell>
                                        <s-badge tone="info">{Array.isArray(item.sneakers) ? item.sneakers.length : 0}
                                            {" Pairs"}</s-badge>
                                    </s-table-cell>
                                    <s-table-cell>
                                        <s-text variant="bodySm">{item.handoffMethod}</s-text>
                                    </s-table-cell>
                                    <s-table-cell>
                                        <s-badge tone={getStatusTone(item.status)}>
                                            {item.status}
                                        </s-badge>
                                    </s-table-cell>
                                    <s-table-cell>
                                        <s-text variant="bodySm">{new Date(item.submittedAt).toLocaleDateString()}</s-text>
                                    </s-table-cell>
                                    <s-table-cell>
                                        <div className="actions-container">
                                            <s-button size="slim" variant="secondary" onClick={() => handleView(item)}>View</s-button>
                                            <s-button size="slim" onClick={() => handleEdit(item)}>Update Status</s-button>
                                        </div>
                                    </s-table-cell>
                                </s-table-row>
                            ))}
                        </s-table-body>
                    </s-table>
                )}
            </s-section>

            <div className="pagination-footer">
                <div className="pagination-controls">
                    <s-text variant="bodySm">Page <b>{page}</b> of {totalPages}</s-text>
                </div>
            </div>

            <s-modal id="edit-modal" ref={editModalRef} heading="Manage Booking Status">
                {editingBooking && (
                    <div className="modal-content">
                        <div className="current-status-banner">
                            <s-text variant="bodySm" tone="subdued">CURRENTLY UPDATING</s-text>
                            <div className="modal-header-row">
                                <s-text type="strong">{editingBooking.name || editingBooking.guestInfo?.name}</s-text>
                                <s-badge>{editingBooking.status}</s-badge>
                            </div>
                        </div>

                        <s-text type="strong">Select New Status</s-text>
                        <div className="status-grid">
                            {STATUS_OPTIONS.map((opt) => (
                                <s-button key={opt} pressed={editingBooking.status === opt} variant={editingBooking.status === opt
                                    ? "primary" : "secondary"} onClick={() => handleStatusUpdate(opt)}
                                    loading={isSubmitting && activeActionType === "UPDATE_STATUS"}
                                >
                                    {opt}
                                </s-button>
                            ))}
                        </div>
                    </div>
                )}
            </s-modal>

            <s-modal id="view-modal" ref={viewModalRef} heading="Booking Details">
                {viewingBooking && (
                    <div className="booking-view-modal">
                        <div className="booking-view-grid">
                            <div className="booking-view-card">
                                <s-text variant="bodySm" tone="subdued">BOOKING ID</s-text>
                                <s-text type="strong">#{getObjectIdString(viewingBooking._id)}</s-text>
                            </div>
                            <div className="booking-view-card">
                                <s-text variant="bodySm" tone="subdued">STATUS</s-text>
                                <s-badge tone={getStatusTone(viewingBooking.status)}>{viewingBooking.status}</s-badge>
                            </div>
                            <div className="booking-view-card">
                                <s-text variant="bodySm" tone="subdued">CUSTOMER</s-text>
                                <s-text type="strong">{viewingBooking.name || viewingBooking.guestInfo?.name || "Guest User"}</s-text>
                                <s-text variant="bodySm" tone="subdued">{viewingBooking.email || viewingBooking.guestInfo?.email || "No email"}</s-text>
                            </div>
                            <div className="booking-view-card">
                                <s-text variant="bodySm" tone="subdued">HANDOFF</s-text>
                                <s-text>{viewingBooking.handoffMethod || "N/A"}</s-text>
                            </div>
                            <div className="booking-view-card">
                                <s-text variant="bodySm" tone="subdued">SUBMITTED</s-text>
                                <s-text>{new Date(viewingBooking.submittedAt).toLocaleDateString()} {new Date(viewingBooking.submittedAt).toLocaleTimeString()}</s-text>
                            </div>
                            <div className="booking-view-card">
                                <s-text variant="bodySm" tone="subdued">PHONE</s-text>
                                <s-text>{viewingBooking.guestInfo?.phone || viewingBooking.phone || "N/A"}</s-text>
                            </div>
                        </div>

                        <div className="booking-view-toolbar">
                            <div>
                                <s-text type="strong">Post-cleaning updates</s-text>
                                <s-text variant="bodySm" tone="subdued">Upload cleaned sneaker photos, then email the customer a direct link to view them.</s-text>
                            </div>
                            {hasCleanedImages(viewingBooking) && (
                                <s-button
                                    variant="primary"
                                    onClick={handleSendCleanedEmail}
                                    loading={isSubmitting && activeActionType === "SEND_CLEANED_EMAIL"}
                                >
                                    Send email to customer
                                </s-button>
                            )}
                        </div>

                        <div className="booking-view-section">
                            <s-text type="strong">Sneakers ({Array.isArray(viewingBooking.sneakers) ? viewingBooking.sneakers.length : 0})</s-text>
                            <div className="booking-view-sneakers">
                                {(viewingBooking.sneakers || []).map((sneaker, sneakerIndex) => {
                                    const bookingId = getObjectIdString(viewingBooking._id);
                                    const uploadKey = getSneakerUploadKey(bookingId, sneakerIndex);
                                    const draftFiles = cleanedImageDrafts[uploadKey] || [];
                                    const sneakerKey = getObjectIdString(sneaker._id) || sneaker.id || sneakerIndex;

                                    return (
                                        <div className="booking-view-sneaker" key={sneakerKey}>
                                            <div className="booking-view-sneaker__meta">
                                                <s-text type="strong">{sneaker.nickname || "Unnamed Sneaker"}</s-text>
                                                <s-text variant="bodySm" tone="subdued">
                                                    {[sneaker.brand, sneaker.model, sneaker.colorway].filter(Boolean).join(" - ") || "No sneaker details"}
                                                </s-text>
                                                {sneaker.services && (
                                                    <s-text variant="bodySm">
                                                        Service: {sneaker.services.tier}
                                                        {sneaker.services.addOns?.length ? ` + ${sneaker.services.addOns.join(", ")}` : ""}
                                                    </s-text>
                                                )}
                                            </div>

                                            <div className="booking-view-image-group">
                                                <s-text type="strong">Before cleaning</s-text>
                                                <div className="booking-view-images">
                                                    {sneaker.images?.length ? (
                                                        sneaker.images.map((imageUrl, imageIndex) => (
                                                            <div className="booking-view-image-card" key={`${sneakerKey}-before-${imageIndex}`}>
                                                                <button
                                                                    type="button"
                                                                    className="booking-view-image-button"
                                                                    onClick={() => handlePreviewImage(imageUrl)}
                                                                >
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={`${sneaker.nickname || "Sneaker"} before cleaning ${imageIndex + 1}`}
                                                                        className="booking-view-image"
                                                                    />
                                                                </button>
                                                                <div className="booking-view-image-actions">
                                                                    <s-button size="slim" variant="secondary" onClick={() => handlePreviewImage(imageUrl)}>
                                                                        Preview
                                                                    </s-button>
                                                                    <s-button size="slim" variant="secondary" onClick={() => handleDownloadImage(imageUrl, `${sneaker.nickname || "sneaker"}-before`, imageIndex)}>
                                                                        Download
                                                                    </s-button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="booking-view-image-empty">No original image uploaded</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="booking-view-image-group booking-view-image-group--cleaned">
                                                <div className="booking-view-section-header">
                                                    <s-text type="strong">After cleaning</s-text>
                                                    <s-text variant="bodySm" tone="subdued">Customers will see these images on their booking details page after upload.</s-text>
                                                </div>

                                                <div className="booking-view-images">
                                                    {sneaker.cleanedImages?.length ? (
                                                        sneaker.cleanedImages.map((imageUrl, imageIndex) => (
                                                            <div className="booking-view-image-card" key={`${sneakerKey}-after-${imageIndex}`}>
                                                                <button
                                                                    type="button"
                                                                    className="booking-view-image-button"
                                                                    onClick={() => handlePreviewImage(imageUrl)}
                                                                >
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={`${sneaker.nickname || "Sneaker"} after cleaning ${imageIndex + 1}`}
                                                                        className="booking-view-image"
                                                                    />
                                                                </button>
                                                                <div className="booking-view-image-actions">
                                                                    <s-button size="slim" variant="secondary" onClick={() => handlePreviewImage(imageUrl)}>
                                                                        Preview
                                                                    </s-button>
                                                                    <s-button size="slim" variant="secondary" onClick={() => handleDownloadImage(imageUrl, `${sneaker.nickname || "sneaker"}-after`, imageIndex)}>
                                                                        Download
                                                                    </s-button>
                                                                    <s-button
                                                                        size="slim"
                                                                        variant="secondary"
                                                                        tone="critical"
                                                                        onClick={() => handleDeleteCleanedImage(bookingId, sneakerIndex, imageIndex)}
                                                                        loading={isSubmitting && activeActionType === "DELETE_CLEANED_IMAGE"}
                                                                    >
                                                                        Delete
                                                                    </s-button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="booking-view-image-empty">No cleaned image uploaded yet</div>
                                                    )}
                                                </div>

                                                <div className="booking-view-upload-box">
                                                    <label className="booking-view-upload-label" htmlFor={`cleaned-images-${uploadKey}`}>
                                                        Upload cleaned images
                                                    </label>
                                                    <input
                                                        id={`cleaned-images-${uploadKey}`}
                                                        className="booking-view-file-input"
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={(event) => handleCleanedImagesChange(bookingId, sneakerIndex, event.target.files)}
                                                    />
                                                    {draftFiles.length > 0 && (
                                                        <div className="booking-view-upload-previews">
                                                            {draftFiles.map((draft, draftIndex) => (
                                                                <img
                                                                    key={`${uploadKey}-${draftIndex}`}
                                                                    src={draft.previewUrl}
                                                                    alt={`Selected cleaned sneaker preview ${draftIndex + 1}`}
                                                                    className="booking-view-upload-preview"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="booking-view-upload-actions">
                                                        <s-button
                                                            variant="primary"
                                                            onClick={() => handleUploadCleanedImages(bookingId, sneakerIndex)}
                                                            loading={isSubmitting && activeActionType === "UPLOAD_CLEANED_IMAGES"}
                                                        >
                                                            Upload cleaned images
                                                        </s-button>
                                                        <s-text variant="bodySm" tone="subdued">
                                                            You can upload multiple after-cleaning images at once, and new uploads are added to the current gallery.
                                                        </s-text>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </s-modal>

            {previewImage && (
                <div className="booking-image-preview" role="dialog" aria-modal="true" aria-label="Booking sneaker image preview">
                    <button
                        type="button"
                        className="booking-image-preview__backdrop"
                        onClick={() => setPreviewImage(null)}
                        aria-label="Close booking image preview"
                    />
                    <div className="booking-image-preview__content">
                        <button
                            type="button"
                            className="booking-image-preview__close"
                            onClick={() => setPreviewImage(null)}
                            aria-label="Close booking image preview"
                        >
                            ×
                        </button>
                        <img src={previewImage} alt="Booking sneaker preview" className="booking-image-preview__image" />
                    </div>
                </div>
            )}

            <s-modal id="delete-modal" accessibilityLabel="delete-modal" ref={deleteModalRef} heading="Confirm Delete">
                <div className="delete-modal-content">
                    <s-text>Are you sure you want to delete this booking record? This action cannot be undone.</s-text>
                </div>
                <div className="delete-modal-actions">
                    <s-button onClick={() => deleteModalRef.current?.hideOverlay?.()}>Cancel</s-button>
                    <s-button tone="critical" onClick={confirmDelete} loading={isSubmitting && activeActionType === "DELETE"}>
                        Confirm Delete
                    </s-button>
                </div>
            </s-modal>
        </s-page>
    );
}
