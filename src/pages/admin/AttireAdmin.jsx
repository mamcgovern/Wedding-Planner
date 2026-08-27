import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Shirt,
  Trash2,
  X,
} from "lucide-react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  db,
} from "../../services/firebase";

import {
  WEDDING_ID,
} from "../../config/wedding";

import {
  useAuth,
} from "../../context/AuthContext";

const emptyPerson = {
  name: "",
  displayName: "",
  role: "",
  group: "Bridesmaids",
  outfitPlanId: "",
};

const emptyPlan = {
  name: "",
  group: "Bridesmaids",
  color: "",
  heading: "",
  description: "",

  outfitOptionsEyebrow:
    "Recommended Options",

  outfitOptionsTitle:
    "Outfit Options",

  outfitOptionsDescription:
    "",

  outfitOptions: [],

  moreOutfitsLabel:
    "View More Options",

  moreOutfitsUrl:
    "",

  shoeHeading:
    "Shoes",

  shoeDescription:
    "",

  shoeOptions:
    [],

  moreShoesLabel:
    "View More Shoes",

  moreShoesUrl:
    "",

  accessories:
    "",

  notes:
    "",
};

const emptySelection = {
  personId: "",
  personName: "",
  displayName: "",
  group: "Bridesmaids",
  outfitName: "",
  color: "",
  imageUrl: "",
  purchaseUrl: "",
  visible: true,
};

const groups = [
  "Bridesmaids",
  "Groomsmen",
  "Parents",
  "Bride & Groom",
  "Wedding Party",
  "Other",
];

function AttireAdmin() {
  const {
    user,
  } = useAuth();

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "people"
  );

  const [
    people,
    setPeople,
  ] = useState([]);

  const [
    plans,
    setPlans,
  ] = useState([]);

  const [
    selections,
    setSelections,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let loadedCount =
      0;

    const markLoaded =
      () => {
        loadedCount += 1;

        if (
          loadedCount >=
          3
        ) {
          setLoading(false);
        }
      };

    const unsubscribePeople =
      onSnapshot(
        collection(
          db,
          "weddings",
          WEDDING_ID,
          "attirePeople"
        ),
        (snapshot) => {
          setPeople(
            snapshot.docs.map(
              (item) => ({
                id:
                  item.id,

                ...item.data(),
              })
            )
          );

          markLoaded();
        }
      );

    const unsubscribePlans =
      onSnapshot(
        collection(
          db,
          "weddings",
          WEDDING_ID,
          "outfitPlans"
        ),
        (snapshot) => {
          setPlans(
            snapshot.docs.map(
              (item) => ({
                id:
                  item.id,

                ...item.data(),
              })
            )
          );

          markLoaded();
        }
      );

    const unsubscribeSelections =
      onSnapshot(
        collection(
          db,
          "weddings",
          WEDDING_ID,
          "selectedOutfits"
        ),
        (snapshot) => {
          setSelections(
            snapshot.docs.map(
              (item) => ({
                id:
                  item.id,

                ...item.data(),
              })
            )
          );

          markLoaded();
        }
      );

    return () => {
      unsubscribePeople();
      unsubscribePlans();
      unsubscribeSelections();
    };
  }, []);

  return (
    <main className="page attire-admin-page">
      <p className="page-eyebrow">
        Planning
      </p>

      <h1 className="page-title">
        Attire
      </h1>

      <p className="page-description">
        Manage wedding-party assignments, reusable
        outfit plans, recommended products, and final
        outfit selections.
      </p>

      <div className="attire-admin-tabs">
        <button
          type="button"
          className={
            activeTab ===
            "people"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "people"
            )
          }
        >
          People
        </button>

        <button
          type="button"
          className={
            activeTab ===
            "plans"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "plans"
            )
          }
        >
          Outfit Plans
        </button>

        <button
          type="button"
          className={
            activeTab ===
            "selected"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "selected"
            )
          }
        >
          Selected Outfits
        </button>
      </div>

      {loading ? (
        <div className="content-card">
          Loading attire...
        </div>
      ) : (
        <>
          {activeTab ===
            "people" && (
            <PeopleManager
              people={
                people
              }
              plans={
                plans
              }
              user={
                user
              }
            />
          )}

          {activeTab ===
            "plans" && (
            <PlansManager
              plans={
                plans
              }
              user={
                user
              }
            />
          )}

          {activeTab ===
            "selected" && (
            <SelectedManager
              people={
                people
              }
              selections={
                selections
              }
              user={
                user
              }
            />
          )}
        </>
      )}
    </main>
  );
}


