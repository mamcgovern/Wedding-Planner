import {
  useWedding,
} from "../context/WeddingContext";

function Home() {
  const {
    wedding,
    loading,
  } = useWedding();

  const coupleName =
    buildCoupleName(
      wedding.brideName,
      wedding.groomName
    );

  const weddingDate =
    formatWeddingDate(
      wedding.weddingDate
    );

  if (loading) {
    return (
      <main className="page">
        <div className="content-card">
          Loading wedding information...
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <p className="page-eyebrow">
        Wedding Planner
      </p>

      <h1 className="page-title">
        {coupleName}
      </h1>

      <p className="page-description">
        {weddingDate}

        {wedding.venueName && (
          <>
            {" "}
            at{" "}
            {
              wedding.venueName
            }
          </>
        )}

        {wedding.venueLocation && (
          <>
            {" "}
            in{" "}
            {
              wedding.venueLocation
            }
          </>
        )}
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
            Wedding Weekend
          </p>

          <h2>
            Weekend
          </h2>

          <p>
            Weekend events, wedding-day schedule,
            venue information, music, and lodging.
          </p>
        </div>

        <div className="content-card">
          <p className="card-eyebrow">
            Venue
          </p>

          <h2>
            {
              wedding.venueName ||
              "Wedding Venue"
            }
          </h2>

          <p>
            {
              wedding.venueLocation ||
              "Venue details will appear here."
            }
          </p>
        </div>
      </div>
    </main>
  );
}

function buildCoupleName(
  brideName,
  groomName
) {
  const brideFirst =
    getFirstName(
      brideName
    );

  const groomFirst =
    getFirstName(
      groomName
    );

  if (
    brideFirst &&
    groomFirst
  ) {
    return `${brideFirst} & ${groomFirst}`;
  }

  if (brideFirst) {
    return brideFirst;
  }

  if (groomFirst) {
    return groomFirst;
  }

  return "Our Wedding";
}

function getFirstName(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .split(/\s+/)[0];
}

function formatWeddingDate(
  value
) {
  if (!value) {
    return "Wedding date coming soon";
  }

  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

export default Home;