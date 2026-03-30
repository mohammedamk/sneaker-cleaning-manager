import { authenticate } from "../shopify.server";
import BookingModel from "../MongoDB/models/Booking";
import HomeIndex from "../component/home/HomeIndex";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import homeStyles from "../component/home/home.css?url";

const RANGE_OPTIONS = {
  "3m": {
    label: "Last 3 months", getStartDate: () => {
      const date = new Date();
      date.setMonth(date.getMonth() - 3);
      return date;
    }
  },
  "2m": {
    label: "Last 2 months", getStartDate: () => {
      const date = new Date();
      date.setMonth(date.getMonth() - 2);
      return date;
    }
  },
  "1m": {
    label: "Last 1 month", getStartDate: () => {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      return date;
    }
  },
  "7d": {
    label: "Last 7 days", getStartDate: () => {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      return date;
    }
  },
};

export const links = () => [
  { rel: "stylesheet", href: homeStyles },
];

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const selectedRange = url.searchParams.get("range") || "7d";
  const rangeConfig = RANGE_OPTIONS[selectedRange] || RANGE_OPTIONS["7d"];
  const startDate = rangeConfig.getStartDate();
  const baseFilter = { submittedAt: { $gte: startDate } };
  console.log("baseFilter", baseFilter);
  const totalBookings = await BookingModel.countDocuments(baseFilter);
  const pendingBookings = await BookingModel.countDocuments({ ...baseFilter, status: 'Pending' });
  const receivedBookings = await BookingModel.countDocuments({ ...baseFilter, status: 'Received' });
  const inCleaning = await BookingModel.countDocuments({ ...baseFilter, status: 'In Cleaning' });

  return {
    selectedRange,
    rangeLabel: rangeConfig.label,
    stats: {
      total: totalBookings,
      pending: pendingBookings,
      received: receivedBookings,
      cleaning: inCleaning
    }
  };
};

export default function IndexRoute() {
  const { stats, selectedRange, rangeLabel } = useLoaderData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleViewBookings = () => {
    navigate("/app/bookings");
  };

  const handleRangeChange = (value) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("range", value);
    navigate(`/app?${nextParams.toString()}`);
  };

  return (
    <HomeIndex
      stats={stats}
      selectedRange={selectedRange}
      rangeLabel={rangeLabel}
      handleRangeChange={handleRangeChange}
      handleViewBookings={handleViewBookings}
    />
  );
}
