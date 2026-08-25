import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bookmark,
  ExternalLink,
  FolderPlus,
  Image,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../services/firebase";
import { WEDDING_ID } from "../config/wedding";
import { useAuth } from "../context/AuthContext";

const emptyPin = {
  title: "",
  boardId: "",
  url: "",
  imageUrl: "",
  notes: "",
  price: "",
};

function Pins() {
  const { user } = useAuth();

  const [boards, setBoards] = useState([]);
  const [pins, setPins] = useState([]);

  const [boardsLoading, setBoardsLoading] = useState(true);
  const [pinsLoading, setPinsLoading] = useState(true);

  const [selectedBoardId, setSelectedBoardId] = useState("all");

  const [showPinModal, setShowPinModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);

  const [editingPinId, setEditingPinId] = useState(null);

  const [pinForm, setPinForm] = useState(emptyPin);
  const [boardName, setBoardName] = useState("");

  const [savingPin, setSavingPin] = useState(false);
  const [savingBoard, setSavingBoard] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const boardsRef = collection(
      db,
      "weddings",
      WEDDING_ID,
      "boards"
    );

    const boardsQuery = query(
      boardsRef,
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      boardsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((boardDocument) => ({
          id: boardDocument.id,
          ...boardDocument.data(),
        }));

        setBoards(data);
        setBoardsLoading(false);
      },
      (firebaseError) => {
        console.error("Error loading boards:", firebaseError);
        setBoardsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const pinsRef = collection(
      db,
      "weddings",
      WEDDING_ID,
      "pins"
    );

    const pinsQuery = query(
      pinsRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      pinsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((pinDocument) => ({
          id: pinDocument.id,
          ...pinDocument.data(),
        }));

        setPins(data);
        setPinsLoading(false);
      },
      (firebaseError) => {
        console.error("Error loading pins:", firebaseError);
        setPinsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const filteredPins = useMemo(() => {
    if (selectedBoardId === "all") {
      return pins;
    }

    if (selectedBoardId === "unassigned") {
      return pins.filter((pin) => !pin.boardId);
    }

    return pins.filter(
      (pin) => pin.boardId === selectedBoardId
    );
  }, [pins, selectedBoardId]);

  const getBoardName = (boardId) => {
    if (!boardId) {
      return "Unassigned";
    }

    const board = boards.find(
      (item) => item.id === boardId
    );

    return board?.name || "Unassigned";
  };

  const getBoardPinCount = (boardId) => {
    return pins.filter(
      (pin) => pin.boardId === boardId
    ).length;
  };

  const openAddPin = () => {
    setEditingPinId(null);

    setPinForm({
      ...emptyPin,
      boardId:
        selectedBoardId !== "all" &&
        selectedBoardId !== "unassigned"
          ? selectedBoardId
          : "",
    });

    setError("");
    setShowPinModal(true);
  };

  const openEditPin = (pin) => {
    setEditingPinId(pin.id);

    setPinForm({
      title: pin.title || "",
      boardId: pin.boardId || "",
      url: pin.url || "",
      imageUrl: pin.imageUrl || "",
      notes: pin.notes || "",
      price: pin.price || "",
    });

    setError("");
    setShowPinModal(true);
  };

  const closePinModal = () => {
    if (savingPin) {
      return;
    }

    setShowPinModal(false);
    setEditingPinId(null);
    setPinForm(emptyPin);
    setError("");
  };

  const closeBoardModal = () => {
    if (savingBoard) {
      return;
    }

    setShowBoardModal(false);
    setBoardName("");
    setError("");
  };

  const handlePinInputChange = (event) => {
    const { name, value } = event.target;

    setPinForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSavePin = async (event) => {
    event.preventDefault();

    if (!pinForm.title.trim()) {
      setError("Please enter a title.");
      return;
    }

    setSavingPin(true);
    setError("");

    try {
      if (editingPinId) {
        await updateDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "pins",
            editingPinId
          ),
          {
            ...pinForm,
            title: pinForm.title.trim(),
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid || null,
          }
        );
      } else {
        await addDoc(
          collection(
            db,
            "weddings",
            WEDDING_ID,
            "pins"
          ),
          {
            ...pinForm,
            title: pinForm.title.trim(),

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),

            createdBy: user?.uid || null,
            createdByName:
              user?.displayName ||
              user?.email ||
              "",
          }
        );
      }

      setShowPinModal(false);
      setEditingPinId(null);
      setPinForm(emptyPin);
    } catch (firebaseError) {
      console.error("Error saving pin:", firebaseError);

      setError(
        "We couldn't save this pin. Please try again."
      );
    } finally {
      setSavingPin(false);
    }
  };

  const handleCreateBoard = async (event) => {
    event.preventDefault();

    if (!boardName.trim()) {
      setError("Please enter a board name.");
      return;
    }

    setSavingBoard(true);
    setError("");

    try {
      const newBoard = await addDoc(
        collection(
          db,
          "weddings",
          WEDDING_ID,
          "boards"
        ),
        {
          name: boardName.trim(),
          createdAt: serverTimestamp(),
          createdBy: user?.uid || null,
        }
      );

      setSelectedBoardId(newBoard.id);

      setShowBoardModal(false);
      setBoardName("");
    } catch (firebaseError) {
      console.error(
        "Error creating board:",
        firebaseError
      );

      setError(
        "We couldn't create this board."
      );
    } finally {
      setSavingBoard(false);
    }
  };

  const handleDeletePin = async (pinId) => {
    try {
      await deleteDoc(
        doc(
          db,
          "weddings",
          WEDDING_ID,
          "pins",
          pinId
        )
      );
    } catch (firebaseError) {
      console.error(
        "Error deleting pin:",
        firebaseError
      );
    }
  };

  const handleDeleteBoard = async (boardId) => {
    const boardHasPins = pins.some(
      (pin) => pin.boardId === boardId
    );

    if (boardHasPins) {
      setError(
        "Move or delete the pins on this board before deleting it."
      );

      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "weddings",
          WEDDING_ID,
          "boards",
          boardId
        )
      );

      if (selectedBoardId === boardId) {
        setSelectedBoardId("all");
      }
    } catch (firebaseError) {
      console.error(
        "Error deleting board:",
        firebaseError
      );
    }
  };

  const loading =
    boardsLoading ||
    pinsLoading;

  return (
    <div className="page pins-page">
      <div className="pins-page-header">
        <div>
          <p className="page-eyebrow">
            Inspiration
          </p>

          <h1>Pins & Ideas</h1>

          <p className="page-description">
            Keep inspiration, products, links, and wedding ideas organized in one place.
          </p>
        </div>

        <div className="pins-header-actions">
          <button
            className="secondary-button"
            onClick={() => {
              setError("");
              setShowBoardModal(true);
            }}
          >
            <FolderPlus size={17} />
            New Board
          </button>

          <button
            className="primary-button"
            onClick={openAddPin}
          >
            <Plus size={17} />
            Add Pin
          </button>
        </div>
      </div>

      {error &&
        !showPinModal &&
        !showBoardModal && (
          <div className="auth-error pins-page-error">
            {error}
          </div>
        )}

      <section className="pins-board-bar">
        <button
          className={`board-filter ${
            selectedBoardId === "all"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setSelectedBoardId("all")
          }
        >
          <span>All Pins</span>
          <small>{pins.length}</small>
        </button>

        {boards.map((board) => (
          <button
            className={`board-filter ${
              selectedBoardId === board.id
                ? "active"
                : ""
            }`}
            key={board.id}
            onClick={() =>
              setSelectedBoardId(board.id)
            }
          >
            <span>{board.name}</span>

            <small>
              {getBoardPinCount(board.id)}
            </small>
          </button>
        ))}

        {pins.some((pin) => !pin.boardId) && (
          <button
            className={`board-filter ${
              selectedBoardId === "unassigned"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSelectedBoardId("unassigned")
            }
          >
            <span>Unassigned</span>

            <small>
              {
                pins.filter(
                  (pin) => !pin.boardId
                ).length
              }
            </small>
          </button>
        )}
      </section>

      {selectedBoardId !== "all" &&
        selectedBoardId !== "unassigned" && (
          <section className="selected-board-header">
            <div>
              <p className="card-eyebrow">
                Board
              </p>

              <h2>
                {getBoardName(
                  selectedBoardId
                )}
              </h2>
            </div>

            <button
              className="delete-board-button"
              onClick={() =>
                handleDeleteBoard(
                  selectedBoardId
                )
              }
            >
              <Trash2 size={15} />
              Delete Board
            </button>
          </section>
        )}

      {loading ? (
        <div className="content-card pins-loading">
          <LoaderCircle
            size={25}
            className="spinner"
          />

          <p>Loading ideas...</p>
        </div>
      ) : filteredPins.length === 0 ? (
        <div className="content-card pins-empty">
          <Bookmark
            size={36}
            strokeWidth={1.3}
          />

          <h2>No pins yet</h2>

          <p>
            Save your first inspiration link, product, or idea.
          </p>

          <button
            className="primary-button"
            onClick={openAddPin}
          >
            <Plus size={17} />
            Add Pin
          </button>
        </div>
      ) : (
        <section className="pins-grid">
          {filteredPins.map((pin) => (
            <article
              className="pin-card"
              key={pin.id}
            >
              <div className="pin-image-wrap">
                {pin.imageUrl ? (
                  <img
                    src={pin.imageUrl}
                    alt={pin.title}
                    className="pin-image"
                  />
                ) : (
                  <div className="pin-image-placeholder">
                    <Image
                      size={32}
                      strokeWidth={1.3}
                    />

                    <span>No image</span>
                  </div>
                )}

                <div className="pin-card-actions">
                  <button
                    className="pin-icon-button"
                    onClick={() =>
                      openEditPin(pin)
                    }
                    title="Edit pin"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    className="pin-icon-button danger"
                    onClick={() =>
                      handleDeletePin(pin.id)
                    }
                    title="Delete pin"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="pin-card-content">
                <p className="pin-board-name">
                  {getBoardName(
                    pin.boardId
                  )}
                </p>

                <h3>{pin.title}</h3>

                {pin.price && (
                  <p className="pin-price">
                    {formatPrice(pin.price)}
                  </p>
                )}

                {pin.notes && (
                  <p className="pin-notes">
                    {pin.notes}
                  </p>
                )}

                {pin.url && (
                  <a
                    href={normalizeUrl(pin.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="pin-link"
                  >
                    <ExternalLink
                      size={14}
                    />

                    Open Link
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {showPinModal && (
        <div
          className="modal-backdrop"
          onMouseDown={closePinModal}
        >
          <div
            className="task-modal pin-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="task-modal-header">
              <div>
                <p className="card-eyebrow">
                  {editingPinId
                    ? "Edit"
                    : "New Pin"}
                </p>

                <h2>
                  {editingPinId
                    ? "Edit Pin"
                    : "Add a Pin"}
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={closePinModal}
                disabled={savingPin}
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="task-form"
              onSubmit={handleSavePin}
            >
              <label className="form-field">
                <span>Title</span>

                <input
                  type="text"
                  name="title"
                  value={pinForm.title}
                  onChange={
                    handlePinInputChange
                  }
                  placeholder="Floral welcome sign"
                  autoFocus
                />
              </label>

              <label className="form-field">
                <span>Board</span>

                <select
                  name="boardId"
                  value={pinForm.boardId}
                  onChange={
                    handlePinInputChange
                  }
                >
                  <option value="">
                    No board
                  </option>

                  {boards.map((board) => (
                    <option
                      value={board.id}
                      key={board.id}
                    >
                      {board.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Link</span>

                <input
                  type="text"
                  name="url"
                  value={pinForm.url}
                  onChange={
                    handlePinInputChange
                  }
                  placeholder="https://..."
                />
              </label>

              <label className="form-field">
                <span>Image URL</span>

                <input
                  type="text"
                  name="imageUrl"
                  value={pinForm.imageUrl}
                  onChange={
                    handlePinInputChange
                  }
                  placeholder="https://..."
                />
              </label>

              <label className="form-field">
                <span>Price</span>

                <input
                  type="number"
                  name="price"
                  value={pinForm.price}
                  onChange={
                    handlePinInputChange
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </label>

              <label className="form-field">
                <span>Notes</span>

                <textarea
                  name="notes"
                  value={pinForm.notes}
                  onChange={
                    handlePinInputChange
                  }
                  placeholder="Why you saved this, sizing, colors, ideas..."
                  rows="4"
                />
              </label>

              {pinForm.imageUrl && (
                <div className="pin-preview">
                  <p>
                    Image preview
                  </p>

                  <img
                    src={
                      pinForm.imageUrl
                    }
                    alt="Pin preview"
                  />
                </div>
              )}

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <div className="task-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closePinModal}
                  disabled={savingPin}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingPin}
                >
                  {savingPin ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Bookmark
                        size={17}
                      />

                      {editingPinId
                        ? "Save Changes"
                        : "Add Pin"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBoardModal && (
        <div
          className="modal-backdrop"
          onMouseDown={closeBoardModal}
        >
          <div
            className="task-modal board-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="task-modal-header">
              <div>
                <p className="card-eyebrow">
                  Inspiration
                </p>

                <h2>Create Board</h2>
              </div>

              <button
                className="icon-button"
                onClick={closeBoardModal}
                disabled={savingBoard}
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="task-form"
              onSubmit={
                handleCreateBoard
              }
            >
              <label className="form-field">
                <span>Board name</span>

                <input
                  type="text"
                  value={boardName}
                  onChange={(event) =>
                    setBoardName(
                      event.target.value
                    )
                  }
                  placeholder="Reception Decor"
                  autoFocus
                />
              </label>

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <div className="task-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeBoardModal
                  }
                  disabled={savingBoard}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingBoard}
                >
                  {savingBoard ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="spinner"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FolderPlus
                        size={17}
                      />
                      Create Board
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function normalizeUrl(url) {
  if (!url) {
    return "";
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `https://${url}`;
}

function formatPrice(price) {
  const number = Number(price);

  if (Number.isNaN(number)) {
    return price;
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    }
  ).format(number);
}

export default Pins;