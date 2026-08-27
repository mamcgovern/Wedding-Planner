import {
  ExternalLink,
  Search,
  Shirt,
} from "lucide-react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  db,
} from "../services/firebase";

import {
  WEDDING_ID,
} from "../config/wedding";

function AttireAssignments() {
  const [
    people,
    setPeople,
  ] = useState([]);

  const [
    plans,
    setPlans,
  ] = useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    peopleLoading,
    setPeopleLoading,
  ] = useState(true);

  const [
    plansLoading,
    setPlansLoading,
  ] = useState(true);

  const [
    peopleError,
    setPeopleError,
  ] = useState("");

  const [
    plansError,
    setPlansError,
  ] = useState("");

  useEffect(() => {
    const peopleRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "attirePeople"
      );

    const plansRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "outfitPlans"
      );

    const unsubscribePeople =
      onSnapshot(
        peopleRef,
        (snapshot) => {
          const loadedPeople =
            snapshot.docs.map(
              (personDoc) => ({
                id:
                  personDoc.id,

                ...personDoc.data(),
              })
            );

          setPeople(
            loadedPeople
          );

          setPeopleError(
            ""
          );

          setPeopleLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading attire people:",
            firebaseError
          );

          setPeopleError(
            "We couldn't load the wedding-party assignments."
          );

          setPeopleLoading(
            false
          );
        }
      );

    const unsubscribePlans =
      onSnapshot(
        plansRef,
        (snapshot) => {
          const loadedPlans =
            snapshot.docs.map(
              (planDoc) => ({
                id:
                  planDoc.id,

                ...planDoc.data(),
              })
            );

          setPlans(
            loadedPlans
          );

          setPlansError(
            ""
          );

          setPlansLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading outfit plans:",
            firebaseError
          );

          setPlansError(
            "We couldn't load the outfit plans."
          );

          setPlansLoading(
            false
          );
        }
      );

    return () => {
      unsubscribePeople();
      unsubscribePlans();
    };
  }, []);

  const loading =
    peopleLoading ||
    plansLoading;

  const normalizedSearch =
    normalizeText(
      searchTerm
    );

  const searchWords =
    normalizedSearch
      .split(/\s+/)
      .filter(Boolean);

  const matchingPeople =
    useMemo(
      () => {
        if (
          searchWords.length ===
          0
        ) {
          return [];
        }

        return people
          .filter(
            (person) => {
              const searchableText =
                normalizeText(
                  [
                    person.name,
                    person.displayName,
                    person.role,
                    person.group,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " "
                    )
                );

              return searchWords.every(
                (word) =>
                  searchableText.includes(
                    word
                  )
              );
            }
          )
          .sort(
            (first, second) =>
              String(
                first.name ||
                ""
              ).localeCompare(
                String(
                  second.name ||
                  ""
                )
              )
          );
      },
      [
        people,
        searchWords,
      ]
    );

  const getPlan =
    (planId) => {
      if (!planId) {
        return null;
      }

      return (
        plans.find(
          (plan) =>
            plan.id ===
            planId
        ) ||
        null
      );
    };

  const handleSearchChange =
    (event) => {
      setSearchTerm(
        event.target.value
      );
    };

  return (
    <main className="page attire-assignments-page">
      <section className="attire-assignment-intro">
        <p className="page-eyebrow">
          Attire Assignments
        </p>

        <h1 className="page-title">
          Find Your Outfit
        </h1>

        <p className="page-description">
          Enter your first or last name to find your
          assigned wedding attire, recommended options,
          shoes, and purchase information.
        </p>
      </section>

      <section className="attire-search-section">
        <label
          className="attire-search-label"
          htmlFor="party-member-search"
        >
          Search by name
        </label>

        <div className="attire-search">
          <Search
            size={18}
          />

          <input
            id="party-member-search"
            type="search"
            value={
              searchTerm
            }
            onChange={
              handleSearchChange
            }
            placeholder="Enter your first or last name"
            autoComplete="off"
          />
        </div>
      </section>

      {loading ? (
        <div className="content-card">
          Loading attire assignments...
        </div>
      ) : peopleError ||
        plansError ? (
        <div className="content-card attire-no-results">
          <div>
            <strong>
              We couldn't load the attire information.
            </strong>

            {peopleError && (
              <p>
                {peopleError}
              </p>
            )}

            {plansError && (
              <p>
                {plansError}
              </p>
            )}
          </div>
        </div>
      ) : (
        <section
          className="attire-search-results"
          aria-live="polite"
        >
          {!normalizedSearch && (
            <div className="attire-search-prompt">
              <Search
                size={18}
              />

              <p>
                Start typing your first or last name
                above.
              </p>
            </div>
          )}

          {normalizedSearch &&
            people.length ===
              0 && (
              <div className="content-card attire-no-results">
                <Shirt
                  size={20}
                />

                <div>
                  <strong>
                    No attire assignments have been added yet.
                  </strong>

                  <p>
                    Add wedding-party members under
                    Planning → Attire → People first.
                  </p>
                </div>
              </div>
            )}

          {normalizedSearch &&
            people.length >
              0 &&
            matchingPeople.length ===
              0 && (
              <div className="content-card attire-no-results">
                <Search
                  size={20}
                />

                <div>
                  <strong>
                    We couldn't find that name.
                  </strong>

                  <p>
                    Check the spelling or contact the
                    couple if you need help finding your
                    assignment.
                  </p>
                </div>
              </div>
            )}

          {matchingPeople.map(
            (person) => {
              const plan =
                getPlan(
                  person.outfitPlanId
                );

              return (
                <article
                  className="attire-person-result"
                  key={
                    person.id
                  }
                >
                  <div className="attire-person-heading">
                    <p className="card-eyebrow">
                      {person.role ||
                        person.group ||
                        "Wedding Party"}
                    </p>

                    <h2>
                      {person.name}
                    </h2>
                  </div>

                  {plan ? (
                    <OutfitPlanDisplay
                      plan={
                        plan
                      }
                    />
                  ) : (
                    <div className="content-card attire-plan-missing">
                      <Shirt
                        size={20}
                      />

                      <div>
                        <strong>
                          Outfit assignment coming soon
                        </strong>

                        <p>
                          {person.name} has been added to
                          the wedding party, but an outfit
                          plan has not been assigned yet.
                        </p>
                      </div>
                    </div>
                  )}
                </article>
              );
            }
          )}
        </section>
      )}
    </main>
  );
}

