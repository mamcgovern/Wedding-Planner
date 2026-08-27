import {
  useWedding,
} from "../../context/WeddingContext";

function Venue() {
  const {
    wedding,
  } = useWedding();

  return (
    <main className="page weekend-detail-page">
      <p className="page-eyebrow">
        Wedding Weekend
      </p>

      <h1 className="page-title">
        Venue
      </h1>

      <p className="page-description">
        Photos, directions, and helpful information
        about the wedding venue.
      </p>

      <div className="content-card venue-summary-card">
        <p className="card-eyebrow">
          Wedding Venue
        </p>

        <h2>
          {
            wedding.venueName ||
            "Venue"
          }
        </h2>

        <p>
          {
            wedding.venueLocation ||
            "Venue location will appear here."
          }
        </p>
      </div>
    </main>
  );
}

export default Venue;