/*
 * PEOPLE
 */

function PeopleManager({
  people,
  plans,
  user,
}) {
  const [
    form,
    setForm,
  ] = useState(
    emptyPerson
  );

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const sortedPeople =
    useMemo(
      () =>
        [...people].sort(
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
        ),
      [people]
    );

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (current) => ({
          ...current,

          [name]:
            value,
        })
      );
    };

  const reset =
    () => {
      setForm(
        emptyPerson
      );

      setEditingId(
        null
      );

      setError("");
    };

  const save =
    async (event) => {
      event.preventDefault();

      if (
        !form.name.trim()
      ) {
        setError(
          "Enter a name."
        );

        return;
      }

      const data = {
        ...form,

        name:
          form.name.trim(),

        displayName:
          form.displayName.trim(),

        role:
          form.role.trim(),

        updatedAt:
          serverTimestamp(),

        updatedBy:
          user?.uid ||
          null,
      };

      try {
        if (editingId) {
          await updateDoc(
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "attirePeople",
              editingId
            ),
            data
          );
        } else {
          await addDoc(
            collection(
              db,
              "weddings",
              WEDDING_ID,
              "attirePeople"
            ),
            {
              ...data,

              createdAt:
                serverTimestamp(),

              createdBy:
                user?.uid ||
                null,
            }
          );
        }

        reset();
      } catch (firebaseError) {
        console.error(
          firebaseError
        );

        setError(
          "We couldn't save that person."
        );
      }
    };

  const edit =
    (person) => {
      setEditingId(
        person.id
      );

      setForm({
        name:
          person.name ||
          "",

        displayName:
          person.displayName ||
          "",

        role:
          person.role ||
          "",

        group:
          person.group ||
          "Other",

        outfitPlanId:
          person.outfitPlanId ||
          "",
      });
    };

  const remove =
    async (person) => {
      if (
        !window.confirm(
          `Delete ${person.name}?`
        )
      ) {
        return;
      }

      await deleteDoc(
        doc(
          db,
          "weddings",
          WEDDING_ID,
          "attirePeople",
          person.id
        )
      );
  };

  return (
    <section className="attire-admin-panel">
      <form
        className="content-card attire-admin-editor"
        onSubmit={
          save
        }
      >
        <EditorHeading
          eyebrow={
            editingId
              ? "Editing Person"
              : "Wedding Party"
          }
          title={
            editingId
              ? "Edit Person"
              : "Add Person"
          }
          editing={
            Boolean(
              editingId
            )
          }
          onCancel={
            reset
          }
        />

        <div className="attire-admin-form-grid">
          <FormInput
            label="Full Name"
            name="name"
            value={
              form.name
            }
            onChange={
              handleChange
            }
            placeholder="Sydni Edgington"
          />

          <FormInput
            label="Display Name"
            name="displayName"
            value={
              form.displayName
            }
            onChange={
              handleChange
            }
            placeholder="Sydni"
          />

          <FormInput
            label="Role"
            name="role"
            value={
              form.role
            }
            onChange={
              handleChange
            }
            placeholder="Maid of Honor"
          />

          <label className="form-field">
            <span>
              Group
            </span>

            <select
              name="group"
              value={
                form.group
              }
              onChange={
                handleChange
              }
            >
              {groups.map(
                (group) => (
                  <option
                    key={
                      group
                    }
                  >
                    {group}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="form-field attire-admin-wide">
            <span>
              Outfit Plan
            </span>

            <select
              name="outfitPlanId"
              value={
                form.outfitPlanId
              }
              onChange={
                handleChange
              }
            >
              <option value="">
                Not assigned yet
              </option>

              {[...plans]
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
                )
                .map(
                  (plan) => (
                    <option
                      key={
                        plan.id
                      }
                      value={
                        plan.id
                      }
                    >
                      {plan.name}
                    </option>
                  )
                )}
            </select>
          </label>
        </div>

        {error && (
          <div className="attire-admin-error">
            {error}
          </div>
        )}

        <SaveRow
          editing={
            Boolean(
              editingId
            )
          }
          onCancel={
            reset
          }
        />
      </form>

      <div className="attire-admin-list">
        {sortedPeople.map(
          (person) => {
            const plan =
              plans.find(
                (item) =>
                  item.id ===
                  person.outfitPlanId
              );

            return (
              <article
                className="attire-admin-list-card"
                key={
                  person.id
                }
              >
                <div>
                  <p className="card-eyebrow">
                    {person.role ||
                      person.group}
                  </p>

                  <h3>
                    {person.name}
                  </h3>

                  <p>
                    {plan
                      ? plan.name
                      : "No outfit plan assigned"}
                  </p>
                </div>

                <CardActions
                  onEdit={() =>
                    edit(
                      person
                    )
                  }
                  onDelete={() =>
                    remove(
                      person
                    )
                  }
                />
              </article>
            );
          }
        )}
      </div>
    </section>
  );
}


/*
 * OUTFIT PLANS
 */

function PlansManager({
  plans,
  user,
}) {
  const [
    form,
    setForm,
  ] = useState(
    emptyPlan
  );

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (current) => ({
          ...current,

          [name]:
            value,
        })
      );
    };

  const reset =
    () => {
      setForm(
        emptyPlan
      );

      setEditingId(
        null
      );

      setError("");
    };

  const addOption =
    (type) => {
      const field =
        type ===
        "outfit"
          ? "outfitOptions"
          : "shoeOptions";

      setForm(
        (current) => ({
          ...current,

          [field]: [
            ...current[
              field
            ],

            {
              id:
                createId(
                  type
                ),

              name:
                "",

              imageUrl:
                "",

              purchaseUrl:
                "",
            },
          ],
        })
      );
    };

  const updateOption =
    (
      type,
      id,
      field,
      value
    ) => {
      const arrayField =
        type ===
        "outfit"
          ? "outfitOptions"
          : "shoeOptions";

      setForm(
        (current) => ({
          ...current,

          [arrayField]:
            current[
              arrayField
            ].map(
              (option) =>
                option.id ===
                id
                  ? {
                      ...option,

                      [field]:
                        value,
                    }
                  : option
            ),
        })
      );
    };

  const deleteOption =
    (
      type,
      id
    ) => {
      const arrayField =
        type ===
        "outfit"
          ? "outfitOptions"
          : "shoeOptions";

      setForm(
        (current) => ({
          ...current,

          [arrayField]:
            current[
              arrayField
            ].filter(
              (option) =>
                option.id !==
                id
            ),
        })
      );
    };

  const moveOption =
    (
      type,
      id,
      direction
    ) => {
      const arrayField =
        type ===
        "outfit"
          ? "outfitOptions"
          : "shoeOptions";

      setForm(
        (current) => {
          const options = [
            ...current[
              arrayField
            ],
          ];

          const index =
            options.findIndex(
              (option) =>
                option.id ===
                id
            );

          const newIndex =
            direction ===
            "up"
              ? index - 1
              : index + 1;

          if (
            index ===
              -1 ||
            newIndex <
              0 ||
            newIndex >=
              options.length
          ) {
            return current;
          }

          const [
            moved,
          ] =
            options.splice(
              index,
              1
            );

          options.splice(
            newIndex,
            0,
            moved
          );

          return {
            ...current,

            [arrayField]:
              options,
          };
        }
      );
    };

  const save =
    async (event) => {
      event.preventDefault();

      if (
        !form.name.trim()
      ) {
        setError(
          "Enter a plan name."
        );

        return;
      }

      const data = {
        ...form,

        name:
          form.name.trim(),

        updatedAt:
          serverTimestamp(),

        updatedBy:
          user?.uid ||
          null,
      };

      try {
        if (editingId) {
          await updateDoc(
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "outfitPlans",
              editingId
            ),
            data
          );
        } else {
          await addDoc(
            collection(
              db,
              "weddings",
              WEDDING_ID,
              "outfitPlans"
            ),
            {
              ...data,

              createdAt:
                serverTimestamp(),

              createdBy:
                user?.uid ||
                null,
            }
          );
        }

        reset();
      } catch (firebaseError) {
        console.error(
          firebaseError
        );

        setError(
          "We couldn't save that outfit plan."
        );
      }
    };

  const edit =
    (plan) => {
      setEditingId(
        plan.id
      );

      setForm({
        ...emptyPlan,
        ...plan,

        outfitOptions:
          Array.isArray(
            plan.outfitOptions
          )
            ? plan.outfitOptions
            : [],

        shoeOptions:
          Array.isArray(
            plan.shoeOptions
          )
            ? plan.shoeOptions
            : [],
      });

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };

  const remove =
    async (plan) => {
      if (
        !window.confirm(
          `Delete "${plan.name}"?`
        )
      ) {
        return;
      }

      await deleteDoc(
        doc(
          db,
          "weddings",
          WEDDING_ID,
          "outfitPlans",
          plan.id
        )
      );
    };

  return (
    <section className="attire-admin-panel">
      <form
        className="content-card attire-admin-editor"
        onSubmit={
          save
        }
      >
        <EditorHeading
          eyebrow={
            editingId
              ? "Editing Plan"
              : "Reusable Plan"
          }
          title={
            editingId
              ? "Edit Outfit Plan"
              : "Create Outfit Plan"
          }
          editing={
            Boolean(
              editingId
            )
          }
          onCancel={
            reset
          }
        />

        <div className="attire-admin-form-grid">
          <FormInput
            label="Plan Name"
            name="name"
            value={
              form.name
            }
            onChange={
              handleChange
            }
            placeholder="Bridesmaid - Blush"
          />

          <label className="form-field">
            <span>
              Group
            </span>

            <select
              name="group"
              value={
                form.group
              }
              onChange={
                handleChange
              }
            >
              {groups.map(
                (group) => (
                  <option
                    key={
                      group
                    }
                  >
                    {group}
                  </option>
                )
              )}
            </select>
          </label>

          <FormInput
            label="Color"
            name="color"
            value={
              form.color
            }
            onChange={
              handleChange
            }
            placeholder="Blush Pink"
          />

          <FormInput
            label="Public Heading"
            name="heading"
            value={
              form.heading
            }
            onChange={
              handleChange
            }
            placeholder="Blush Pink Dresses"
          />

          <FormTextarea
            label="Description / Requirements"
            name="description"
            value={
              form.description
            }
            onChange={
              handleChange
            }
            wide
            placeholder="Please purchase a blush pink dress from Birdy Grey in chiffon..."
          />
        </div>

        <ProductOptionEditor
          title="Outfit Options"
          eyebrow="Recommended Outfits"
          options={
            form.outfitOptions
          }
          onAdd={() =>
            addOption(
              "outfit"
            )
          }
          onUpdate={(
            id,
            field,
            value
          ) =>
            updateOption(
              "outfit",
              id,
              field,
              value
            )
          }
          onDelete={(id) =>
            deleteOption(
              "outfit",
              id
            )
          }
          onMove={(
            id,
            direction
          ) =>
            moveOption(
              "outfit",
              id,
              direction
            )
          }
        />

        <div className="attire-admin-form-grid attire-plan-extra-fields">
          <FormInput
            label="More Outfit Options Button"
            name="moreOutfitsLabel"
            value={
              form.moreOutfitsLabel
            }
            onChange={
              handleChange
            }
          />

          <FormInput
            label="More Outfit Options URL"
            name="moreOutfitsUrl"
            value={
              form.moreOutfitsUrl
            }
            onChange={
              handleChange
            }
            type="url"
          />
        </div>

        <div className="attire-plan-divider" />

        <div className="attire-admin-form-grid">
          <FormInput
            label="Shoe Heading"
            name="shoeHeading"
            value={
              form.shoeHeading
            }
            onChange={
              handleChange
            }
          />

          <FormTextarea
            label="Shoe Requirements"
            name="shoeDescription"
            value={
              form.shoeDescription
            }
            onChange={
              handleChange
            }
            wide
            placeholder="Please choose nude or tan shoes..."
          />
        </div>

        <ProductOptionEditor
          title="Shoe Options"
          eyebrow="Recommended Shoes"
          options={
            form.shoeOptions
          }
          onAdd={() =>
            addOption(
              "shoe"
            )
          }
          onUpdate={(
            id,
            field,
            value
          ) =>
            updateOption(
              "shoe",
              id,
              field,
              value
            )
          }
          onDelete={(id) =>
            deleteOption(
              "shoe",
              id
            )
          }
          onMove={(
            id,
            direction
          ) =>
            moveOption(
              "shoe",
              id,
              direction
            )
          }
        />

        <div className="attire-admin-form-grid attire-plan-extra-fields">
          <FormInput
            label="More Shoes Button"
            name="moreShoesLabel"
            value={
              form.moreShoesLabel
            }
            onChange={
              handleChange
            }
          />

          <FormInput
            label="More Shoes URL"
            name="moreShoesUrl"
            value={
              form.moreShoesUrl
            }
            onChange={
              handleChange
            }
            type="url"
          />

          <FormTextarea
            label="Accessories"
            name="accessories"
            value={
              form.accessories
            }
            onChange={
              handleChange
            }
            wide
          />

          <FormTextarea
            label="Additional Notes"
            name="notes"
            value={
              form.notes
            }
            onChange={
              handleChange
            }
            wide
          />
        </div>

        {error && (
          <div className="attire-admin-error">
            {error}
          </div>
        )}

        <SaveRow
          editing={
            Boolean(
              editingId
            )
          }
          onCancel={
            reset
          }
        />
      </form>

      <div className="attire-admin-list">
        {[...plans]
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
          )
          .map(
            (plan) => (
              <article
                className="attire-admin-list-card"
                key={
                  plan.id
                }
              >
                <div>
                  <p className="card-eyebrow">
                    {plan.group}
                  </p>

                  <h3>
                    {plan.name}
                  </h3>

                  <p>
                    {plan.color ||
                      "No color"}{" "}
                    ·{" "}
                    {plan.outfitOptions
                      ?.length ||
                      0}{" "}
                    outfit options ·{" "}
                    {plan.shoeOptions
                      ?.length ||
                      0}{" "}
                    shoe options
                  </p>
                </div>

                <CardActions
                  onEdit={() =>
                    edit(
                      plan
                    )
                  }
                  onDelete={() =>
                    remove(
                      plan
                    )
                  }
                />
              </article>
            )
          )}
      </div>
    </section>
  );
}


