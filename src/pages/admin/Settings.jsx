import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  LoaderCircle,
  Save,
} from "lucide-react";

import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  db,
} from "../../services/firebase";

import {
  WEDDING_ID,
} from "../../config/wedding";

import {
  useAuth,
} from "../../context/AuthContext";

const emptySettings = {
  brideName: "",
  groomName: "",

  weddingDate: "",

  weekendStartDate: "",
  weekendEndDate: "",

  ceremonyTime: "",
  receptionTime: "",
  receptionEndTime: "",

  venueName: "",
  venueLocation: "",
};

function Settings() {
  const {
    user,
  } = useAuth();

  const [
    settings,
    setSettings,
  ] = useState(
    emptySettings
  );

  const [
    savedSettings,
    setSavedSettings,
  ] = useState(
    emptySettings
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * LOAD PRIVATE ADMIN SETTINGS
   *
   * The Settings page is protected, so it can read
   * from the private root wedding document.
   *
   * Public pages do NOT read this document anymore.
   */

  useEffect(() => {
    const weddingRef =
      doc(
        db,
        "weddings",
        WEDDING_ID
      );

    const unsubscribe =
      onSnapshot(
        weddingRef,
        (snapshot) => {
          if (
            snapshot.exists()
          ) {
            const data =
              snapshot.data();

            const loaded = {
              brideName:
                data.brideName ||
                "",

              groomName:
                data.groomName ||
                "",

              weddingDate:
                data.weddingDate ||
                "",

              weekendStartDate:
                data.weekendStartDate ||
                "",

              weekendEndDate:
                data.weekendEndDate ||
                "",

              ceremonyTime:
                data.ceremonyTime ||
                "",

              receptionTime:
                data.receptionTime ||
                "",

              receptionEndTime:
                data.receptionEndTime ||
                "",

              venueName:
                data.venueName ||
                "",

              venueLocation:
                data.venueLocation ||
                "",
            };

            setSettings(
              loaded
            );

            setSavedSettings(
              loaded
            );
          } else {
            setSettings(
              emptySettings
            );

            setSavedSettings(
              emptySettings
            );
          }

          setError(
            ""
          );

          setLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading settings:",
            firebaseError
          );

          setError(
            "We couldn't load the wedding settings."
          );

          setLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  const hasChanges =
    JSON.stringify(
      settings
    ) !==
    JSON.stringify(
      savedSettings
    );

  /*
   * FORM CHANGES
   */

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } =
        event.target;

      setSettings(
        (current) => ({
          ...current,

          [name]:
            value,
        })
      );

      setSaved(
        false
      );

      setError(
        ""
      );
    };

  /*
   * SAVE
   *
   * We save two copies:
   *
   * 1. Private/admin root document
   *    weddings/main-wedding
   *
   * 2. Public-safe website document
   *    weddings/main-wedding/public/site
   *
   * Public pages only read #2.
   */

  const handleSave =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        settings.weekendStartDate &&
        settings.weekendEndDate &&
        settings.weekendEndDate <
          settings.weekendStartDate
      ) {
        setError(
          "Weekend end date cannot be before the start date."
        );

        return;
      }

      setSaving(
        true
      );

      setSaved(
        false
      );

      setError(
        ""
      );

      try {
        const cleaned = {
          brideName:
            settings.brideName.trim(),

          groomName:
            settings.groomName.trim(),

          weddingDate:
            settings.weddingDate,

          weekendStartDate:
            settings.weekendStartDate,

          weekendEndDate:
            settings.weekendEndDate,

          ceremonyTime:
            settings.ceremonyTime,

          receptionTime:
            settings.receptionTime,

          receptionEndTime:
            settings.receptionEndTime,

          venueName:
            settings.venueName.trim(),

          venueLocation:
            settings.venueLocation.trim(),
        };

        const privateWeddingRef =
          doc(
            db,
            "weddings",
            WEDDING_ID
          );

        const publicWeddingRef =
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "public",
            "site"
          );

        /*
         * Save both documents together.
         *
         * If either write fails, the page reports an
         * error rather than pretending everything
         * synced correctly.
         */

        await Promise.all([
          setDoc(
            privateWeddingRef,
            {
              ...cleaned,

              updatedAt:
                serverTimestamp(),

              updatedBy:
                user?.uid ||
                null,
            },
            {
              merge:
                true,
            }
          ),

          setDoc(
            publicWeddingRef,
            {
              ...cleaned,

              updatedAt:
                serverTimestamp(),
            },
            {
              merge:
                true,
            }
          ),
        ]);

        setSettings(
          cleaned
        );

        setSavedSettings(
          cleaned
        );

        setSaved(
          true
        );
      } catch (firebaseError) {
        console.error(
          "Error saving settings:",
          firebaseError
        );

        setError(
          "We couldn't save the wedding settings."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  if (
    loading
  ) {
    return (
      <main className="page">
        <div className="content-card settings-loading">
          <LoaderCircle
            size={22}
            className="spinner"
          />

          Loading settings...
        </div>
      </main>
    );
  }

  return (
    <main className="page settings-page">
      <p className="page-eyebrow">
        Planning
      </p>

      <h1 className="page-title">
        Settings
      </h1>

      <p className="page-description">
        These wedding details are used throughout the
        public website and private planning pages.
      </p>

      <form
        className="settings-form"
        onSubmit={
          handleSave
        }
      >
        <section className="content-card settings-section">
          <p className="card-eyebrow">
            Couple
          </p>

          <h2>
            Names
          </h2>

          <div className="settings-grid two-column">
            <label className="form-field">
              <span>
                Bride
              </span>

              <input
                type="text"
                name="brideName"
                value={
                  settings.brideName
                }
                onChange={
                  handleChange
                }
                placeholder="Bride's name"
              />
            </label>

            <label className="form-field">
              <span>
                Groom
              </span>

              <input
                type="text"
                name="groomName"
                value={
                  settings.groomName
                }
                onChange={
                  handleChange
                }
                placeholder="Groom's name"
              />
            </label>
          </div>
        </section>

        <section className="content-card settings-section">
          <p className="card-eyebrow">
            Dates
          </p>

          <h2>
            Wedding Weekend
          </h2>

          <div className="settings-grid three-column">
            <label className="form-field">
              <span>
                Weekend Starts
              </span>

              <input
                type="date"
                name="weekendStartDate"
                value={
                  settings.weekendStartDate
                }
                onChange={
                  handleChange
                }
              />
            </label>

            <label className="form-field">
              <span>
                Wedding Date
              </span>

              <input
                type="date"
                name="weddingDate"
                value={
                  settings.weddingDate
                }
                onChange={
                  handleChange
                }
              />
            </label>

            <label className="form-field">
              <span>
                Weekend Ends
              </span>

              <input
                type="date"
                name="weekendEndDate"
                value={
                  settings.weekendEndDate
                }
                onChange={
                  handleChange
                }
              />
            </label>
          </div>
        </section>

        <section className="content-card settings-section">
          <p className="card-eyebrow">
            Schedule
          </p>

          <h2>
            Main Event Times
          </h2>

          <div className="settings-grid three-column">
            <label className="form-field">
              <span>
                Ceremony
              </span>

              <input
                type="time"
                name="ceremonyTime"
                value={
                  settings.ceremonyTime
                }
                onChange={
                  handleChange
                }
              />
            </label>

            <label className="form-field">
              <span>
                Reception Starts
              </span>

              <input
                type="time"
                name="receptionTime"
                value={
                  settings.receptionTime
                }
                onChange={
                  handleChange
                }
              />
            </label>

            <label className="form-field">
              <span>
                Reception Ends
              </span>

              <input
                type="time"
                name="receptionEndTime"
                value={
                  settings.receptionEndTime
                }
                onChange={
                  handleChange
                }
              />
            </label>
          </div>
        </section>

        <section className="content-card settings-section">
          <p className="card-eyebrow">
            Venue
          </p>

          <h2>
            Location
          </h2>

          <div className="settings-grid two-column">
            <label className="form-field">
              <span>
                Venue Name
              </span>

              <input
                type="text"
                name="venueName"
                value={
                  settings.venueName
                }
                onChange={
                  handleChange
                }
                placeholder="Venue name"
              />
            </label>

            <label className="form-field">
              <span>
                Location
              </span>

              <input
                type="text"
                name="venueLocation"
                value={
                  settings.venueLocation
                }
                onChange={
                  handleChange
                }
                placeholder="City, state or address"
              />
            </label>
          </div>
        </section>

        {error && (
          <div className="settings-error">
            {error}
          </div>
        )}

        <div className="settings-save-bar">
          <div className="settings-save-status">
            {saved ? (
              <>
                <Check
                  size={16}
                />

                Saved
              </>
            ) : hasChanges ? (
              "You have unsaved changes."
            ) : (
              "Everything is saved."
            )}
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={
              saving ||
              !hasChanges
            }
          >
            {saving ? (
              <>
                <LoaderCircle
                  size={17}
                  className="spinner"
                />

                Saving...
              </>
            ) : (
              <>
                <Save
                  size={17}
                />

                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}

export default Settings;