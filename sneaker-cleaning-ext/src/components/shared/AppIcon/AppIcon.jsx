import './AppIcon.css';

const iconPaths = {
  shoeRack: (
    <>
      <path
        d="M3 13.5V11l4.2-2.8a2 2 0 0 1 2.16-.1l2.78 1.5c.3.16.64.24.98.24H16c.9 0 1.74.4 2.31 1.08l1.22 1.46c.3.35.47.8.47 1.26v.94a1.5 1.5 0 0 1-1.5 1.5H5A2 2 0 0 1 3 13.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 15.5a1.25 1.25 0 1 0 0 .01M16.5 15.5a1.25 1.25 0 1 0 0 .01"
        fill="currentColor"
      />
      <path
        d="M10.5 8.4 12 5.5h2.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  bookings: (
    <>
      <rect
        x="3"
        y="4.5"
        width="18"
        height="16"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7.5 2.75v3.5M16.5 2.75v3.5M3 8.5h18M7.5 12.25h3M7.5 16h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>
  ),
  arrowLeft: (
    <path
      d="M14.5 6 8.5 12l6 6M9 12h11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

function AppIcon({ name, className = 'btn__icon' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {iconPaths[name] || null}
    </svg>
  );
}

export default AppIcon;