function OutfitPlanDisplay({
  plan,
}) {
  const outfitOptions =
    Array.isArray(
      plan.outfitOptions
    )
      ? plan.outfitOptions
      : [];

  const shoeOptions =
    Array.isArray(
      plan.shoeOptions
    )
      ? plan.shoeOptions
      : [];

  return (
    <div className="outfit-plan">
      <section className="outfit-plan-summary">
        <div>
          <p className="card-eyebrow">
            Your Assigned Outfit
          </p>

          <h2>
            {plan.heading ||
              plan.name}
          </h2>

          {plan.color && (
            <span className="outfit-color-pill">
              {plan.color}
            </span>
          )}

          {plan.description && (
            <p className="outfit-plan-description">
              {plan.description}
            </p>
          )}
        </div>
      </section>

      {outfitOptions.length >
        0 && (
        <ProductSection
          eyebrow={
            plan.outfitOptionsEyebrow ||
            "Recommended Options"
          }
          title={
            plan.outfitOptionsTitle ||
            "Outfit Options"
          }
          description={
            plan.outfitOptionsDescription
          }
          options={
            outfitOptions
          }
          moreUrl={
            plan.moreOutfitsUrl
          }
          moreLabel={
            plan.moreOutfitsLabel ||
            "View More Options"
          }
          type="outfit"
        />
      )}

      {(plan.shoeDescription ||
        shoeOptions.length >
          0 ||
        plan.moreShoesUrl) && (
        <ProductSection
          eyebrow="Shoes"
          title={
            plan.shoeHeading ||
            "Shoe Options"
          }
          description={
            plan.shoeDescription
          }
          options={
            shoeOptions
          }
          moreUrl={
            plan.moreShoesUrl
          }
          moreLabel={
            plan.moreShoesLabel ||
            "View More Shoes"
          }
          type="shoe"
        />
      )}

      {plan.accessories && (
        <section className="outfit-plan-info">
          <p className="card-eyebrow">
            Accessories
          </p>

          <h2>
            Finishing Touches
          </h2>

          <p>
            {plan.accessories}
          </p>
        </section>
      )}

      {plan.notes && (
        <section className="outfit-plan-note">
          <strong>
            A few notes
          </strong>

          <p>
            {plan.notes}
          </p>
        </section>
      )}
    </div>
  );
}

function ProductSection({
  eyebrow,
  title,
  description,
  options,
  moreUrl,
  moreLabel,
  type,
}) {
  return (
    <section
      className={`outfit-product-section ${
        type ===
        "shoe"
          ? "outfit-product-section-shoes"
          : ""
      }`}
    >
      <div className="outfit-product-heading">
        <p className="card-eyebrow">
          {eyebrow}
        </p>

        <h2>
          {title}
        </h2>

        {description && (
          <p>
            {description}
          </p>
        )}
      </div>

      {options.length >
        0 && (
        <div className="outfit-product-grid">
          {options
            .slice(
              0,
              4
            )
            .map(
              (option) => (
                <article
                  className="outfit-product-card"
                  key={
                    option.id
                  }
                >
                  <div className="outfit-product-image">
                    {option.imageUrl ? (
                      <img
                        src={
                          option.imageUrl
                        }
                        alt={
                          option.name ||
                          "Outfit option"
                        }
                        loading="lazy"
                      />
                    ) : (
                      <div className="outfit-product-placeholder">
                        <Shirt
                          size={28}
                        />
                      </div>
                    )}
                  </div>

                  <div className="outfit-product-content">
                    <h3>
                      {option.name ||
                        "Option"}
                    </h3>

                    {option.purchaseUrl && (
                      <a
                        href={
                          option.purchaseUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Option

                        <ExternalLink
                          size={13}
                        />
                      </a>
                    )}
                  </div>
                </article>
              )
            )}
        </div>
      )}

      {moreUrl && (
        <div className="outfit-more-button-container">
          <a
            href={
              moreUrl
            }
            target="_blank"
            rel="noreferrer"
            className="secondary-button outfit-more-button"
          >
            {moreLabel}

            <ExternalLink
              size={14}
            />
          </a>
        </div>
      )}
    </section>
  );
}

function normalizeText(
  value
) {
  return String(
    value ||
    ""
  )
    .toLowerCase()
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9\s'-]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

export default AttireAssignments;