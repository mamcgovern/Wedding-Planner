import {
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
      "Search your name to find your assigned color, outfit requirements, dress or suit options, shoes, and purchase information.",

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
      "See the outfits members of the wedding party have selected as everyone finalizes what they will wear.",

    path:
      "/attire/selected",

    icon:
      CheckCircle2,
  },
];

function Attire() {
  return (
    <main className="page attire-overview-page">
      <div className="attire-overview-heading">
        <p className="page-eyebrow">
          Wedding Party
        </p>

        <h1 className="page-title">
          Attire
        </h1>

        <p className="page-description">
          Find everything you need to know about
          wedding-day outfits, assigned colors, purchase
          options, and what everyone has chosen to wear.
        </p>
      </div>

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

                <div>
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
                    View Page →
                  </span>
                </div>
              </Link>
            );
          }
        )}
      </div>
    </main>
  );
}

export default Attire;