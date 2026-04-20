import { authenticate } from "../shopify.server";
import bookingsStyles from "../component/bookings/bookings.css?url";
import bookingViewModalStyles from "../component/bookings/booking-view-modal.css?url";
import BookingsIndex from "../component/bookings/BookingsIndex";
import { executeAdminBookingAction } from "../services/bookings/adminBookingActions.server";

export const links = () => [
  { rel: "stylesheet", href: bookingsStyles },
  { rel: "stylesheet", href: bookingViewModalStyles },
];

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  return executeAdminBookingAction(admin, formData);
};

export default function BookingsRoute() {
  return <BookingsIndex/>;
}
