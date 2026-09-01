import {
  Archive,
  Boxes,
  Camera,
  ChevronDown,
  Grid3X3,
  ImagePlus,
  List,
  MapPin,
  Package,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
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

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  WEDDING_ID,
} from "../../config/wedding";

import {
  db,
} from "../../services/firebase";

import {
  isCloudinaryConfigured,
  uploadInventoryImage,
} from "../../services/cloudinary";

import "../../styles/inventory.css";

const emptyForm = {
  name:
    "",

  quantity:
    "1",

  category:
    "",

  location:
    "",

  notes:
    "",

  photoUrl:
    "",

  cloudinaryPublicId:
    "",

  cloudinaryAssetId:
    "",
};

function Inventory() {
  const {
    user,
  } = useAuth();

  const [
    items,
    setItems,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("");

  const [
    locationFilter,
    setLocationFilter,
  ] = useState("");

  const [
    sortBy,
    setSortBy,
  ] = useState(
    "name-asc"
  );

  const [
    view,
    setView,
  ] = useState(
    "cards"
  );

  const [
    editorOpen,
    setEditorOpen,
  ] = useState(false);

  const [
    editingItem,
    setEditingItem,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(
    emptyForm
  );

  const [
    selectedPhoto,
    setSelectedPhoto,
  ] = useState(null);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saveStatus,
    setSaveStatus,
  ] = useState("");

  const fileInputRef =
    useRef(null);

  useEffect(() => {
    const inventoryRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "inventoryItems"
      );

    const inventoryQuery =
      query(
        inventoryRef,
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const unsubscribe =
      onSnapshot(
        inventoryQuery,
        (snapshot) => {
          const nextItems =
            snapshot.docs.map(
              (snapshotDoc) => ({
                id:
                  snapshotDoc.id,

                ...snapshotDoc.data(),
              })
            );

          setItems(
            nextItems
          );

          setLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading inventory:",
            firebaseError
          );

          setError(
            "We couldn't load the inventory."
          );

          setLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      if (
        previewUrl &&
        previewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [
    previewUrl,
  ]);

  const categories =
    useMemo(
      () =>
        uniqueSorted(
          items.map(
            (item) =>
              item.category
          )
        ),
      [
        items,
      ]
    );

  const locations =
    useMemo(
      () =>
        uniqueSorted(
          items.map(
            (item) =>
              item.location
          )
        ),
      [
        items,
      ]
    );

  const filteredItems =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      const filtered =
        items.filter(
          (item) => {
            const matchesSearch =
              !normalizedSearch ||
              [
                item.name,
                item.category,
                item.location,
                item.notes,
                item.quantity,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                )
                .toLowerCase()
                .includes(
                  normalizedSearch
                );

            const matchesCategory =
              !categoryFilter ||
              item.category ===
                categoryFilter;

            const matchesLocation =
              !locationFilter ||
              item.location ===
                locationFilter;

            return (
              matchesSearch &&
              matchesCategory &&
              matchesLocation
            );
          }
        );

      return sortInventory(
        filtered,
        sortBy
      );
    }, [
      items,
      search,
      categoryFilter,
      locationFilter,
      sortBy,
    ]);

  const totalQuantity =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) => {
            const quantity =
              Number(
                item.quantity
              );

            if (
              Number.isFinite(
                quantity
              )
            ) {
              return (
                total +
                quantity
              );
            }

            return (
              total + 1
            );
          },
          0
        ),
      [
        items,
      ]
    );

  const activeFilterCount =
    [
      categoryFilter,
      locationFilter,
    ].filter(Boolean)
      .length;

  const openAddItem = () => {
    setEditingItem(
      null
    );

    setForm(
      emptyForm
    );

    setSelectedPhoto(
      null
    );

    setPreviewUrl(
      ""
    );

    setError(
      ""
    );

    setSaveStatus(
      ""
    );

    setEditorOpen(
      true
    );
  };

  const openEditItem =
    (item) => {
      setEditingItem(
        item
      );

      setForm({
        name:
          item.name ||
          "",

        quantity:
          String(
            item.quantity ??
              "1"
          ),

        category:
          item.category ||
          "",

        location:
          item.location ||
          "",

        notes:
          item.notes ||
          "",

        photoUrl:
          item.photoUrl ||
          "",

        cloudinaryPublicId:
          item.cloudinaryPublicId ||
          "",

        cloudinaryAssetId:
          item.cloudinaryAssetId ||
          "",
      });

      setSelectedPhoto(
        null
      );

      setPreviewUrl(
        item.photoUrl ||
          ""
      );

      setError(
        ""
      );

      setSaveStatus(
        ""
      );

      setEditorOpen(
        true
      );
    };

  const closeEditor = () => {
    if (
      saving
    ) {
      return;
    }

    setEditorOpen(
      false
    );

    setEditingItem(
      null
    );

    setForm(
      emptyForm
    );

    setSelectedPhoto(
      null
    );

    setPreviewUrl(
      ""
    );

    setSaveStatus(
      ""
    );
  };

  const handleFormChange =
    (event) => {
      const {
        name,
        value,
      } =
        event.target;

      setForm(
        (current) => ({
          ...current,

          [name]:
            value,
        })
      );
    };

  const handlePhotoChange =
    (event) => {
      const file =
        event.target.files?.[0];

      if (
        !file
      ) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        setError(
          "Please choose an image file."
        );

        event.target.value =
          "";

        return;
      }

      const maxSize =
        10 *
        1024 *
        1024;

      if (
        file.size >
        maxSize
      ) {
        setError(
          "Please choose an image smaller than 10 MB."
        );

        event.target.value =
          "";

        return;
      }

      setError(
        ""
      );

      setSelectedPhoto(
        file
      );

      const objectUrl =
        URL.createObjectURL(
          file
        );

      setPreviewUrl(
        (current) => {
          if (
            current &&
            current.startsWith(
              "blob:"
            )
          ) {
            URL.revokeObjectURL(
              current
            );
          }

          return objectUrl;
        }
      );
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const name =
        form.name.trim();

      if (
        !name
      ) {
        setError(
          "Please enter an item name."
        );

        return;
      }

      if (
        selectedPhoto &&
        !isCloudinaryConfigured()
      ) {
        setError(
          "Cloudinary is not configured. Check your .env file and restart npm run dev."
        );

        return;
      }

      setSaving(
        true
      );

      setError(
        ""
      );

      setSaveStatus(
        selectedPhoto
          ? "Uploading photo..."
          : "Saving item..."
      );

      try {
        const quantity =
          normalizeQuantity(
            form.quantity
          );

        let photoData = {
          photoUrl:
            form.photoUrl ||
            "",

          cloudinaryPublicId:
            form.cloudinaryPublicId ||
            "",

          cloudinaryAssetId:
            form.cloudinaryAssetId ||
            "",
        };

        if (
          selectedPhoto
        ) {
          photoData =
            await uploadInventoryImage(
              selectedPhoto
            );
        }

        setSaveStatus(
          "Saving item..."
        );

        if (
          editingItem
        ) {
          await updateExistingItem({
            item:
              editingItem,

            form,

            quantity,

            photoData,

            user,
          });
        } else {
          await createInventoryItem({
            form,

            quantity,

            photoData,

            user,
          });
        }

        setEditorOpen(
          false
        );

        setEditingItem(
          null
        );

        setForm(
          emptyForm
        );

        setSelectedPhoto(
          null
        );

        setPreviewUrl(
          ""
        );

        setSaveStatus(
          ""
        );
      } catch (
        saveError
      ) {
        console.error(
          "Error saving inventory item:",
          saveError
        );

        setError(
          saveError?.message ||
            "We couldn't save this item. Please try again."
        );

        setSaveStatus(
          ""
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const handleDelete =
    async (item) => {
      const confirmed =
        window.confirm(
          `Delete "${item.name}" from your wedding inventory?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "inventoryItems",
            item.id
          )
        );
      } catch (
        deleteError
      ) {
        console.error(
          "Error deleting inventory item:",
          deleteError
        );

        setError(
          "We couldn't delete this item."
        );
      }
    };

  const clearFilters = () => {
    setCategoryFilter(
      ""
    );

    setLocationFilter(
      ""
    );
  };

  return (
    <main className="page inventory-page">
      <header className="inventory-heading">
        <div>
          <p className="page-eyebrow">
            Planning
          </p>

          <h1 className="page-title">
            Wedding Inventory
          </h1>

          <p className="page-description">
            Keep track of decor, supplies, and everything
            you&apos;ve collected for the wedding,
            including exactly where each item is stored.
          </p>
        </div>

        <button
          type="button"
          className="primary-button inventory-add-button"
          onClick={
            openAddItem
          }
        >
          <Plus
            size={17}
          />

          Add Item
        </button>
      </header>

      <section className="inventory-summary">
        <InventorySummary
          icon={
            Package
          }
          value={
            items.length
          }
          label="Inventory Items"
        />

        <InventorySummary
          icon={
            Boxes
          }
          value={
            totalQuantity
          }
          label="Total Quantity"
        />

        <InventorySummary
          icon={
            Tag
          }
          value={
            categories.length
          }
          label="Categories"
        />

        <InventorySummary
          icon={
            MapPin
          }
          value={
            locations.length
          }
          label="Locations"
        />
      </section>

      <section className="inventory-toolbar content-card">
        <div className="inventory-search">
          <Search
            size={18}
          />

          <input
            type="search"
            placeholder="Search inventory..."
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
          />

          {search && (
            <button
              type="button"
              className="inventory-search-clear"
              onClick={() =>
                setSearch(
                  ""
                )
              }
              aria-label="Clear search"
            >
              <X
                size={16}
              />
            </button>
          )}
        </div>

        <div className="inventory-filter-row">
          <SelectControl
            value={
              locationFilter
            }
            onChange={
              setLocationFilter
            }
            label="Location"
            options={
              locations
            }
            allLabel="All Locations"
          />

          <SelectControl
            value={
              categoryFilter
            }
            onChange={
              setCategoryFilter
            }
            label="Category"
            options={
              categories
            }
            allLabel="All Categories"
          />

          <div className="inventory-select">
            <select
              value={
                sortBy
              }
              onChange={(
                event
              ) =>
                setSortBy(
                  event.target
                    .value
                )
              }
              aria-label="Sort inventory"
            >
              <option value="name-asc">
                Name A–Z
              </option>

              <option value="name-desc">
                Name Z–A
              </option>

              <option value="location">
                Location
              </option>

              <option value="category">
                Category
              </option>

              <option value="newest">
                Newest Added
              </option>

              <option value="oldest">
                Oldest Added
              </option>
            </select>

            <ChevronDown
              size={15}
            />
          </div>
        </div>

        <div className="inventory-toolbar-bottom">
          <div className="inventory-filter-status">
            <strong>
              {
                filteredItems.length
              }
            </strong>{" "}
            {filteredItems.length ===
            1
              ? "item"
              : "items"}

            {activeFilterCount >
              0 && (
              <>
                {" "}
                shown with{" "}

                <strong>
                  {
                    activeFilterCount
                  }
                </strong>{" "}

                {activeFilterCount ===
                1
                  ? "filter"
                  : "filters"}
              </>
            )}

            {activeFilterCount >
              0 && (
              <button
                type="button"
                className="inventory-clear-filters"
                onClick={
                  clearFilters
                }
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="inventory-view-toggle">
            <button
              type="button"
              className={
                view ===
                "cards"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView(
                  "cards"
                )
              }
              aria-label="Card view"
              title="Card view"
            >
              <Grid3X3
                size={17}
              />
            </button>

            <button
              type="button"
              className={
                view ===
                "list"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView(
                  "list"
                )
              }
              aria-label="List view"
              title="List view"
            >
              <List
                size={18}
              />
            </button>
          </div>
        </div>
      </section>

      {error &&
        !editorOpen && (
          <div className="inventory-error">
            {
              error
            }
          </div>
        )}

      {loading ? (
        <div className="content-card">
          Loading inventory...
        </div>
      ) : filteredItems.length ===
        0 ? (
        <InventoryEmpty
          hasItems={
            items.length >
            0
          }
          onAddItem={
            openAddItem
          }
          clearFilters={
            clearFilters
          }
          clearSearch={() =>
            setSearch(
              ""
            )
          }
        />
      ) : view ===
        "cards" ? (
        <div className="inventory-grid">
          {filteredItems.map(
            (item) => (
              <InventoryCard
                key={
                  item.id
                }
                item={
                  item
                }
                onEdit={
                  openEditItem
                }
                onDelete={
                  handleDelete
                }
              />
            )
          )}
        </div>
      ) : (
        <InventoryList
          items={
            filteredItems
          }
          onEdit={
            openEditItem
          }
          onDelete={
            handleDelete
          }
        />
      )}

      {editorOpen && (
        <InventoryEditor
          editingItem={
            editingItem
          }
          form={
            form
          }
          previewUrl={
            previewUrl
          }
          categories={
            categories
          }
          locations={
            locations
          }
          saving={
            saving
          }
          saveStatus={
            saveStatus
          }
          error={
            error
          }
          fileInputRef={
            fileInputRef
          }
          onClose={
            closeEditor
          }
          onSubmit={
            handleSubmit
          }
          onChange={
            handleFormChange
          }
          onPhotoChange={
            handlePhotoChange
          }
        />
      )}
    </main>
  );
}

function InventorySummary({
  icon: Icon,
  value,
  label,
}) {
  return (
    <article className="inventory-summary-card">
      <div className="inventory-summary-icon">
        <Icon
          size={19}
        />
      </div>

      <div>
        <strong>
          {
            value
          }
        </strong>

        <span>
          {
            label
          }
        </span>
      </div>
    </article>
  );
}

function SelectControl({
  value,
  onChange,
  options,
  allLabel,
  label,
}) {
  return (
    <div className="inventory-select">
      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        aria-label={
          label
        }
      >
        <option value="">
          {
            allLabel
          }
        </option>

        {options.map(
          (option) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {
                option
              }
            </option>
          )
        )}
      </select>

      <ChevronDown
        size={15}
      />
    </div>
  );
}

function InventoryCard({
  item,
  onEdit,
  onDelete,
}) {
  return (
    <article className="inventory-card">
      <div className="inventory-card-photo">
        {item.photoUrl ? (
          <img
            src={
              item.photoUrl
            }
            alt={
              item.name
            }
            loading="lazy"
          />
        ) : (
          <div className="inventory-photo-placeholder">
            <Camera
              size={28}
            />

            <span>
              No Photo
            </span>
          </div>
        )}

        {item.category && (
          <span className="inventory-category-tag">
            {
              item.category
            }
          </span>
        )}
      </div>

      <div className="inventory-card-content">
        <div className="inventory-card-heading">
          <div>
            <h2>
              {
                item.name
              }
            </h2>

            {item.quantity &&
              Number(
                item.quantity
              ) >
                1 && (
                <span className="inventory-quantity">
                  Qty{" "}
                  {
                    item.quantity
                  }
                </span>
              )}
          </div>
        </div>

        {item.location && (
          <div className="inventory-location">
            <MapPin
              size={15}
            />

            <span>
              {
                item.location
              }
            </span>
          </div>
        )}

        {item.notes && (
          <p className="inventory-notes">
            {
              item.notes
            }
          </p>
        )}

        <div className="inventory-card-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              onEdit(
                item
              )
            }
          >
            <Pencil
              size={15}
            />

            Edit
          </button>

          <button
            type="button"
            className="icon-button inventory-delete-button"
            onClick={() =>
              onDelete(
                item
              )
            }
            aria-label={`Delete ${item.name}`}
            title="Delete"
          >
            <Trash2
              size={16}
            />
          </button>
        </div>
      </div>
    </article>
  );
}

function InventoryList({
  items,
  onEdit,
  onDelete,
}) {
  return (
    <div className="inventory-list content-card">
      <div className="inventory-list-header">
        <span>
          Item
        </span>

        <span>
          Qty
        </span>

        <span>
          Category
        </span>

        <span>
          Location
        </span>

        <span />
      </div>

      {items.map(
        (item) => (
          <div
            className="inventory-list-row"
            key={
              item.id
            }
          >
            <div className="inventory-list-item">
              <div className="inventory-list-photo">
                {item.photoUrl ? (
                  <img
                    src={
                      item.photoUrl
                    }
                    alt=""
                  />
                ) : (
                  <Package
                    size={18}
                  />
                )}
              </div>

              <div>
                <strong>
                  {
                    item.name
                  }
                </strong>

                {item.notes && (
                  <span>
                    {
                      item.notes
                    }
                  </span>
                )}
              </div>
            </div>

            <span>
              {
                item.quantity ||
                "1"
              }
            </span>

            <span>
              {
                item.category ||
                "—"
              }
            </span>

            <span>
              {
                item.location ||
                "—"
              }
            </span>

            <div className="inventory-list-actions">
              <button
                type="button"
                className="icon-button"
                onClick={() =>
                  onEdit(
                    item
                  )
                }
                aria-label={`Edit ${item.name}`}
              >
                <Pencil
                  size={16}
                />
              </button>

              <button
                type="button"
                className="icon-button inventory-delete-button"
                onClick={() =>
                  onDelete(
                    item
                  )
                }
                aria-label={`Delete ${item.name}`}
              >
                <Trash2
                  size={16}
                />
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function InventoryEmpty({
  hasItems,
  onAddItem,
  clearFilters,
  clearSearch,
}) {
  return (
    <section className="inventory-empty content-card">
      <div className="inventory-empty-icon">
        <Archive
          size={25}
        />
      </div>

      <h2>
        {hasItems
          ? "No matching items"
          : "Your inventory is empty"}
      </h2>

      <p>
        {hasItems
          ? "Try changing your search or clearing your filters."
          : "Add your first wedding item to start keeping track of everything you've collected."}
      </p>

      {hasItems ? (
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            clearFilters();

            clearSearch();
          }}
        >
          Clear Search & Filters
        </button>
      ) : (
        <button
          type="button"
          className="primary-button"
          onClick={
            onAddItem
          }
        >
          <Plus
            size={16}
          />

          Add First Item
        </button>
      )}
    </section>
  );
}

function InventoryEditor({
  editingItem,
  form,
  previewUrl,
  categories,
  locations,
  saving,
  saveStatus,
  error,
  fileInputRef,
  onClose,
  onSubmit,
  onChange,
  onPhotoChange,
}) {
  return (
    <div
      className="inventory-modal-backdrop"
      role="presentation"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="inventory-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-editor-title"
      >
        <div className="inventory-modal-header">
          <div>
            <p className="page-eyebrow">
              Wedding Inventory
            </p>

            <h2 id="inventory-editor-title">
              {editingItem
                ? "Edit Item"
                : "Add Item"}
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
            aria-label="Close"
          >
            <X
              size={19}
            />
          </button>
        </div>

        <form
          onSubmit={
            onSubmit
          }
          className="inventory-form"
        >
          <div className="inventory-photo-editor">
            <input
              ref={
                fileInputRef
              }
              className="inventory-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                onPhotoChange
              }
            />

            <button
              type="button"
              className={`inventory-photo-upload ${
                previewUrl
                  ? "has-photo"
                  : ""
              }`}
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                saving
              }
            >
              {previewUrl ? (
                <>
                  <img
                    src={
                      previewUrl
                    }
                    alt="Inventory preview"
                  />

                  <span className="inventory-photo-change">
                    <ImagePlus
                      size={17}
                    />

                    Change Photo
                  </span>
                </>
              ) : (
                <>
                  <div className="inventory-upload-icon">
                    <Upload
                      size={23}
                    />
                  </div>

                  <strong>
                    Add a photo
                  </strong>

                  <span>
                    Choose an image or take a photo
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="inventory-form-fields">
            <label className="form-field inventory-form-wide">
              <span>
                Item Name *
              </span>

              <input
                type="text"
                name="name"
                value={
                  form.name
                }
                onChange={
                  onChange
                }
                placeholder="Gold picture frames"
                required
                disabled={
                  saving
                }
              />
            </label>

            <label className="form-field">
              <span>
                Quantity
              </span>

              <input
                type="number"
                name="quantity"
                min="1"
                step="1"
                value={
                  form.quantity
                }
                onChange={
                  onChange
                }
                disabled={
                  saving
                }
              />
            </label>

            <label className="form-field">
              <span>
                Category
              </span>

              <input
                type="text"
                name="category"
                list="inventory-categories"
                value={
                  form.category
                }
                onChange={
                  onChange
                }
                placeholder="Table Decor"
                disabled={
                  saving
                }
              />

              <datalist id="inventory-categories">
                {categories.map(
                  (category) => (
                    <option
                      value={
                        category
                      }
                      key={
                        category
                      }
                    />
                  )
                )}
              </datalist>
            </label>

            <label className="form-field inventory-form-wide">
              <span>
                Storage Location
              </span>

              <input
                type="text"
                name="location"
                list="inventory-locations"
                value={
                  form.location
                }
                onChange={
                  onChange
                }
                placeholder="Basement - Wedding Shelf"
                disabled={
                  saving
                }
              />

              <datalist id="inventory-locations">
                {locations.map(
                  (location) => (
                    <option
                      value={
                        location
                      }
                      key={
                        location
                      }
                    />
                  )
                )}
              </datalist>
            </label>

            <label className="form-field inventory-form-wide">
              <span>
                Notes
              </span>

              <textarea
                name="notes"
                rows="4"
                value={
                  form.notes
                }
                onChange={
                  onChange
                }
                placeholder="Using these for table numbers..."
                disabled={
                  saving
                }
              />
            </label>
          </div>

          {saveStatus && (
            <div className="inventory-save-status">
              {
                saveStatus
              }
            </div>
          )}

          {error && (
            <div className="inventory-modal-error">
              {
                error
              }
            </div>
          )}

          <div className="inventory-modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                saving
              }
            >
              {saving
                ? saveStatus ||
                  "Saving..."
                : editingItem
                  ? "Save Changes"
                  : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

async function createInventoryItem({
  form,
  quantity,
  photoData,
  user,
}) {
  const inventoryRef =
    collection(
      db,
      "weddings",
      WEDDING_ID,
      "inventoryItems"
    );

  await addDoc(
    inventoryRef,
    {
      name:
        form.name.trim(),

      quantity,

      category:
        form.category.trim(),

      location:
        form.location.trim(),

      notes:
        form.notes.trim(),

      photoUrl:
        photoData.photoUrl ||
        "",

      cloudinaryPublicId:
        photoData.cloudinaryPublicId ||
        "",

      cloudinaryAssetId:
        photoData.cloudinaryAssetId ||
        "",

      photoWidth:
        photoData.photoWidth ||
        null,

      photoHeight:
        photoData.photoHeight ||
        null,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),

      createdBy:
        user?.uid ||
        "",

      updatedBy:
        user?.uid ||
        "",
    }
  );
}

async function updateExistingItem({
  item,
  form,
  quantity,
  photoData,
  user,
}) {
  const itemRef =
    doc(
      db,
      "weddings",
      WEDDING_ID,
      "inventoryItems",
      item.id
    );

  await updateDoc(
    itemRef,
    {
      name:
        form.name.trim(),

      quantity,

      category:
        form.category.trim(),

      location:
        form.location.trim(),

      notes:
        form.notes.trim(),

      photoUrl:
        photoData.photoUrl ||
        "",

      cloudinaryPublicId:
        photoData.cloudinaryPublicId ||
        "",

      cloudinaryAssetId:
        photoData.cloudinaryAssetId ||
        "",

      photoWidth:
        photoData.photoWidth ||
        item.photoWidth ||
        null,

      photoHeight:
        photoData.photoHeight ||
        item.photoHeight ||
        null,

      updatedAt:
        serverTimestamp(),

      updatedBy:
        user?.uid ||
        "",
    }
  );
}

function normalizeQuantity(
  value
) {
  const quantity =
    Number.parseInt(
      value,
      10
    );

  if (
    !Number.isFinite(
      quantity
    ) ||
    quantity <
      1
  ) {
    return 1;
  }

  return quantity;
}

function uniqueSorted(
  values
) {
  return [
    ...new Set(
      values
        .map(
          (value) =>
            String(
              value ||
              ""
            ).trim()
        )
        .filter(
          Boolean
        )
    ),
  ].sort(
    (
      first,
      second
    ) =>
      first.localeCompare(
        second
      )
  );
}

function sortInventory(
  items,
  sortBy
) {
  return [
    ...items,
  ].sort(
    (
      first,
      second
    ) => {
      if (
        sortBy ===
        "name-desc"
      ) {
        return compareText(
          second.name,
          first.name
        );
      }

      if (
        sortBy ===
        "location"
      ) {
        return (
          compareText(
            first.location,
            second.location
          ) ||
          compareText(
            first.name,
            second.name
          )
        );
      }

      if (
        sortBy ===
        "category"
      ) {
        return (
          compareText(
            first.category,
            second.category
          ) ||
          compareText(
            first.name,
            second.name
          )
        );
      }

      if (
        sortBy ===
        "newest"
      ) {
        return (
          getTimestamp(
            second.createdAt
          ) -
          getTimestamp(
            first.createdAt
          )
        );
      }

      if (
        sortBy ===
        "oldest"
      ) {
        return (
          getTimestamp(
            first.createdAt
          ) -
          getTimestamp(
            second.createdAt
          )
        );
      }

      return compareText(
        first.name,
        second.name
      );
    }
  );
}

function compareText(
  first,
  second
) {
  return String(
    first ||
    ""
  ).localeCompare(
    String(
      second ||
      ""
    ),
    undefined,
    {
      sensitivity:
        "base",
    }
  );
}

function getTimestamp(
  value
) {
  if (
    !value
  ) {
    return 0;
  }

  if (
    typeof value.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  return 0;
}

export default Inventory;