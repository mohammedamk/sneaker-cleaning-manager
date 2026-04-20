import { useState, useEffect, useRef, useCallback } from "react";
import { useActionData, useNavigation, useSubmit } from "react-router";
import {
  BOOKING_IMAGE_POLL_INTERVAL_MS,
  PAGE_LIMIT,
  formatMoney,
  getBookingShippingSelection,
  getCleanedImagesApprovalStatus,
  getObjectIdString,
  getSneakerUploadKey,
  hasPendingCleanedImages,
  readFileAsDataUrl,
  updateBookingInList,
} from "./bookings.helpers";
import BookingViewModal from "./components/BookingViewModal";
import BookingsTable from "./components/BookingsTable";
import ConfirmActionModal from "./components/ConfirmActionModal";
import EditBookingStatusModal from "./components/EditBookingStatusModal";
import ImagePreviewModal from "./components/ImagePreviewModal";

export default function BookingsIndex() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();

  const editModalRef = useRef(null);
  const viewModalRef = useRef(null);
  const confirmModalRef = useRef(null);
  const confirmActionRef = useRef(null);

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
  const [approvalNoteDraftBySneaker, setApprovalNoteDraftBySneaker] = useState({});
  const [refundLoading, setRefundLoading] = useState(false);
  const [buyShippingBookingId, setBuyShippingBookingId] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    heading: "",
    message: "",
    tone: "default",
    confirmLabel: "Confirm",
    loading: false,
  });

  const totalPages = Math.ceil(total / PAGE_LIMIT);

  const fetchPage = useCallback(async (targetPage, query = "", { showLoader = true } = {}) => {
    if (showLoader) {
      setTableLoading(true);
    }

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: targetPage, limit: PAGE_LIMIT, search: query }),
      });
      const result = await response.json();

      if (result.success) {
        setItems(result.data);
        setTotal(result.total);
        setPage(result.page);
        return result.data;
      }
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      if (showLoader) {
        setTableLoading(false);
      }
    }

    return undefined;
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

      if (["DELETE_CLEANED_IMAGE", "SEND_CLEANED_EMAIL"].includes(actionData.actionType)) {
        fetchPage(page, search);
        return;
      }

      editModalRef.current?.hideOverlay?.();
      viewModalRef.current?.hideOverlay?.();
      confirmModalRef.current?.hideOverlay?.();
      confirmActionRef.current = null;
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

  useEffect(() => {
    const shouldPollCurrentBooking = hasPendingCleanedImages(viewingBooking);
    const shouldPollList = items.some((booking) => hasPendingCleanedImages(booking));

    if (!shouldPollCurrentBooking && !shouldPollList) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      const latestItems = await fetchPage(page, search, { showLoader: false });

      if (viewingBooking?._id && Array.isArray(latestItems)) {
        const latestBooking = latestItems.find(
          (booking) => getObjectIdString(booking._id) === getObjectIdString(viewingBooking._id),
        );

        if (latestBooking) {
          setViewingBooking(latestBooking);
        }
      }
    }, BOOKING_IMAGE_POLL_INTERVAL_MS);

    return () => window.clearTimeout(timeoutId);
  }, [fetchPage, items, page, search, viewingBooking]);

  const handleSearch = (value) => {
    setSearch(value);
    fetchPage(1, value);
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
    if (!editingBooking) return;

    const formData = new FormData();
    formData.append("actionType", "UPDATE_STATUS");
    formData.append("id", getObjectIdString(editingBooking._id));
    formData.append("status", status);
    submit(formData, { method: "post" });
  };

  const handleUpdateSneakerStatus = (sneakerIndex, status) => {
    if (!Number.isInteger(sneakerIndex) || !viewingBooking) return;

    const formData = new FormData();
    formData.append("actionType", "UPDATE_SNEAKER_STATUS");
    formData.append("bookingId", getObjectIdString(viewingBooking._id));
    formData.append("sneakerIndex", String(sneakerIndex));
    formData.append("status", status);
    submit(formData, { method: "post" });
  };

  const handleSendCleanedEmail = () => {
    if (!viewingBooking) return;

    const formData = new FormData();
    formData.append("actionType", "SEND_CLEANED_EMAIL");
    formData.append("id", getObjectIdString(viewingBooking._id));
    submit(formData, { method: "post" });
  };

  const handleBuyShipping = (bookingId) => {
    const normalizedBookingId = getObjectIdString(bookingId);
    setBuyShippingBookingId(normalizedBookingId);

    fetch("/api/buy/return-shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: normalizedBookingId }),
    })
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "We could not buy return shipping.");
        }

        shopify.toast.show(result.message || "Store-to-customer shipping purchased successfully.");
        await fetchPage(page, search);
      })
      .catch((error) => {
        console.error("Failed to buy return shipping:", error);
        shopify.toast.show(error.message || "We could not buy return shipping.", { isError: true });
      })
      .finally(() => {
        setBuyShippingBookingId("");
      });
  };

  const handleDeleteCleanedImage = (bookingId, sneakerIndex, imageIndex) => {
    const formData = new FormData();
    formData.append("actionType", "DELETE_CLEANED_IMAGE");
    formData.append("id", getObjectIdString(bookingId));
    formData.append("sneakerIndex", String(sneakerIndex));
    formData.append("imageIndex", String(imageIndex));
    submit(formData, { method: "post" });
  };

  const handleSneakerApprovalUpdate = (bookingId, sneakerIndex, approvalStatus) => {
    const draftKey = `${getObjectIdString(bookingId)}-${sneakerIndex}`;
    const trimmedApprovalNote = (approvalNoteDraftBySneaker[draftKey] || "").trim();

    if (approvalStatus === "rejected" && !trimmedApprovalNote) {
      shopify.toast.show("Add a rejection note before marking the cleaned images as rejected.", { isError: true });
      return;
    }

    const formData = new FormData();
    formData.append("actionType", "UPDATE_CLEANING_APPROVAL");
    formData.append("id", getObjectIdString(bookingId));
    formData.append("sneakerIndex", String(sneakerIndex));
    formData.append("approvalStatus", approvalStatus);

    if (approvalStatus === "rejected") {
      formData.append("approvalNote", trimmedApprovalNote);
    }

    submit(formData, { method: "post" });
  };

  const handleSendCleanedEmailPerSneaker = (sneakerIndex) => {
    if (!viewingBooking) return;

    const formData = new FormData();
    formData.append("actionType", "SEND_CLEANED_EMAIL");
    formData.append("id", getObjectIdString(viewingBooking._id));
    formData.append("sneakerIndex", String(sneakerIndex));
    submit(formData, { method: "post" });
  };

  const closeConfirmModal = useCallback(() => {
    confirmModalRef.current?.hideOverlay?.();
    confirmActionRef.current = null;
    setItemToDelete(null);
    setConfirmModal({
      heading: "",
      message: "",
      tone: "auto",
      confirmLabel: "Confirm",
      loading: false,
    });
  }, []);

  const openConfirmModal = useCallback((config, onConfirm) => {
    setItemToDelete(null);
    confirmActionRef.current = onConfirm;
    setConfirmModal({
      heading: config.heading || "Please Confirm",
      message: config.message || "",
      tone: config.tone || "auto",
      confirmLabel: config.confirmLabel || "Confirm",
      loading: Boolean(config.loading),
    });
    confirmModalRef.current?.showOverlay?.();
  }, []);

  const handleConfirmModalAction = async () => {
    if (typeof confirmActionRef.current !== "function") return;
    await confirmActionRef.current();
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    const formData = new FormData();
    formData.append("actionType", "DELETE");
    formData.append("id", itemToDelete);
    submit(formData, { method: "post" });
  };

  const handleRefundBooking = async () => {
    if (!viewingBooking || viewingBooking.status !== "Canceled" || viewingBooking.refund?.status === "completed") {
      return;
    }

    setRefundLoading(true);

    try {
      const bookingId = getObjectIdString(viewingBooking._id);
      const previewResponse = await fetch("/api/refund/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, mode: "preview" }),
      });
      const previewResult = await previewResponse.json();

      if (!previewResponse.ok || !previewResult.success) {
        throw new Error(previewResult.message || "We could not calculate the refund amount.");
      }

      const refundAmountText = formatMoney(
        previewResult.refund?.amount,
        previewResult.refund?.currencyCode,
      );

      openConfirmModal({
        heading: "Confirm Refund",
        message: `Refund ${refundAmountText} to the customer? Shipping charges are excluded from this refund.`,
        tone: "critical",
        confirmLabel: "Process Refund",
      }, async () => {
        setRefundLoading(true);

        try {
          const processResponse = await fetch("/api/refund/booking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, mode: "process" }),
          });
          const processResult = await processResponse.json();

          if (!processResponse.ok || !processResult.success) {
            throw new Error(processResult.message || "We could not process the refund.");
          }

          closeConfirmModal();
          shopify.toast.show(processResult.message || "Refund processed successfully.");

          if (processResult.booking) {
            setViewingBooking(processResult.booking);
            setItems((currentItems) => updateBookingInList(currentItems, processResult.booking));
          } else {
            fetchPage(page, search);
          }
        } catch (error) {
          console.error("Failed to process refund:", error);
          shopify.toast.show(error.message || "We could not process the refund.", { isError: true });
        } finally {
          setRefundLoading(false);
        }
      });
    } catch (error) {
      console.error("Failed to process refund:", error);
      shopify.toast.show(error.message || "We could not process the refund.", { isError: true });
    } finally {
      setRefundLoading(false);
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
  const approvalStatus = getCleanedImagesApprovalStatus(viewingBooking);
  const bookingShippingSelection = getBookingShippingSelection(viewingBooking);

  return (
    <s-page heading="Sneaker Cleaning Bookings" subtitle="Manage and track customer cleaning orders">
      <div className="bookings-header">
        <div className="search-container">
          <s-text-field
            placeholder="Search by ID, Name or Email..."
            value={search}
            onInput={(event) => handleSearch(event.target.value)}
            prefix="🔍"
          />
        </div>
        <s-text variant="bodySm" tone="subdued">
          Showing {items.length} of {total} results
        </s-text>
      </div>

      <s-section padding="none">
        <BookingsTable
          items={items}
          page={page}
          totalPages={totalPages}
          tableLoading={tableLoading}
          buyShippingBookingId={buyShippingBookingId}
          onView={handleView}
          onEdit={handleEdit}
          onBuyShipping={handleBuyShipping}
          onChangePage={changePage}
        />
      </s-section>

      <div className="pagination-footer">
        <div className="pagination-controls">
          <s-text variant="bodySm">Page <b>{page}</b> of {totalPages}</s-text>
        </div>
      </div>

      <EditBookingStatusModal
        modalRef={editModalRef}
        editingBooking={editingBooking}
        isSubmitting={isSubmitting}
        activeActionType={activeActionType}
        onStatusUpdate={handleStatusUpdate}
      />

      <BookingViewModal
        modalRef={viewModalRef}
        viewingBooking={viewingBooking}
        cleanedImageDrafts={cleanedImageDrafts}
        approvalStatus={approvalStatus}
        approvalNoteDraftBySneaker={approvalNoteDraftBySneaker}
        bookingShippingSelection={bookingShippingSelection}
        isSubmitting={isSubmitting}
        activeActionType={activeActionType}
        refundLoading={refundLoading}
        onPreviewImage={handlePreviewImage}
        onDownloadImage={handleDownloadImage}
        onSneakerApprovalNoteDraftChange={(draftKey, value) => {
          setApprovalNoteDraftBySneaker((currentDrafts) => ({
            ...currentDrafts,
            [draftKey]: value,
          }));
        }}
        onRefundBooking={handleRefundBooking}
        onSendCleanedEmail={handleSendCleanedEmail}
        onUpdateSneakerStatus={handleUpdateSneakerStatus}
        onDeleteCleanedImage={handleDeleteCleanedImage}
        onApproveSneaker={(sneakerIndex) => {
          const draftKey = `${getObjectIdString(viewingBooking?._id)}-${sneakerIndex}`;
          setApprovalNoteDraftBySneaker((currentDrafts) => ({
            ...currentDrafts,
            [draftKey]: "",
          }));
          handleSneakerApprovalUpdate(viewingBooking?._id, sneakerIndex, "approved");
        }}
        onRejectSneaker={(sneakerIndex) => handleSneakerApprovalUpdate(viewingBooking?._id, sneakerIndex, "rejected")}
        onSendCleanedEmailPerSneaker={handleSendCleanedEmailPerSneaker}
        onCleanedImagesChange={handleCleanedImagesChange}
        onUploadCleanedImages={handleUploadCleanedImages}
      />

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />

      <ConfirmActionModal
        modalRef={confirmModalRef}
        confirmModal={confirmModal}
        itemToDelete={itemToDelete}
        isSubmitting={isSubmitting}
        activeActionType={activeActionType}
        refundLoading={refundLoading}
        onCancel={closeConfirmModal}
        onConfirmDelete={confirmDelete}
        onConfirmAction={handleConfirmModalAction}
      />
    </s-page>
  );
}
