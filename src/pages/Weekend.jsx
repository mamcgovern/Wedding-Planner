function Weekend() {
  return (
    <main className="page">
      <p className="page-eyebrow">
        Wedding Weekend
      </p>

      <h1 className="page-title">
        Weekend
      </h1>

      <p className="page-description">
        Weekend events, the wedding-day schedule,
        music, venue information, and sleeping
        arrangements will live here.
      </p>

      <div className="home-grid">
        <div className="content-card">
          <p className="card-eyebrow">
            Schedule
          </p>

          <h2>
            Weekend Events
          </h2>

          <p>
            Rehearsal, dinner, wedding-day events,
            and other weekend plans.
          </p>
        </div>

        <div className="content-card">
          <p className="card-eyebrow">
            Wedding Day
          </p>

          <h2>
            Wedding Day Schedule
          </h2>

          <p>
            A detailed schedule for the wedding
            party.
          </p>
        </div>

        <div className="content-card">
          <p className="card-eyebrow">
            Playlist
          </p>

          <h2>
            Music
          </h2>

          <p>
            Ceremony and reception music.
          </p>
        </div>

        <div className="content-card">
          <p className="card-eyebrow">
            Location
          </p>

          <h2>
            Venue
          </h2>

          <p>
            Venue photos, information, and helpful
            details.
          </p>
        </div>

        <div className="content-card">
          <p className="card-eyebrow">
            Lodging
          </p>

          <h2>
            Sleeping Arrangements
          </h2>

          <p>
            Airbnb rooms and sleeping assignments.
          </p>
        </div>
      </div>
    </main>
  );
}

export default Weekend;