import { useState, useEffect, useRef, useCallback } from "react";
import { useActionData, useSubmit, useNavigation } from "react-router";

const getStatusTone = (status) => {
    switch (status) {
        case 'Pending': return 'warning';
        case 'Received': return 'auto';
        case 'Under Inspection': return 'caution';
        case 'In Cleaning': return 'info';
        case 'Awaiting Customer Approval': return 'warning';
        case 'Cleaning Complete': return 'info';
        case 'Ready for Pickup / Shipment': return 'success';
        case 'Completed': return 'success';
        case 'Canceled': return 'critical';
        default: return 'subdued';
    }
};

const PAGE_LIMIT = 10;

const STATUS_OPTIONS = [
    'Pending', 'Received', 'Under Inspection', 'In Cleaning',
    'Awaiting Customer Approval', 'Cleaning Complete',
    'Ready for Pickup / Shipment', 'Completed', 'Canceled'
];

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

    const totalPages = Math.ceil(total / PAGE_LIMIT);

    const fetchPage = useCallback(async (targetPage, query = "") => {
        setTableLoading(true);
        try {
            const res = await fetch(
                `/api/admin/bookings`,
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
        if (actionData?.success) {
            editModalRef.current?.hideOverlay?.();
            viewModalRef.current?.hideOverlay?.();
            deleteModalRef.current?.hideOverlay?.();
            shopify.toast.show(actionData.message);
            setEditingBooking(null);
            setViewingBooking(null);
            setPreviewImage(null);
            setItemToDelete(null);
            fetchPage(page, search);
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
            formData.append("id", editingBooking._id);
            formData.append("status", status);
            submit(formData, { method: "post" });
        }
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
                            {items.map((item) => (
                                <s-table-row key={item._id}>
                                    <s-table-cell>
                                        <code className="order-id-code">
                                            #{item._id}
                                        </code>
                                    </s-table-cell>
                                    <s-table-cell>
                                        <div className="customer-info">
                                            <s-text type="strong">{item.name || item.guestInfo?.name || 'Guest User'}</s-text>
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
                            {STATUS_OPTIONS.map(opt => (
                                <s-button key={opt} pressed={editingBooking.status === opt} variant={editingBooking.status === opt
                                    ? "primary" : "secondary"} onClick={() => handleStatusUpdate(opt)}
                                    loading={navigation.state === "submitting"}
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
                                <s-text type="strong">#{viewingBooking._id}</s-text>
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

                        <div className="booking-view-section">
                            <s-text type="strong">Sneakers ({Array.isArray(viewingBooking.sneakers) ? viewingBooking.sneakers.length : 0})</s-text>
                            <div className="booking-view-sneakers">
                                {(viewingBooking.sneakers || []).map((sneaker, sneakerIndex) => (
                                    <div className="booking-view-sneaker" key={sneaker._id || sneakerIndex}>
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

                                        <div className="booking-view-images">
                                            {sneaker.images?.length ? (
                                                sneaker.images.map((imageUrl, imageIndex) => (
                                                    <div className="booking-view-image-card" key={`${sneaker._id || sneakerIndex}-${imageIndex}`}>
                                                        <button
                                                            type="button"
                                                            className="booking-view-image-button"
                                                            onClick={() => handlePreviewImage(imageUrl)}
                                                        >
                                                            <img
                                                                src={imageUrl}
                                                                alt={`${sneaker.nickname || "Sneaker"} ${imageIndex + 1}`}
                                                                className="booking-view-image"
                                                            />
                                                        </button>
                                                        <div className="booking-view-image-actions">
                                                            <s-button size="slim" variant="secondary" onClick={() => handlePreviewImage(imageUrl)}>
                                                                Preview
                                                            </s-button>
                                                            <s-button size="slim" variant="secondary" onClick={() => handleDownloadImage(imageUrl, sneaker.nickname, imageIndex)}>
                                                                Download
                                                            </s-button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="booking-view-image-empty">No image uploaded</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
                    <s-button tone="critical" onClick={confirmDelete} loading={navigation.state === "submitting"}>
                        Confirm Delete
                    </s-button>
                </div>
            </s-modal>
        </s-page>
    );
}
