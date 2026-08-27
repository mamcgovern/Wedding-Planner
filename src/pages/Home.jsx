function Home() {
  return (
    <main className="page">
      <p className="page-eyebrow">
        Wedding Planner
      </p>

      <h1 className="page-title">
        Maddie & Nick
      </h1>

      <p className="page-description">
        Wedding party information, planning tools,
        weekend details, attire, and everything else
        will live here.
      </p>

      <div className="home-grid">
        <div className="content-card">
          <p className="card-eyebrow">
            Wedding Party
          </p>

          <h2>
            Attire
          </h2>

          <p>
            Find your assigned attire and see what
            everyone is wearing.
          </p>
        </div>

        <div className="content-card">
          <p className="card-eyebrow">
            Important Dates
          </p>

          <h2>
            Timeline
          </h2>

          <p>
            Keep track of deadlines, wedding events,
            and things the wedding party needs to know.
          </p>
        </div>

        <div className="content-card">
          <p className="card-eyebrow">
            April 2027
          </p>

          <h2>
            Wedding Weekend
          </h2>

          <p>
            Weekend events, wedding-day schedule,
            venue information, music, and lodging.
          </p>
        </div>

        <div className="content-card">
          <p className="card-eyebrow">
            Private
          </p>

          <h2>
            Planning
          </h2>

          <p>
            Budget, vendors, calendar, seating chart,
            tasks, and other admin tools will be
            available after login.
          </p>
        </div>
      </div>
    </main>
  );
}

export default Home;