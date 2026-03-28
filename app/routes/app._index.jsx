import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import HomeIndex from "../component/home/HomeIndex";
import { useLoaderData, useNavigate } from "react-router";
import homeStyles from "../component/home/home.css?url";

export const links = () => [
  { rel: "stylesheet", href: homeStyles },
];

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const totalBookings = await BookingModel.countDocuments();
  const pendingBookings = await BookingModel.countDocuments({ status: 'Pending' });
  const receivedBookings = await BookingModel.countDocuments({ status: 'Received' });
  const inCleaning = await BookingModel.countDocuments({ status: 'In Cleaning' });

  return {
    stats: {
      total: totalBookings,
      pending: pendingBookings,
      received: receivedBookings,
      cleaning: inCleaning
    }
  };
};

export default function IndexRoute() {
  const { stats } = useLoaderData();
  const navigate = useNavigate()

  const handleViewBookings = () => {
    navigate("/app/bookings")
  }

  return (
    <HomeIndex stats={stats} handleViewBookings={handleViewBookings} />
  );
}