/*
 * SELECTED OUTFITS
 */

function SelectedManager({
  people,
  selections,
  user,
}) {
  const [
    form,
    setForm,
  ] = useState(
    emptySelection
  );

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const handlePerson =
    (event) => {
      const personId =
        event.target.value;

      const person =
        people.find(
          (item) =>
            item.id ===
            personId
        );

      setForm(
        (current) => ({
          ...current,

          personId,

          personName:
            person?.name ||
            "",

          displayName:
            person?.displayName ||
            person?.name ||
            "",

          group:
            person?.group ||
            current.group,
        })
      );
    };

  const handleChange =
    (event) => {
      const {
        name,
        value,
        type,
        checked,
      } = event.target;

      setForm(
        (current) => ({
          ...current,

          [name]:
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );
    };

  const reset =
    () => {
      setForm(
        emptySelection
      );

      setEditingId(
        null
      );
    };

  const save =
    async (event) => {
      event.preventDefault();

      const data = {
        ...form,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          user?.uid ||
          null,
      };

      if (editingId) {
        await updateDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "selectedOutfits",
            editingId
          ),
          data
        );
      } else {
        await addDoc(
          collection(
            db,
            "weddings",
            WEDDING_ID,
            "selectedOutfits"
          ),
          {
            ...data,

            createdAt:
              serverTimestamp(),

            createdBy:
              user?.uid ||
              null,
          }
        );
      }

      reset();
    };

  const edit =
    (selection) => {
      setEditingId(
        selection.id
      );

      setForm({
        ...emptySelection,
        ...selection,
      });
    };

  const remove =
    async (selection) => {
      if (
        !window.confirm(
          `Delete ${
            selection.displayName ||
            selection.personName
          }'s selected outfit?`
        )
      ) {
        return;
      }

      await deleteDoc(
        doc(
          db,
          "weddings",
          WEDDING_ID,
          "selectedOutfits",
          selection.id
        )
      );
    };

  return (
    <section className="attire-admin-panel">
      <form
        className="content-card attire-admin-editor"
        onSubmit={
          save
        }
      >
        <EditorHeading
          eyebrow="Final Selection"
          title={
            editingId
              ? "Edit Selected Outfit"
              : "Add Selected Outfit"
          }
          editing={
            Boolean(
              editingId
            )
          }
          onCancel={
            reset
          }
        />

        <div className="attire-admin-form-grid">
          <label className="form-field">
            <span>
              Person
            </span>

            <select
              value={
                form.personId
              }
              onChange={
                handlePerson
              }
            >
              <option value="">
                Select person
              </option>

              {[...people]
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
                )
                .map(
                  (person) => (
                    <option
                      key={
                        person.id
                      }
                      value={
                        person.id
                      }
                    >
                      {person.name}
                    </option>
                  )
                )}
            </select>
          </label>

          <FormInput
            label="Display Name"
            name="displayName"
            value={
              form.displayName
            }
            onChange={
              handleChange
            }
          />

          <label className="form-field">
            <span>
              Group
            </span>

            <select
              name="group"
              value={
                form.group
              }
              onChange={
                handleChange
              }
            >
              {groups.map(
                (group) => (
                  <option
                    key={
                      group
                    }
                  >
                    {group}
                  </option>
                )
              )}
            </select>
          </label>

          <FormInput
            label="Color"
            name="color"
            value={
              form.color
            }
            onChange={
              handleChange
            }
          />

          <FormInput
            label="Outfit Name"
            name="outfitName"
            value={
              form.outfitName
            }
            onChange={
              handleChange
            }
            wide
          />

          <FormInput
            label="Image URL"
            name="imageUrl"
            value={
              form.imageUrl
            }
            onChange={
              handleChange
            }
            wide
            type="url"
          />

          <FormInput
            label="Purchase URL"
            name="purchaseUrl"
            value={
              form.purchaseUrl
            }
            onChange={
              handleChange
            }
            wide
            type="url"
          />

          <label className="attire-visible-checkbox">
            <input
              type="checkbox"
              name="visible"
              checked={
                form.visible
              }
              onChange={
                handleChange
              }
            />

            Show this outfit on the public Selected
            Outfits page
          </label>
        </div>

        <SaveRow
          editing={
            Boolean(
              editingId
            )
          }
          onCancel={
            reset
          }
        />
      </form>

      <div className="attire-admin-list">
        {selections.map(
          (selection) => (
            <article
              className="attire-admin-list-card attire-selected-admin-card"
              key={
                selection.id
              }
            >
              {selection.imageUrl ? (
                <img
                  src={
                    selection.imageUrl
                  }
                  alt=""
                />
              ) : (
                <div className="attire-admin-image-placeholder">
                  <Shirt
                    size={20}
                  />
                </div>
              )}

              <div>
                <p className="card-eyebrow">
                  {selection.group}
                </p>

                <h3>
                  {selection.displayName ||
                    selection.personName}
                </h3>

                <p>
                  {selection.outfitName ||
                    "Outfit name not added"}
                </p>
              </div>

              <CardActions
                onEdit={() =>
                  edit(
                    selection
                  )
                }
                onDelete={() =>
                  remove(
                    selection
                  )
                }
              />
            </article>
          )
        )}
      </div>
    </section>
  );
}


