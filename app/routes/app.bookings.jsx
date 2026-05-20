import { authenticate } from "../shopify.server";
import bookingsStyles from "../component/bookings/bookings.css?url";
import bookingViewModalStyles from "../component/bookings/booking-view-modal.css?url";
import BookingsIndex from "../component/bookings/BookingsIndex";
import { executeAdminBookingAction } from "../services/bookings/adminBookingActions.server";
import { getBookingStatuses } from "../utils/adminSettings.server.js";
import { useLoaderData } from "react-router";

export const links = () => [
  { rel: "stylesheet", href: bookingsStyles },
  { rel: "stylesheet", href: bookingViewModalStyles },
];

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const statuses = await getBookingStatuses();
  return { statuses };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  return executeAdminBookingAction(admin, formData);
};

export default function BookingsRoute() {
  const { statuses } = useLoaderData();
  return <BookingsIndex adminStatuses={statuses} />;
}
