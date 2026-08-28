import {
  ArrowRight,
  CheckCircle2,
  Search,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

const attirePages = [
  {
    title:
      "Outfit Assignments",

    eyebrow:
      "Find Your Outfit",

    description:
      "Search your name to see your assigned color, outfit requirements, dress or suit options, shoes, and purchase information.",

    path:
      "/attire/assignments",

    icon:
      Search,
  },
  {
    title:
      "Selected Outfits",

    eyebrow:
      "What We're Wearing",

    description:
      "See the dresses, suits, and other outfit pieces the wedding party has selected as everyone gets ready for the big day.",

    path:
      "/attire/selected",

    icon:
      CheckCircle2,
  },
];

function Attire() {
  return (
    <main className="page attire-overview-page">
      <header className="attire-overview-heading">
        <p className="page-eyebrow">
          Wedding Party
        </p>

        <h1 className="page-title">
          Attire
        </h1>

        <p className="page-description">
          Everything you need for wedding-day attire,
          including assigned colors, outfit requirements,
          purchase information, and what everyone has
          chosen to wear.
        </p>
      </header>

      <div className="attire-overview-grid">
        {attirePages.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <Link
                key={
                  item.path
                }
                to={
                  item.path
                }
                className="attire-overview-card"
              >
                <div className="attire-overview-icon">
                  <Icon
                    size={24}
                  />
                </div>

                <div className="attire-overview-card__content">
                  <p className="card-eyebrow">
                    {
                      item.eyebrow
                    }
                  </p>

                  <h2>
                    {
                      item.title
                    }
                  </h2>

                  <p>
                    {
                      item.description
                    }
                  </p>

                  <span className="attire-overview-link">
                    View Page

                    <ArrowRight
                      size={16}
                    />
                  </span>
                </div>
              </Link>
            );
          }
        )}
      </div>

      <section className="attire-overview-note">
        <p className="card-eyebrow">
          A Quick Note
        </p>

        <h2>
          Questions About Your Outfit?
        </h2>

        <p>
          If anything about your assigned attire is
          unclear, reach out before ordering so we can
          make sure everything works together.
        </p>
      </section>
    </main>
  );
}

export default Attire;