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
    const deleteModalRef = useRef(null);

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [tableLoading, setTableLoading] = useState(false);

    const [editingBooking, setEditingBooking] = useState(null);
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
            deleteModalRef.current?.hideOverlay?.();
            shopify.toast.show(actionData.message);
            setEditingBooking(null);
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

    const handleStatusUpdate = (status) => {
        if (editingBooking) {
            const formData = new FormData();
            formData.append("actionType", "UPDATE_STATUS");
            formData.append("id", editingBooking._id);
            formData.append("status", status);
            submit(formData, { method: "post" });
        }
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        deleteModalRef.current?.showOverlay?.();
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
                                            #{item._id.slice(-6).toUpperCase()}
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
