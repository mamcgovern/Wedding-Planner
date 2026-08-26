import {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  Heart,
  LoaderCircle,
  MapPin,
  Save,
  Settings2,
  UserRound,
  X,
} from "lucide-react";

import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../services/firebase";
import { WEDDING_ID } from "../config/wedding";
import { useAuth } from "../context/AuthContext";

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

  weddingWebsite: "",
};

function Settings() {
  const { user } = useAuth();

  const [
    settings,
    setSettings,
  ] = useState(emptySettings);

  const [
    savedSettings,
    setSavedSettings,
  ] = useState(emptySettings);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    savedMessage,
    setSavedMessage,
  ] = useState(false);

  const [error, setError] =
    useState("");

  /*
   * LOAD WEDDING SETTINGS
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

              weddingWebsite:
                data.weddingWebsite ||
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

          setLoading(false);
        },
        (firebaseError) => {
          console.error(
            "Error loading wedding settings:",
            firebaseError
          );

          setError(
            "We couldn't load your wedding settings."
          );

          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  /*
   * FORM CHANGE
   */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setSettings(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    setSavedMessage(
      false
    );
  };

  /*
   * DIRTY STATE
   */

  const hasChanges =
    JSON.stringify(
      settings
    ) !==
    JSON.stringify(
      savedSettings
    );

  /*
   * SAVE
   */

  const handleSave =
    async (event) => {
      event.preventDefault();

      if (
        settings.weekendStartDate &&
        settings.weekendEndDate &&
        settings.weekendEndDate <
          settings.weekendStartDate
      ) {
        setError(
          "The wedding weekend end date can't be before the start date."
        );

        return;
      }

      if (
        settings.weddingDate &&
        settings.weekendStartDate &&
        settings.weddingDate <
          settings.weekendStartDate
      ) {
        setError(
          "The wedding date can't be before the wedding weekend starts."
        );

        return;
      }

      if (
        settings.weddingDate &&
        settings.weekendEndDate &&
        settings.weddingDate >
          settings.weekendEndDate
      ) {
        setError(
          "The wedding date can't be after the wedding weekend ends."
        );

        return;
      }

      setSaving(true);
      setError("");
      setSavedMessage(false);

      try {
        const settingsData = {
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

          weddingWebsite:
            normalizeWebsite(
              settings.weddingWebsite
            ),

          updatedAt:
            serverTimestamp(),

          updatedBy:
            user?.uid ||
            null,
        };

        await setDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID
          ),
          settingsData,
          {
            merge: true,
          }
        );

        const updated = {
          brideName:
            settingsData.brideName,

          groomName:
            settingsData.groomName,

          weddingDate:
            settingsData.weddingDate,

          weekendStartDate:
            settingsData.weekendStartDate,

          weekendEndDate:
            settingsData.weekendEndDate,

          ceremonyTime:
            settingsData.ceremonyTime,

          receptionTime:
            settingsData.receptionTime,

          receptionEndTime:
            settingsData.receptionEndTime,

          venueName:
            settingsData.venueName,

          venueLocation:
            settingsData.venueLocation,

          weddingWebsite:
            settingsData.weddingWebsite,
        };

        setSettings(
          updated
        );

        setSavedSettings(
          updated
        );

        setSavedMessage(
          true
        );
      } catch (firebaseError) {
        console.error(
          "Error saving wedding settings:",
          firebaseError
        );

        setError(
          "We couldn't save your wedding settings."
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * RESET UNSAVED
   */

  const handleReset =
    () => {
      setSettings(
        savedSettings
      );

      setError("");
      setSavedMessage(false);
    };

  if (loading) {
    return (
      <div className="page settings-page">
        <div className="content-card settings-loading">
          <LoaderCircle
            size={25}
            className="spinner"
          />

          <p>
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page settings-page">
      <div className="settings-page-header">
        <div>
          <p className="page-eyebrow">
            App Settings
          </p>

          <h1>
            Wedding Settings
          </h1>

          <p className="page-description">
            Manage the core wedding details that can be reused
            throughout the planner.
          </p>
        </div>
      </div>

      {error && (
        <div className="auth-error settings-page-error">
          {error}

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={15} />
          </button>
        </div>
      )}

      {savedMessage && (
        <div className="settings-saved-message">
          <Check
            size={16}
          />

          <span>
            Wedding settings saved.
          </span>
        </div>
      )}

      <form
        className="settings-form"
        onSubmit={
          handleSave
        }
      >
        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-card-icon">
              <Heart
                size={18}
              />
            </div>

            <div>
              <p className="card-eyebrow">
                Couple
              </p>

              <h2>
                Couple Details
              </h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span>
                Bride
              </span>

              <div className="settings-input-icon">
                <UserRound
                  size={15}
                />

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
              </div>
            </label>

            <label className="form-field">
              <span>
                Groom
              </span>

              <div className="settings-input-icon">
                <UserRound
                  size={15}
                />

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
              </div>
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-card-icon">
              <CalendarDays
                size={18}
              />
            </div>

            <div>
              <p className="card-eyebrow">
                Dates
              </p>

              <h2>
                Wedding Weekend
              </h2>
            </div>
          </div>

          <div className="settings-date-grid">
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

            <label className="form-field settings-wedding-date-field">
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

          <p className="settings-section-help">
            These dates can be used by the Timeline and other wedding
            weekend views so you don't have to enter them repeatedly.
          </p>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-card-icon">
              <Clock3
                size={18}
              />
            </div>

            <div>
              <p className="card-eyebrow">
                Schedule
              </p>

              <h2>
                Main Event Times
              </h2>
            </div>
          </div>

          <div className="settings-time-grid">
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

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-card-icon">
              <MapPin
                size={18}
              />
            </div>

            <div>
              <p className="card-eyebrow">
                Location
              </p>

              <h2>
                Venue
              </h2>
            </div>
          </div>

          <div className="form-grid">
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
                placeholder="Wedding venue"
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
                placeholder="City, state or full address"
              />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-card-icon">
              <ExternalLink
                size={18}
              />
            </div>

            <div>
              <p className="card-eyebrow">
                Website
              </p>

              <h2>
                Wedding Website
              </h2>
            </div>
          </div>

          <label className="form-field">
            <span>
              Website URL
            </span>

            <div className="settings-input-icon">
              <ExternalLink
                size={15}
              />

              <input
                type="text"
                name="weddingWebsite"
                value={
                  settings.weddingWebsite
                }
                onChange={
                  handleChange
                }
                placeholder="https://..."
              />
            </div>
          </label>

          {settings.weddingWebsite && (
            <a
              className="settings-preview-link"
              href={
                normalizeWebsite(
                  settings.weddingWebsite
                )
              }
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink
                size={13}
              />

              Open Wedding Website
            </a>
          )}
        </section>

        <section className="settings-card settings-info-card">
          <div className="settings-card-heading">
            <div className="settings-card-icon">
              <Settings2
                size={18}
              />
            </div>

            <div>
              <p className="card-eyebrow">
                Planner
              </p>

              <h2>
                Shared Wedding Data
              </h2>
            </div>
          </div>

          <p>
            These settings are stored on the main wedding document,
            alongside shared planner settings like your total budget.
            Saving here won't overwrite your budget, guests, vendors,
            timeline, or other planning data.
          </p>
        </section>

        <div className="settings-save-bar">
          <div className="settings-save-status">
            {hasChanges ? (
              <>
                <span className="settings-unsaved-dot" />

                <span>
                  You have unsaved changes.
                </span>
              </>
            ) : (
              <>
                <Check
                  size={14}
                />

                <span>
                  Everything is saved.
                </span>
              </>
            )}
          </div>

          <div className="settings-save-actions">
            {hasChanges && (
              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleReset
                }
                disabled={
                  saving
                }
              >
                Reset
              </button>
            )}

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
        </div>
      </form>
    </div>
  );
}

function normalizeWebsite(
  value
) {
  const cleaned =
    String(value || "")
      .trim();

  if (!cleaned) {
    return "";
  }

  if (
    cleaned.startsWith(
      "http://"
    ) ||
    cleaned.startsWith(
      "https://"
    )
  ) {
    return cleaned;
  }

  return `https://${cleaned}`;
}

export default Settings;