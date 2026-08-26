import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  FolderOpen,
  Link2,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
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

import { db } from "../services/firebase";
import { WEDDING_ID } from "../config/wedding";
import { useAuth } from "../context/AuthContext";

const categories = [
  "Contracts",
  "Receipts",
  "Venue",
  "Photography",
  "Videography",
  "Catering",
  "Bar",
  "Decor",
  "Flowers",
  "Stationery",
  "Wedding Party",
  "Ceremony",
  "Reception",
  "Honeymoon",
  "Other",
];

const emptyFile = {
  name: "",
  category: "Other",
  fileUrl: "",
  vendorId: "",
  notes: "",
};

function Files() {
  const { user } = useAuth();

  const [files, setFiles] =
    useState([]);

  const [vendors, setVendors] =
    useState([]);

  const [
    loadingFiles,
    setLoadingFiles,
  ] = useState(true);

  const [
    loadingVendors,
    setLoadingVendors,
  ] = useState(true);

  const [search, setSearch] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingFileId,
    setEditingFileId,
  ] = useState(null);

  const [
    fileForm,
    setFileForm,
  ] = useState(emptyFile);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [error, setError] =
    useState("");

  /*
   * LOAD FILES
   */

  useEffect(() => {
    const filesRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "files"
      );

    const unsubscribe =
      onSnapshot(
        filesRef,
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (fileDocument) => ({
                id:
                  fileDocument.id,

                ...fileDocument.data(),
              })
            );

          data.sort(
            compareFiles
          );

          setFiles(data);
          setLoadingFiles(false);
        },
        (firebaseError) => {
          console.error(
            "Error loading files:",
            firebaseError
          );

          setError(
            "We couldn't load your wedding files."
          );

          setLoadingFiles(false);
        }
      );

    return unsubscribe;
  }, []);

  /*
   * LOAD VENDORS
   */

  useEffect(() => {
    const vendorsRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "vendors"
      );

    const unsubscribe =
      onSnapshot(
        vendorsRef,
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (vendorDocument) => ({
                id:
                  vendorDocument.id,

                ...vendorDocument.data(),
              })
            );

          data.sort(
            (first, second) =>
              (
                first.name ||
                ""
              ).localeCompare(
                second.name ||
                ""
              )
          );

          setVendors(data);
          setLoadingVendors(false);
        },
        (firebaseError) => {
          console.error(
            "Error loading vendors for files:",
            firebaseError
          );

          setLoadingVendors(false);
        }
      );

    return unsubscribe;
  }, []);

  const vendorMap =
    useMemo(() => {
      return new Map(
        vendors.map(
          (vendor) => [
            vendor.id,
            vendor,
          ]
        )
      );
    }, [vendors]);

  /*
   * FILTERED FILES
   */

  const filteredFiles =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return files.filter(
        (file) => {
          const vendor =
            file.vendorId
              ? vendorMap.get(
                  file.vendorId
                )
              : null;

          const matchesSearch =
            !searchValue ||
            [
              file.name,
              file.category,
              file.notes,
              vendor?.name,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(searchValue);

          const matchesCategory =
            categoryFilter ===
              "all" ||
            file.category ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );
    }, [
      files,
      search,
      categoryFilter,
      vendorMap,
    ]);

  /*
   * CATEGORY SUMMARY
   */

  const categoryCounts =
    useMemo(() => {
      const map =
        new Map();

      files.forEach(
        (file) => {
          const category =
            file.category ||
            "Other";

          map.set(
            category,
            (
              map.get(
                category
              ) || 0
            ) + 1
          );
        }
      );

      return Array.from(
        map.entries()
      )
        .map(
          ([
            category,
            count,
          ]) => ({
            category,
            count,
          })
        )
        .sort(
          (first, second) =>
            second.count -
              first.count ||
            first.category.localeCompare(
              second.category
            )
        );
    }, [files]);

  const loading =
    loadingFiles ||
    loadingVendors;

  /*
   * ADD
   */

  const openAddFile =
    () => {
      setEditingFileId(
        null
      );

      setFileForm({
        ...emptyFile,
      });

      setError("");

      setShowModal(true);
    };

  /*
   * EDIT
   */

  const openEditFile = (
    file
  ) => {
    setEditingFileId(
      file.id
    );

    setFileForm({
      name:
        file.name || "",

      category:
        file.category ||
        "Other",

      fileUrl:
        file.fileUrl ||
        "",

      vendorId:
        file.vendorId ||
        "",

      notes:
        file.notes || "",
    });

    setError("");

    setShowModal(true);
  };

  const closeModal =
    () => {
      if (saving) {
        return;
      }

      setShowModal(false);

      setEditingFileId(
        null
      );

      setFileForm(
        emptyFile
      );

      setError("");
    };

  /*
   * FORM
   */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFileForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };

  /*
   * SAVE
   */

  const handleSave =
    async (event) => {
      event.preventDefault();

      if (
        !fileForm.name.trim()
      ) {
        setError(
          "Please enter a file name."
        );

        return;
      }

      if (
        !fileForm.fileUrl.trim()
      ) {
        setError(
          "Please enter a file link."
        );

        return;
      }

      const normalizedUrl =
        normalizeUrl(
          fileForm.fileUrl
        );

      if (
        !isValidUrl(
          normalizedUrl
        )
      ) {
        setError(
          "Please enter a valid file link."
        );

        return;
      }

      const selectedVendor =
        fileForm.vendorId
          ? vendorMap.get(
              fileForm.vendorId
            )
          : null;

      setSaving(true);
      setError("");

      try {
        const fileData = {
          name:
            fileForm.name.trim(),

          category:
            fileForm.category,

          fileUrl:
            normalizedUrl,

          vendorId:
            fileForm.vendorId ||
            null,

          vendorName:
            selectedVendor?.name ||
            "",

          notes:
            fileForm.notes.trim(),

          updatedAt:
            serverTimestamp(),

          updatedBy:
            user?.uid ||
            null,
        };

        if (
          editingFileId
        ) {
          await updateDoc(
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "files",
              editingFileId
            ),
            fileData
          );
        } else {
          await addDoc(
            collection(
              db,
              "weddings",
              WEDDING_ID,
              "files"
            ),
            {
              ...fileData,

              createdAt:
                serverTimestamp(),

              createdBy:
                user?.uid ||
                null,
            }
          );
        }

        setShowModal(false);

        setEditingFileId(
          null
        );

        setFileForm(
          emptyFile
        );
      } catch (firebaseError) {
        console.error(
          "Error saving file:",
          firebaseError
        );

        setError(
          "We couldn't save this file."
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * DELETE
   */

  const handleDelete =
    async (fileId) => {
      try {
        await deleteDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "files",
            fileId
          )
        );
      } catch (firebaseError) {
        console.error(
          "Error deleting file:",
          firebaseError
        );

        setError(
          "We couldn't delete this file."
        );
      }
    };

  return (
    <div className="page files-page">
      <div className="files-page-header">
        <div>
          <p className="page-eyebrow">
            Documents
          </p>

          <h1>
            Files
          </h1>

          <p className="page-description">
            Keep contracts, receipts, planning documents, and important
            wedding links organized in one place.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={
            openAddFile
          }
        >
          <Plus size={17} />
          Add File
        </button>
      </div>

      {error &&
        !showModal && (
          <div className="auth-error files-page-error">
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

      {loading ? (
        <div className="content-card files-loading">
          <LoaderCircle
            size={25}
            className="spinner"
          />

          <p>
            Loading files...
          </p>
        </div>
      ) : (
        <>
          <section className="files-summary">
            <div className="files-summary-main">
              <FolderOpen
                size={22}
              />

              <div>
                <span>
                  Total Files
                </span>

                <strong>
                  {files.length}
                </strong>
              </div>
            </div>

            {categoryCounts
              .slice(
                0,
                4
              )
              .map(
                (item) => (
                  <button
                    key={
                      item.category
                    }
                    type="button"
                    className={
                      categoryFilter ===
                      item.category
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setCategoryFilter(
                        categoryFilter ===
                          item.category
                          ? "all"
                          : item.category
                      )
                    }
                  >
                    <span>
                      {
                        item.category
                      }
                    </span>

                    <strong>
                      {
                        item.count
                      }
                    </strong>
                  </button>
                )
              )}
          </section>

          <section className="files-toolbar">
            <div className="files-search">
              <Search size={16} />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search files..."
              />
            </div>

            <div className="select-wrap files-category-filter">
              <select
                value={
                  categoryFilter
                }
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All Categories
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {category}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={15}
              />
            </div>
          </section>

          {files.length ===
            0 ? (
            <section className="content-card files-empty">
              <FileText
                size={42}
                strokeWidth={1.25}
              />

              <h2>
                No files yet
              </h2>

              <p>
                Add contracts, receipts, Google Drive files, PDFs, or
                other important wedding documents.
              </p>

              <button
                className="primary-button"
                onClick={
                  openAddFile
                }
              >
                <Plus
                  size={17}
                />
                Add First File
              </button>
            </section>
          ) : filteredFiles.length ===
            0 ? (
            <section className="content-card files-empty compact">
              <Search
                size={31}
                strokeWidth={1.25}
              />

              <h2>
                No matching files
              </h2>

              <p>
                Try changing your search or category filter.
              </p>
            </section>
          ) : (
            <section className="files-grid">
              {filteredFiles.map(
                (file) => (
                  <FileCard
                    key={
                      file.id
                    }
                    file={
                      file
                    }
                    vendorMap={
                      vendorMap
                    }
                    onEdit={() =>
                      openEditFile(
                        file
                      )
                    }
                    onDelete={() =>
                      handleDelete(
                        file.id
                      )
                    }
                  />
                )
              )}
            </section>
          )}
        </>
      )}

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeModal
          }
        >
          <div
            className="task-modal files-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="task-modal-header">
              <div>
                <p className="card-eyebrow">
                  {editingFileId
                    ? "Edit"
                    : "New File"}
                </p>

                <h2>
                  {editingFileId
                    ? "Edit File"
                    : "Add File"}
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="task-form"
              onSubmit={
                handleSave
              }
            >
              <label className="form-field">
                <span>
                  File Name
                </span>

                <input
                  type="text"
                  name="name"
                  value={
                    fileForm.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Venue Contract"
                  autoFocus
                />
              </label>

              <div className="form-grid">
                <label className="form-field">
                  <span>
                    Category
                  </span>

                  <div className="select-wrap">
                    <select
                      name="category"
                      value={
                        fileForm.category
                      }
                      onChange={
                        handleChange
                      }
                    >
                      {categories.map(
                        (category) => (
                          <option
                            key={
                              category
                            }
                            value={
                              category
                            }
                          >
                            {
                              category
                            }
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown
                      size={15}
                    />
                  </div>
                </label>

                <label className="form-field">
                  <span>
                    Related Vendor
                  </span>

                  <div className="select-wrap">
                    <select
                      name="vendorId"
                      value={
                        fileForm.vendorId
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="">
                        No Vendor
                      </option>

                      {vendors.map(
                        (vendor) => (
                          <option
                            key={
                              vendor.id
                            }
                            value={
                              vendor.id
                            }
                          >
                            {vendor.name}
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown
                      size={15}
                    />
                  </div>
                </label>
              </div>

              <label className="form-field">
                <span>
                  File Link
                </span>

                <div className="files-link-input">
                  <Link2
                    size={15}
                  />

                  <input
                    type="text"
                    name="fileUrl"
                    value={
                      fileForm.fileUrl
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <small className="files-form-help">
                  Paste a Google Drive, OneDrive, Dropbox, PDF, or other
                  shared document link.
                </small>
              </label>

              <label className="form-field">
                <span>
                  Notes
                </span>

                <textarea
                  name="notes"
                  value={
                    fileForm.notes
                  }
                  onChange={
                    handleChange
                  }
                  rows="4"
                  placeholder="Signed copy, final version, payment receipt, printing notes..."
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
                    closeModal
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
                      <Check
                        size={17}
                      />

                      {editingFileId
                        ? "Save Changes"
                        : "Add File"}
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

function FileCard({
  file,
  vendorMap,
  onEdit,
  onDelete,
}) {
  const linkedVendor =
    file.vendorId
      ? vendorMap.get(
          file.vendorId
        )
      : null;

  const vendorName =
    linkedVendor?.name ||
    file.vendorName ||
    "";

  return (
    <article className="file-card">
      <div className="file-card-header">
        <div className="file-card-icon">
          <FileText
            size={20}
          />
        </div>

        <div className="file-card-actions">
          <button
            className="icon-button"
            onClick={
              onEdit
            }
            title="Edit file"
          >
            <Pencil
              size={15}
            />
          </button>

          <button
            className="icon-button danger"
            onClick={
              onDelete
            }
            title="Delete file"
          >
            <Trash2
              size={15}
            />
          </button>
        </div>
      </div>

      <span className="file-category">
        {file.category ||
          "Other"}
      </span>

      <h2>
        {file.name}
      </h2>

      {vendorName && (
        <p className="file-vendor">
          {vendorName}
        </p>
      )}

      {file.notes && (
        <p className="file-notes">
          {file.notes}
        </p>
      )}

      <a
        className="file-open-button"
        href={
          file.fileUrl
        }
        target="_blank"
        rel="noreferrer"
      >
        <ExternalLink
          size={14}
        />

        Open File
      </a>
    </article>
  );
}

function compareFiles(
  first,
  second
) {
  const categoryComparison =
    (
      first.category ||
      "Other"
    ).localeCompare(
      second.category ||
      "Other"
    );

  if (
    categoryComparison !==
    0
  ) {
    return categoryComparison;
  }

  return (
    first.name ||
    ""
  ).localeCompare(
    second.name ||
      ""
  );
}

function normalizeUrl(
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

function isValidUrl(
  value
) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

export default Files;