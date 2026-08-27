function Dashboard() {
  return (
    <main className="page">
      <p className="page-eyebrow">
        Admin
      </p>

      <h1 className="page-title">
        Planning Dashboard
      </h1>

      <p className="page-description">
        Budget, calendar, tasks, vendors, seating,
        pins, and other private planning tools will
        live here.
      </p>

      <div className="home-grid">
        <div className="content-card">
          <p className="card-eyebrow">
            Money
          </p>

          <h2>
            Budget
          </h2>

          <p>
            Track costs, payments, and remaining
            balances.
          </p>
        </div>

        <div className="content-card">
          <p className="card-eyebrow">
            Schedule
          </p>

          <h2>
            Calendar
          </h2>

          <p>
            Manage tasks and events, including items
            shared with the wedding party.
          </p>
        </div>

        <div className="content-card">
          <p className="card-eyebrow">
            Guests
          </p>

          <h2>
            Seating Chart
          </h2>

          <p>
            Organize tables and wedding guests.
          </p>
        </div>

        <div className="content-card">
          <p className="card-eyebrow">
            Planning
          </p>

          <h2>
            Vendors & Tasks
          </h2>

          <p>
            Keep vendors, deadlines, notes, and
            planning work organized.
          </p>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;