export default function HomeIndex({ stats, handleViewBookings }) {
    return (
        <s-page heading="Dashboard Overview" subtitle="Welcome back! Here is what's happening today.">

            <div className="dashboard-stats-grid">
                <s-section>
                    <div className="stat-card-content">
                        <s-text variant="bodySm" tone="subdued">TOTAL BOOKINGS</s-text>
                        <s-text variant="headingLg" type="strong">{stats.total}</s-text>
                    </div>
                </s-section>

                <s-section padding="md">
                    <div className="stat-card-content">
                        <s-text variant="bodySm" tone="warning">PENDING DROP-OFFS</s-text>
                        <s-text variant="headingLg" type="strong">{stats.pending}</s-text>
                    </div>
                </s-section>

                <s-section padding="md">
                    <div className="stat-card-content">
                        <s-text variant="bodySm" tone="auto">RECEIVED ITEMS</s-text>
                        <s-text variant="headingLg" type="strong">{stats.received}</s-text>
                    </div>
                </s-section>

                <s-section padding="md">
                    <div className="stat-card-content">
                        <s-text variant="bodySm" tone="info">CURRENTLY CLEANING</s-text>
                        <s-text variant="headingLg" type="strong">{stats.cleaning}</s-text>
                    </div>
                </s-section>
            </div>

            <div className="dashboard-main-grid">
                <s-section title="Getting Started" sectioned>
                    <s-text>
                        Welcome to specifically built <b>Sneaker Cleaning Manager</b>.
                        From here you can track all incoming requests, manage the cleaning lifecycle, and communicate with your customers.
                    </s-text>
                    <div className="getting-started-actions">
                        <s-button onClick={handleViewBookings} variant="primary">View My Bookings</s-button>
                    </div>
                </s-section>

                <s-section title="System Status" sectioned>
                    <div className="system-status-list">
                        <div className="system-status-item">
                            <s-text variant="bodySm">Cron Jobs</s-text>
                            <s-badge tone="success">Active</s-badge>
                        </div>
                        <div className="system-status-item">
                            <s-text variant="bodySm">Database</s-text>
                            <s-badge tone="success">Connected</s-badge>
                        </div>
                    </div>
                </s-section>
            </div>

        </s-page>
    )
}