/*
 * SHARED ADMIN COMPONENTS
 */

function ProductOptionEditor({
  title,
  eyebrow,
  options,
  onAdd,
  onUpdate,
  onDelete,
  onMove,
}) {
  return (
    <section className="attire-product-editor">
      <div className="attire-product-editor-heading">
        <div>
          <p className="card-eyebrow">
            {eyebrow}
          </p>

          <h3>
            {title}
          </h3>

          <p>
            The first four options will be shown on the
            public page.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={
            onAdd
          }
        >
          <Plus
            size={15}
          />

          Add Option
        </button>
      </div>

      {options.length ===
      0 ? (
        <div className="attire-product-editor-empty">
          No options added yet.
        </div>
      ) : (
        <div className="attire-product-editor-list">
          {options.map(
            (
              option,
              index
            ) => (
              <article
                className="attire-product-editor-card"
                key={
                  option.id
                }
              >
                <div className="attire-option-order">
                  <button
                    type="button"
                    className="icon-button"
                    disabled={
                      index ===
                      0
                    }
                    onClick={() =>
                      onMove(
                        option.id,
                        "up"
                      )
                    }
                  >
                    <ChevronUp
                      size={15}
                    />
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    disabled={
                      index ===
                      options.length -
                        1
                    }
                    onClick={() =>
                      onMove(
                        option.id,
                        "down"
                      )
                    }
                  >
                    <ChevronDown
                      size={15}
                    />
                  </button>
                </div>

                <div className="attire-option-fields">
                  <FormInput
                    label="Name"
                    value={
                      option.name
                    }
                    onChange={(event) =>
                      onUpdate(
                        option.id,
                        "name",
                        event.target.value
                      )
                    }
                  />

                  <FormInput
                    label="Image URL"
                    value={
                      option.imageUrl
                    }
                    onChange={(event) =>
                      onUpdate(
                        option.id,
                        "imageUrl",
                        event.target.value
                      )
                    }
                    type="url"
                  />

                  <FormInput
                    label="Purchase URL"
                    value={
                      option.purchaseUrl
                    }
                    onChange={(event) =>
                      onUpdate(
                        option.id,
                        "purchaseUrl",
                        event.target.value
                      )
                    }
                    type="url"
                    wide
                  />
                </div>

                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() =>
                    onDelete(
                      option.id
                    )
                  }
                >
                  <Trash2
                    size={16}
                  />
                </button>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}

function EditorHeading({
  eyebrow,
  title,
  editing,
  onCancel,
}) {
  return (
    <div className="attire-admin-editor-heading">
      <div>
        <p className="card-eyebrow">
          {eyebrow}
        </p>

        <h2>
          {title}
        </h2>
      </div>

      {editing && (
        <button
          type="button"
          className="icon-button"
          onClick={
            onCancel
          }
        >
          <X
            size={17}
          />
        </button>
      )}
    </div>
  );
}

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  type = "text",
  wide = false,
}) {
  return (
    <label
      className={`form-field ${
        wide
          ? "attire-admin-wide"
          : ""
      }`}
    >
      <span>
        {label}
      </span>

      <input
        type={
          type
        }
        name={
          name
        }
        value={
          value || ""
        }
        onChange={
          onChange
        }
        placeholder={
          placeholder
        }
      />
    </label>
  );
}

function FormTextarea({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  wide = false,
}) {
  return (
    <label
      className={`form-field ${
        wide
          ? "attire-admin-wide"
          : ""
      }`}
    >
      <span>
        {label}
      </span>

      <textarea
        name={
          name
        }
        rows={3}
        value={
          value || ""
        }
        onChange={
          onChange
        }
        placeholder={
          placeholder
        }
      />
    </label>
  );
}

function SaveRow({
  editing,
  onCancel,
}) {
  return (
    <div className="attire-admin-save-row">
      {editing && (
        <button
          type="button"
          className="secondary-button"
          onClick={
            onCancel
          }
        >
          Cancel
        </button>
      )}

      <button
        type="submit"
        className="primary-button"
      >
        <Check
          size={15}
        />

        {editing
          ? "Save Changes"
          : "Add"}
      </button>
    </div>
  );
}

function CardActions({
  onEdit,
  onDelete,
}) {
  return (
    <div className="attire-admin-card-actions">
      <button
        type="button"
        className="icon-button"
        onClick={
          onEdit
        }
      >
        <Pencil
          size={16}
        />
      </button>

      <button
        type="button"
        className="icon-button danger"
        onClick={
          onDelete
        }
      >
        <Trash2
          size={16}
        />
      </button>
    </div>
  );
}

function createId(
  prefix
) {
  if (
    typeof crypto !==
      "undefined" &&
    crypto.randomUUID
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export default AttireAdmin;