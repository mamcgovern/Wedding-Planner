import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  ExternalLink,
  FileCheck2,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
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

const vendorCategories = [
  "Venue",
  "Photography",
  "Videography",
  "Catering",
  "Bar",
  "DJ / Music",
  "Flowers",
  "Cake & Desserts",
  "Hair",
  "Makeup",
  "Attire",
  "Transportation",
  "Accommodations",
  "Rentals",
  "Decor",
  "Stationery",
  "Coordinator",
  "Officiant",
  "Entertainment",
  "Other",
];

const emptyVendor = {
  name: "",
  category: "Other",

  status: "researching",
  contractStatus: "none",

  contactName: "",
  email: "",
  phone: "",
  website: "",

  notes: "",
};

function Vendors() {
  const { user } = useAuth();

  const [vendors, setVendors] =
    useState([]);

  const [
    budgetItems,
    setBudgetItems,
  ] = useState([]);

  const [
    loadingVendors,
    setLoadingVendors,
  ] = useState(true);

  const [
    loadingBudget,
    setLoadingBudget,
  ] = useState(true);

  const [search, setSearch] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    showVendorModal,
    setShowVendorModal,
  ] = useState(false);

  const [
    editingVendorId,
    setEditingVendorId,
  ] = useState(null);

  const [
    vendorForm,
    setVendorForm,
  ] = useState(emptyVendor);

  const [
    savingVendor,
    setSavingVendor,
  ] = useState(false);

  const [error, setError] =
    useState("");

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
              (
                vendorDocument
              ) => ({
                id:
                  vendorDocument.id,

                ...vendorDocument.data(),
              })
            );

          data.sort(
            compareVendors
          );

          setVendors(data);

          setLoadingVendors(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading vendors:",
            firebaseError
          );

          setError(
            "We couldn't load your vendors."
          );

          setLoadingVendors(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const budgetRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "budgetItems"
      );

    const unsubscribe =
      onSnapshot(
        budgetRef,
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (
                budgetDocument
              ) => ({
                id:
                  budgetDocument.id,

                ...budgetDocument.data(),
              })
            );

          setBudgetItems(
            data
          );

          setLoadingBudget(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading budget items:",
            firebaseError
          );

          setError(
            "We couldn't load vendor budget information."
          );

          setLoadingBudget(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  const vendorBudgetMap =
    useMemo(() => {
      const map =
        new Map();

      budgetItems.forEach(
        (item) => {
          if (
            !item.vendorId
          ) {
            return;
          }

          if (
            !map.has(
              item.vendorId
            )
          ) {
            map.set(
              item.vendorId,
              []
            );
          }

          map
            .get(
              item.vendorId
            )
            .push(item);
        }
      );

      map.forEach(
        (items) => {
          items.sort(
            compareBudgetItems
          );
        }
      );

      return map;
    }, [budgetItems]);

  const filteredVendors =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return vendors.filter(
        (vendor) => {
          const linkedItems =
            vendorBudgetMap.get(
              vendor.id
            ) || [];

          const budgetSearchText =
            linkedItems
              .map(
                (item) =>
                  [
                    item.name,
                    item.paymentInstructions,
                  ]
                    .filter(Boolean)
                    .join(" ")
              )
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !searchValue ||
            (
              vendor.name ||
              ""
            )
              .toLowerCase()
              .includes(
                searchValue
              ) ||
            (
              vendor.contactName ||
              ""
            )
              .toLowerCase()
              .includes(
                searchValue
              ) ||
            (
              vendor.email ||
              ""
            )
              .toLowerCase()
              .includes(
                searchValue
              ) ||
            (
              vendor.category ||
              ""
            )
              .toLowerCase()
              .includes(
                searchValue
              ) ||
            budgetSearchText.includes(
              searchValue
            );

          const matchesCategory =
            categoryFilter ===
              "all" ||
            vendor.category ===
              categoryFilter;

          const matchesStatus =
            statusFilter ===
              "all" ||
            vendor.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
          );
        }
      );
    }, [
      vendors,
      vendorBudgetMap,
      search,
      categoryFilter,
      statusFilter,
    ]);

  const stats = useMemo(() => {
    const booked =
      vendors.filter(
        (vendor) =>
          vendor.status ===
          "booked"
      ).length;

    const contractSigned =
      vendors.filter(
        (vendor) =>
          vendor.contractStatus ===
          "signed"
      ).length;

    const linkedBudgetItems =
      budgetItems.filter(
        (item) =>
          item.vendorId &&
          vendors.some(
            (vendor) =>
              vendor.id ===
              item.vendorId
          )
      );

    const totalCost =
      linkedBudgetItems.reduce(
        (sum, item) =>
          sum +
          getBudgetItemCost(
            item
          ),
        0
      );

    const paid =
      linkedBudgetItems.reduce(
        (sum, item) =>
          sum +
          getNumber(
            item.amountPaid
          ),
        0
      );

    const remaining =
      linkedBudgetItems.reduce(
        (sum, item) => {
          const cost =
            getBudgetItemCost(
              item
            );

          const paidAmount =
            getNumber(
              item.amountPaid
            );

          return (
            sum +
            Math.max(
              0,
              cost -
                paidAmount
            )
          );
        },
        0
      );

    return {
      total:
        vendors.length,

      booked,

      contractSigned,

      totalCost,

      paid,

      remaining,
    };
  }, [
    vendors,
    budgetItems,
  ]);

  const loading =
    loadingVendors ||
    loadingBudget;

  const openAddVendor =
    () => {
      setEditingVendorId(
        null
      );

      setVendorForm({
        ...emptyVendor,
      });

      setError("");

      setShowVendorModal(
        true
      );
    };

  const openEditVendor = (
    vendor
  ) => {
    setEditingVendorId(
      vendor.id
    );

    setVendorForm({
      name:
        vendor.name || "",

      category:
        vendor.category ||
        "Other",

      status:
        vendor.status ||
        "researching",

      contractStatus:
        vendor.contractStatus ||
        "none",

      contactName:
        vendor.contactName ||
        "",

      email:
        vendor.email || "",

      phone:
        vendor.phone || "",

      website:
        vendor.website || "",

      notes:
        vendor.notes || "",
    });

    setError("");

    setShowVendorModal(
      true
    );
  };

  const closeVendorModal =
    () => {
      if (savingVendor) {
        return;
      }

      setShowVendorModal(
        false
      );

      setEditingVendorId(
        null
      );

      setVendorForm(
        emptyVendor
      );

      setError("");
    };

  const handleVendorChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setVendorForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };

  const handleSaveVendor =
    async (event) => {
      event.preventDefault();

      if (
        !vendorForm.name.trim()
      ) {
        setError(
          "Please enter the vendor name."
        );

        return;
      }

      setSavingVendor(true);
      setError("");

      try {
        const vendorData = {
          name:
            vendorForm.name.trim(),

          category:
            vendorForm.category,

          status:
            vendorForm.status,

          contractStatus:
            vendorForm.contractStatus,

          contactName:
            vendorForm.contactName.trim(),

          email:
            vendorForm.email.trim(),

          phone:
            vendorForm.phone.trim(),

          website:
            normalizeWebsite(
              vendorForm.website
            ),

          notes:
            vendorForm.notes.trim(),

          updatedAt:
            serverTimestamp(),

          updatedBy:
            user?.uid ||
            null,
        };

        if (
          editingVendorId
        ) {
          await updateDoc(
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "vendors",
              editingVendorId
            ),
            vendorData
          );
        } else {
          await addDoc(
            collection(
              db,
              "weddings",
              WEDDING_ID,
              "vendors"
            ),
            {
              ...vendorData,

              createdAt:
                serverTimestamp(),

              createdBy:
                user?.uid ||
                null,
            }
          );
        }

        setShowVendorModal(
          false
        );

        setEditingVendorId(
          null
        );

        setVendorForm(
          emptyVendor
        );
      } catch (firebaseError) {
        console.error(
          "Error saving vendor:",
          firebaseError
        );

        setError(
          "We couldn't save this vendor."
        );
      } finally {
        setSavingVendor(
          false
        );
      }
    };

  const handleDeleteVendor =
    async (vendorId) => {
      try {
        await deleteDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "vendors",
            vendorId
          )
        );
      } catch (firebaseError) {
        console.error(
          "Error deleting vendor:",
          firebaseError
        );

        setError(
          "We couldn't delete this vendor."
        );
      }
    };

  return (
    <div className="page vendors-page">
      <div className="vendors-page-header">
        <div>
          <p className="page-eyebrow">
            Planning
          </p>

          <h1>
            Vendors
          </h1>

          <p className="page-description">
            Keep contacts, contracts, and vendor details together while
            financial information stays synced with your budget.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={
            openAddVendor
          }
        >
          <Plus size={17} />
          Add Vendor
        </button>
      </div>

      <section className="vendor-stats-grid">
        <VendorStat
          label="Total Vendors"
          value={stats.total}
        />

        <VendorStat
          label="Booked"
          value={stats.booked}
          type="booked"
        />

        <VendorStat
          label="Contracts Signed"
          value={
            stats.contractSigned
          }
          type="contract"
        />

        <VendorStat
          label="Still Owed"
          value={formatCurrency(
            stats.remaining
          )}
          type="owed"
        />
      </section>

      <section className="vendor-money-summary">
        <div>
          <span>
            Vendor Costs
          </span>

          <strong>
            {formatCurrency(
              stats.totalCost
            )}
          </strong>
        </div>

        <div>
          <span>
            Paid
          </span>

          <strong>
            {formatCurrency(
              stats.paid
            )}
          </strong>
        </div>

        <div>
          <span>
            Remaining
          </span>

          <strong>
            {formatCurrency(
              stats.remaining
            )}
          </strong>
        </div>
      </section>

      <section className="vendor-toolbar">
        <div className="vendor-search">
          <Search size={17} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search vendors or linked expenses..."
          />
        </div>

        <div className="vendor-toolbar-filters">
          <div className="select-wrap">
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

              {vendorCategories.map(
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

          <div className="select-wrap">
            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Statuses
              </option>

              <option value="researching">
                Researching
              </option>

              <option value="contacted">
                Contacted
              </option>

              <option value="booked">
                Booked
              </option>

              <option value="completed">
                Completed
              </option>
            </select>

            <ChevronDown
              size={15}
            />
          </div>
        </div>
      </section>

      {error &&
        !showVendorModal && (
          <div className="auth-error vendor-page-error">
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
        <div className="content-card vendor-loading">
          <LoaderCircle
            size={25}
            className="spinner"
          />

          <p>
            Loading vendors...
          </p>
        </div>
      ) : vendors.length ===
        0 ? (
        <section className="content-card vendor-empty">
          <Building2
            size={42}
            strokeWidth={1.3}
          />

          <h2>
            No vendors yet
          </h2>

          <p>
            Add your booked vendors and any businesses you're still
            considering.
          </p>

          <button
            className="primary-button"
            onClick={
              openAddVendor
            }
          >
            <Plus size={17} />
            Add First Vendor
          </button>
        </section>
      ) : filteredVendors.length ===
        0 ? (
        <section className="content-card vendor-empty compact">
          <Search
            size={30}
            strokeWidth={1.3}
          />

          <h2>
            No matching vendors
          </h2>

          <p>
            Try changing your search or filters.
          </p>
        </section>
      ) : (
        <section className="vendor-grid">
          {filteredVendors.map(
            (vendor) => (
              <VendorCard
                key={
                  vendor.id
                }
                vendor={
                  vendor
                }
                budgetItems={
                  vendorBudgetMap.get(
                    vendor.id
                  ) || []
                }
                onEdit={() =>
                  openEditVendor(
                    vendor
                  )
                }
                onDelete={() =>
                  handleDeleteVendor(
                    vendor.id
                  )
                }
              />
            )
          )}
        </section>
      )}

      {showVendorModal && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeVendorModal
          }
        >
          <div
            className="task-modal vendor-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="task-modal-header">
              <div>
                <p className="card-eyebrow">
                  {editingVendorId
                    ? "Edit"
                    : "New Vendor"}
                </p>

                <h2>
                  {editingVendorId
                    ? "Edit Vendor"
                    : "Add Vendor"}
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={
                  closeVendorModal
                }
                disabled={
                  savingVendor
                }
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="task-form"
              onSubmit={
                handleSaveVendor
              }
            >
              <label className="form-field">
                <span>
                  Vendor Name
                </span>

                <input
                  type="text"
                  name="name"
                  value={
                    vendorForm.name
                  }
                  onChange={
                    handleVendorChange
                  }
                  placeholder="Vendor or business name"
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
                        vendorForm.category
                      }
                      onChange={
                        handleVendorChange
                      }
                    >
                      {vendorCategories.map(
                        (
                          category
                        ) => (
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
                    Status
                  </span>

                  <div className="select-wrap">
                    <select
                      name="status"
                      value={
                        vendorForm.status
                      }
                      onChange={
                        handleVendorChange
                      }
                    >
                      <option value="researching">
                        Researching
                      </option>

                      <option value="contacted">
                        Contacted
                      </option>

                      <option value="booked">
                        Booked
                      </option>

                      <option value="completed">
                        Completed
                      </option>
                    </select>

                    <ChevronDown
                      size={15}
                    />
                  </div>
                </label>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>
                    Contract
                  </span>

                  <div className="select-wrap">
                    <select
                      name="contractStatus"
                      value={
                        vendorForm.contractStatus
                      }
                      onChange={
                        handleVendorChange
                      }
                    >
                      <option value="none">
                        No Contract
                      </option>

                      <option value="requested">
                        Requested
                      </option>

                      <option value="received">
                        Received
                      </option>

                      <option value="signed">
                        Signed
                      </option>
                    </select>

                    <ChevronDown
                      size={15}
                    />
                  </div>
                </label>

                <label className="form-field">
                  <span>
                    Contact Person
                  </span>

                  <input
                    type="text"
                    name="contactName"
                    value={
                      vendorForm.contactName
                    }
                    onChange={
                      handleVendorChange
                    }
                    placeholder="Contact name"
                  />
                </label>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>
                    Email
                  </span>

                  <input
                    type="email"
                    name="email"
                    value={
                      vendorForm.email
                    }
                    onChange={
                      handleVendorChange
                    }
                    placeholder="email@example.com"
                  />
                </label>

                <label className="form-field">
                  <span>
                    Phone
                  </span>

                  <input
                    type="tel"
                    name="phone"
                    value={
                      vendorForm.phone
                    }
                    onChange={
                      handleVendorChange
                    }
                    placeholder="555-555-5555"
                  />
                </label>
              </div>

              <label className="form-field">
                <span>
                  Website
                </span>

                <input
                  type="text"
                  name="website"
                  value={
                    vendorForm.website
                  }
                  onChange={
                    handleVendorChange
                  }
                  placeholder="https://..."
                />
              </label>

              <div className="vendor-budget-form-note">
                <CircleDollarSign
                  size={17}
                />

                <div>
                  <strong>
                    Financial details are managed in Budget
                  </strong>

                  <span>
                    Link expenses to this vendor from the Budget page.
                    Payment instructions will also appear here automatically.
                  </span>
                </div>
              </div>

              <label className="form-field">
                <span>
                  Notes
                </span>

                <textarea
                  name="notes"
                  value={
                    vendorForm.notes
                  }
                  onChange={
                    handleVendorChange
                  }
                  rows="4"
                  placeholder="Package details, arrival time, questions, contract notes..."
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
                    closeVendorModal
                  }
                  disabled={
                    savingVendor
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    savingVendor
                  }
                >
                  {savingVendor ? (
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

                      {editingVendorId
                        ? "Save Changes"
                        : "Add Vendor"}
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

function VendorStat({
  label,
  value,
  type = "",
}) {
  return (
    <div
      className={`vendor-stat-card ${
        type
          ? `vendor-stat-${type}`
          : ""
      }`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function VendorCard({
  vendor,
  budgetItems,
  onEdit,
  onDelete,
}) {
  const financials =
    useMemo(() => {
      const totalCost =
        budgetItems.reduce(
          (sum, item) =>
            sum +
            getBudgetItemCost(
              item
            ),
          0
        );

      const paid =
        budgetItems.reduce(
          (sum, item) =>
            sum +
            getNumber(
              item.amountPaid
            ),
          0
        );

      const remaining =
        budgetItems.reduce(
          (sum, item) => {
            const cost =
              getBudgetItemCost(
                item
              );

            const paidAmount =
              getNumber(
                item.amountPaid
              );

            return (
              sum +
              Math.max(
                0,
                cost -
                  paidAmount
              )
            );
          },
          0
        );

      const paymentPercentage =
        totalCost > 0
          ? Math.min(
              100,
              Math.round(
                (paid /
                  totalCost) *
                  100
              )
            )
          : 0;

      const dueItems =
        budgetItems
          .filter(
            (item) =>
              item.dueDate &&
              Math.max(
                0,
                getBudgetItemCost(
                  item
                ) -
                  getNumber(
                    item.amountPaid
                  )
              ) > 0
          )
          .sort(
            compareBudgetItems
          );

      const nextDueItem =
        dueItems[0] ||
        null;

      return {
        totalCost,
        paid,
        remaining,
        paymentPercentage,
        nextDueItem,
      };
    }, [budgetItems]);

  return (
    <article className="vendor-card">
      <div className="vendor-card-header">
        <div className="vendor-card-heading">
          <div className="vendor-icon">
            <Building2
              size={19}
            />
          </div>

          <div>
            <span className="vendor-category">
              {vendor.category ||
                "Other"}
            </span>

            <h2>
              {vendor.name}
            </h2>
          </div>
        </div>

        <div className="vendor-card-actions">
          <button
            className="icon-button"
            onClick={
              onEdit
            }
            title="Edit vendor"
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
            title="Delete vendor"
          >
            <Trash2
              size={15}
            />
          </button>
        </div>
      </div>

      <div className="vendor-badges">
        <VendorStatusBadge
          status={
            vendor.status
          }
        />

        <ContractBadge
          status={
            vendor.contractStatus
          }
        />
      </div>

      {(vendor.contactName ||
        vendor.email ||
        vendor.phone ||
        vendor.website) && (
        <div className="vendor-contact-list">
          {vendor.contactName && (
            <div className="vendor-contact-person">
              {vendor.contactName}
            </div>
          )}

          {vendor.email && (
            <a
              href={`mailto:${vendor.email}`}
            >
              <Mail size={14} />
              {vendor.email}
            </a>
          )}

          {vendor.phone && (
            <a
              href={`tel:${vendor.phone}`}
            >
              <Phone size={14} />
              {vendor.phone}
            </a>
          )}

          {vendor.website && (
            <a
              href={
                normalizeWebsite(
                  vendor.website
                )
              }
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink
                size={14}
              />
              Website
            </a>
          )}
        </div>
      )}

      {budgetItems.length >
      0 ? (
        <div className="vendor-budget-section">
          <div className="vendor-budget-section-header">
            <div>
              <p className="card-eyebrow">
                Budget
              </p>

              <h3>
                Linked Expenses
              </h3>
            </div>

            <span className="vendor-budget-count">
              {budgetItems.length}
            </span>
          </div>

          <div className="vendor-payment-heading">
            <span>
              Payment Progress
            </span>

            <strong>
              {
                financials.paymentPercentage
              }
              %
            </strong>
          </div>

          <div className="vendor-payment-bar">
            <div
              style={{
                width: `${financials.paymentPercentage}%`,
              }}
            />
          </div>

          <div className="vendor-payment-values">
            <div>
              <span>
                Cost
              </span>

              <strong>
                {formatCurrency(
                  financials.totalCost
                )}
              </strong>
            </div>

            <div>
              <span>
                Paid
              </span>

              <strong>
                {formatCurrency(
                  financials.paid
                )}
              </strong>
            </div>

            <div>
              <span>
                Remaining
              </span>

              <strong>
                {formatCurrency(
                  financials.remaining
                )}
              </strong>
            </div>
          </div>

          <div className="vendor-budget-items">
            {budgetItems.map(
              (item) => (
                <VendorBudgetItem
                  key={
                    item.id
                  }
                  item={
                    item
                  }
                />
              )
            )}
          </div>

          {financials.nextDueItem && (
            <div className="vendor-due-date">
              <CalendarDays
                size={15}
              />

              <span>
                Next payment due{" "}
                <strong>
                  {formatDate(
                    financials
                      .nextDueItem
                      .dueDate
                  )}
                </strong>
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="vendor-no-budget">
          <CircleDollarSign
            size={17}
          />

          <div>
            <strong>
              No linked expenses
            </strong>

            <span>
              Link a budget item to this vendor from the Budget page.
            </span>
          </div>
        </div>
      )}

      {vendor.notes && (
        <p className="vendor-notes">
          {vendor.notes}
        </p>
      )}
    </article>
  );
}

function VendorBudgetItem({
  item,
}) {
  const cost =
    getBudgetItemCost(
      item
    );

  const paid =
    getNumber(
      item.amountPaid
    );

  const remaining =
    Math.max(
      0,
      cost - paid
    );

  const costType =
    getBudgetItemCostType(
      item
    );

  return (
    <div className="vendor-budget-item">
      <div className="vendor-budget-item-main">
        <div className="vendor-budget-item-title">
          <strong>
            {item.name}
          </strong>

          {costType ===
            "estimated" && (
            <span className="vendor-estimate-badge">
              Estimate
            </span>
          )}
        </div>

        <div className="vendor-budget-item-meta">
          {item.dueDate && (
            <span>
              Due{" "}
              {formatDate(
                item.dueDate
              )}
            </span>
          )}

          <BudgetPaymentStatus
            item={item}
          />
        </div>

        {item.paymentInstructions && (
          <div className="vendor-payment-instructions">
            <strong>
              Pay via:
            </strong>{" "}
            {item.paymentInstructions}
          </div>
        )}
      </div>

      <div className="vendor-budget-item-money">
        <strong>
          {formatCurrency(
            cost
          )}
        </strong>

        {remaining > 0 ? (
          <span>
            {formatCurrency(
              remaining
            )}{" "}
            left
          </span>
        ) : (
          <span className="paid">
            Paid
          </span>
        )}
      </div>
    </div>
  );
}

function BudgetPaymentStatus({
  item,
}) {
  const cost =
    getBudgetItemCost(
      item
    );

  const paid =
    getNumber(
      item.amountPaid
    );

  let status =
    "unpaid";

  let label =
    "Unpaid";

  if (
    cost > 0 &&
    paid >= cost
  ) {
    status =
      "paid";

    label =
      "Paid";
  } else if (
    paid > 0
  ) {
    status =
      "partial";

    label =
      "Partially Paid";
  }

  return (
    <span
      className={`vendor-payment-status vendor-payment-status-${status}`}
    >
      {label}
    </span>
  );
}

function VendorStatusBadge({
  status,
}) {
  const labels = {
    researching:
      "Researching",

    contacted:
      "Contacted",

    booked:
      "Booked",

    completed:
      "Completed",
  };

  return (
    <span
      className={`vendor-status vendor-status-${
        status ||
        "researching"
      }`}
    >
      {labels[status] ||
        "Researching"}
    </span>
  );
}

function ContractBadge({
  status,
}) {
  const labels = {
    none:
      "No Contract",

    requested:
      "Contract Requested",

    received:
      "Contract Received",

    signed:
      "Contract Signed",
  };

  return (
    <span
      className={`vendor-contract vendor-contract-${
        status || "none"
      }`}
    >
      <FileCheck2
        size={12}
      />

      {labels[status] ||
        "No Contract"}
    </span>
  );
}

function getNumber(
  value
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

function getBudgetItemCost(
  item
) {
  if (
    item.cost !==
      undefined &&
    item.cost !== null
  ) {
    return getNumber(
      item.cost
    );
  }

  const oldActual =
    getNumber(
      item.actualCost
    );

  if (
    oldActual > 0
  ) {
    return oldActual;
  }

  return getNumber(
    item.estimatedCost
  );
}

function getBudgetItemCostType(
  item
) {
  if (
    item.costType ===
      "estimated" ||
    item.costType ===
      "actual"
  ) {
    return item.costType;
  }

  if (
    getNumber(
      item.actualCost
    ) > 0
  ) {
    return "actual";
  }

  if (
    getNumber(
      item.estimatedCost
    ) > 0
  ) {
    return "estimated";
  }

  return "actual";
}

function formatCurrency(
  amount
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits:
        0,
    }
  ).format(
    getNumber(
      amount
    )
  );
}

function formatDate(
  dateString
) {
  if (!dateString) {
    return "";
  }

  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(date);
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

function compareVendors(
  first,
  second
) {
  const firstCategory =
    first.category ||
    "Other";

  const secondCategory =
    second.category ||
    "Other";

  const categoryComparison =
    firstCategory.localeCompare(
      secondCategory
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

function compareBudgetItems(
  first,
  second
) {
  if (
    first.dueDate &&
    second.dueDate
  ) {
    const comparison =
      first.dueDate.localeCompare(
        second.dueDate
      );

    if (
      comparison !==
      0
    ) {
      return comparison;
    }
  }

  if (
    first.dueDate &&
    !second.dueDate
  ) {
    return -1;
  }

  if (
    !first.dueDate &&
    second.dueDate
  ) {
    return 1;
  }

  return (
    first.name ||
    ""
  ).localeCompare(
    second.name ||
      ""
  );
}

export default Vendors;