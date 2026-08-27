import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  DollarSign,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
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

const categories = [
  "Venue",
  "Photography",
  "Videography",
  "Catering",
  "Bar",
  "Attire",
  "Beauty",
  "Flowers",
  "Decor",
  "Music",
  "Cake & Desserts",
  "Stationery",
  "Transportation",
  "Accommodations",
  "Gifts",
  "Wedding Party",
  "Honeymoon",
  "Other",
];

const emptyBudgetItem = {
  name: "",
  category: "Other",

  cost: "",
  costType: "actual",

  amountPaid: "",

  vendorId: "",

  dueDate: "",

  paymentInstructions: "",

  status: "not-booked",

  notes: "",
};

function Budget() {
  const {
    user,
  } = useAuth();

  const [
    items,
    setItems,
  ] = useState([]);

  const [
    vendors,
    setVendors,
  ] = useState([]);

  const [
    totalBudget,
    setTotalBudget,
  ] = useState(0);

  const [
    budgetInput,
    setBudgetInput,
  ] = useState("");

  const [
    editingBudget,
    setEditingBudget,
  ] = useState(false);

  const [
    savingBudget,
    setSavingBudget,
  ] = useState(false);

  const [
    loadingItems,
    setLoadingItems,
  ] = useState(true);

  const [
    loadingBudget,
    setLoadingBudget,
  ] = useState(true);

  const [
    loadingVendors,
    setLoadingVendors,
  ] = useState(true);

  const [
    showItemModal,
    setShowItemModal,
  ] = useState(false);

  const [
    editingItemId,
    setEditingItemId,
  ] = useState(null);

  const [
    itemForm,
    setItemForm,
  ] = useState(
    emptyBudgetItem
  );

  const [
    savingItem,
    setSavingItem,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * LOAD PRIVATE BUDGET SETTINGS
   */

  useEffect(() => {
    const budgetRef =
      doc(
        db,
        "weddings",
        WEDDING_ID,
        "private",
        "budget"
      );

    const unsubscribe =
      onSnapshot(
        budgetRef,
        (snapshot) => {
          if (
            snapshot.exists()
          ) {
            const data =
              snapshot.data();

            const savedBudget =
              Number(
                data.totalBudget ||
                0
              );

            setTotalBudget(
              savedBudget
            );

            setBudgetInput(
              savedBudget
                ? String(
                    savedBudget
                  )
                : ""
            );
          } else {
            setTotalBudget(
              0
            );

            setBudgetInput(
              ""
            );
          }

          setLoadingBudget(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading wedding budget:",
            firebaseError
          );

          setError(
            "We couldn't load the wedding budget."
          );

          setLoadingBudget(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * LOAD BUDGET ITEMS
   */

  useEffect(() => {
    const itemsRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "budgetItems"
      );

    const unsubscribe =
      onSnapshot(
        itemsRef,
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (
                itemDocument
              ) => ({
                id:
                  itemDocument.id,

                ...itemDocument.data(),
              })
            );

          data.sort(
            compareBudgetItems
          );

          setItems(
            data
          );

          setLoadingItems(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading budget items:",
            firebaseError
          );

          setError(
            "We couldn't load the budget items."
          );

          setLoadingItems(
            false
          );
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
              (
                vendorDocument
              ) => ({
                id:
                  vendorDocument.id,

                ...vendorDocument.data(),
              })
            );

          data.sort(
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

          setVendors(
            data
          );

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
            "We couldn't load the vendors."
          );

          setLoadingVendors(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * VENDOR LOOKUP
   */

  const vendorMap =
    useMemo(
      () =>
        new Map(
          vendors.map(
            (vendor) => [
              vendor.id,
              vendor,
            ]
          )
        ),
      [
        vendors,
      ]
    );

  /*
   * TOTALS
   */

  const totals =
    useMemo(
      () => {
        const totalCost =
          items.reduce(
            (
              sum,
              item
            ) =>
              sum +
              getBudgetItemCost(
                item
              ),
            0
          );

        const paid =
          items.reduce(
            (
              sum,
              item
            ) =>
              sum +
              getNumber(
                item.amountPaid
              ),
            0
          );

        const owed =
          items.reduce(
            (
              sum,
              item
            ) => {
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

        const estimatedTotal =
          items
            .filter(
              (item) =>
                getBudgetItemCostType(
                  item
                ) ===
                "estimated"
            )
            .reduce(
              (
                sum,
                item
              ) =>
                sum +
                getBudgetItemCost(
                  item
                ),
              0
            );

        const estimatedCount =
          items.filter(
            (item) =>
              getBudgetItemCostType(
                item
              ) ===
              "estimated"
          ).length;

        const budgetLeft =
          totalBudget -
          totalCost;

        return {
          totalCost,
          paid,
          owed,
          estimatedTotal,
          estimatedCount,
          budgetLeft,
        };
      },
      [
        items,
        totalBudget,
      ]
    );

  /*
   * CATEGORY BREAKDOWN
   */

  const categorySummaries =
    useMemo(
      () => {
        const map =
          new Map();

        items.forEach(
          (item) => {
            const category =
              item.category ||
              "Other";

            if (
              !map.has(
                category
              )
            ) {
              map.set(
                category,
                {
                  category,
                  items: [],
                  cost: 0,
                  paid: 0,
                  estimatedCount: 0,
                }
              );
            }

            const summary =
              map.get(
                category
              );

            summary.items.push(
              item
            );

            summary.cost +=
              getBudgetItemCost(
                item
              );

            summary.paid +=
              getNumber(
                item.amountPaid
              );

            if (
              getBudgetItemCostType(
                item
              ) ===
              "estimated"
            ) {
              summary.estimatedCount +=
                1;
            }
          }
        );

        return Array.from(
          map.values()
        ).sort(
          (first, second) => {
            const firstIndex =
              categories.indexOf(
                first.category
              );

            const secondIndex =
              categories.indexOf(
                second.category
              );

            if (
              firstIndex ===
                -1 &&
              secondIndex ===
                -1
            ) {
              return first.category.localeCompare(
                second.category
              );
            }

            if (
              firstIndex ===
              -1
            ) {
              return 1;
            }

            if (
              secondIndex ===
              -1
            ) {
              return -1;
            }

            return (
              firstIndex -
              secondIndex
            );
          }
        );
      },
      [
        items,
      ]
    );

  const loading =
    loadingItems ||
    loadingBudget ||
    loadingVendors;

  /*
   * SAVE OVERALL BUDGET
   */

  const handleSaveBudget =
    async () => {
      const parsed =
        getNumber(
          budgetInput
        );

      if (
        parsed <
        0
      ) {
        setError(
          "The wedding budget cannot be negative."
        );

        return;
      }

      setSavingBudget(
        true
      );

      setError(
        ""
      );

      try {
        await setDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "private",
            "budget"
          ),
          {
            totalBudget:
              parsed,

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
        );

        setEditingBudget(
          false
        );
      } catch (firebaseError) {
        console.error(
          "Error saving total budget:",
          firebaseError
        );

        setError(
          "We couldn't save the wedding budget."
        );
      } finally {
        setSavingBudget(
          false
        );
      }
    };

  /*
   * ADD ITEM
   */

  const openAddItem =
    () => {
      setEditingItemId(
        null
      );

      setItemForm({
        ...emptyBudgetItem,
      });

      setError(
        ""
      );

      setShowItemModal(
        true
      );
    };

  /*
   * EDIT ITEM
   */

  const openEditItem =
    (item) => {
      setEditingItemId(
        item.id
      );

      setItemForm({
        name:
          item.name ||
          "",

        category:
          item.category ||
          "Other",

        cost:
          getBudgetItemCost(
            item
          ) || "",

        costType:
          getBudgetItemCostType(
            item
          ),

        amountPaid:
          item.amountPaid ??
          "",

        vendorId:
          item.vendorId ||
          "",

        dueDate:
          item.dueDate ||
          "",

        paymentInstructions:
          item.paymentInstructions ||
          "",

        status:
          item.status ||
          "not-booked",

        notes:
          item.notes ||
          "",
      });

      setError(
        ""
      );

      setShowItemModal(
        true
      );
    };

  const closeItemModal =
    () => {
      if (
        savingItem
      ) {
        return;
      }

      setShowItemModal(
        false
      );

      setEditingItemId(
        null
      );

      setItemForm(
        emptyBudgetItem
      );

      setError(
        ""
      );
    };

  /*
   * FORM CHANGES
   */

  const handleItemChange =
    (event) => {
      const {
        name,
        value,
      } =
        event.target;

      setItemForm(
        (current) => {
          const updated = {
            ...current,
            [name]:
              value,
          };

          if (
            [
              "cost",
              "amountPaid",
            ].includes(
              name
            )
          ) {
            const cost =
              getNumber(
                name ===
                  "cost"
                  ? value
                  : updated.cost
              );

            const paid =
              getNumber(
                name ===
                  "amountPaid"
                  ? value
                  : updated.amountPaid
              );

            if (
              current.status !==
              "not-booked"
            ) {
              if (
                cost >
                  0 &&
                paid >=
                  cost
              ) {
                updated.status =
                  "paid";
              } else if (
                paid >
                0
              ) {
                updated.status =
                  "partially-paid";
              }
            }
          }

          return updated;
        }
      );
    };

  /*
   * SAVE ITEM
   */

  const handleSaveItem =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        !itemForm.name.trim()
      ) {
        setError(
          "Please enter a budget item name."
        );

        return;
      }

      const cost =
        getNumber(
          itemForm.cost
        );

      const amountPaid =
        getNumber(
          itemForm.amountPaid
        );

      if (
        cost <
          0 ||
        amountPaid <
          0
      ) {
        setError(
          "Budget amounts cannot be negative."
        );

        return;
      }

      const selectedVendor =
        itemForm.vendorId
          ? vendorMap.get(
              itemForm.vendorId
            )
          : null;

      let status =
        itemForm.status;

      if (
        status !==
        "not-booked"
      ) {
        if (
          cost >
            0 &&
          amountPaid >=
            cost
        ) {
          status =
            "paid";
        } else if (
          amountPaid >
          0
        ) {
          status =
            "partially-paid";
        }
      }

      setSavingItem(
        true
      );

      setError(
        ""
      );

      try {
        const itemData = {
          name:
            itemForm.name.trim(),

          category:
            itemForm.category,

          cost,

          costType:
            itemForm.costType,

          amountPaid,

          vendorId:
            itemForm.vendorId ||
            null,

          vendorName:
            selectedVendor?.name ||
            "",

          dueDate:
            itemForm.dueDate,

          paymentInstructions:
            itemForm.paymentInstructions.trim(),

          status,

          notes:
            itemForm.notes.trim(),

          updatedAt:
            serverTimestamp(),

          updatedBy:
            user?.uid ||
            null,
        };

        if (
          editingItemId
        ) {
          await updateDoc(
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "budgetItems",
              editingItemId
            ),
            itemData
          );
        } else {
          await addDoc(
            collection(
              db,
              "weddings",
              WEDDING_ID,
              "budgetItems"
            ),
            {
              ...itemData,

              createdAt:
                serverTimestamp(),

              createdBy:
                user?.uid ||
                null,
            }
          );
        }

        setShowItemModal(
          false
        );

        setEditingItemId(
          null
        );

        setItemForm(
          emptyBudgetItem
        );
      } catch (firebaseError) {
        console.error(
          "Error saving budget item:",
          firebaseError
        );

        setError(
          "We couldn't save this budget item."
        );
      } finally {
        setSavingItem(
          false
        );
      }
    };

  /*
   * DELETE ITEM
   */

  const handleDeleteItem =
    async (
      item
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${item.name}" from the budget?`
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
            "budgetItems",
            item.id
          )
        );
      } catch (firebaseError) {
        console.error(
          "Error deleting budget item:",
          firebaseError
        );

        setError(
          "We couldn't delete this budget item."
        );
      }
    };

  return (
    <main className="page budget-page">
      <div className="budget-page-header">
        <div>
          <p className="page-eyebrow">
            Finances
          </p>

          <h1 className="page-title">
            Wedding Budget
          </h1>

          <p className="page-description">
            Track wedding costs, payments, balances,
            vendors, and any items that are still
            estimated.
          </p>
        </div>

        <button
          type="button"
          className="primary-button budget-add-button"
          onClick={
            openAddItem
          }
        >
          <Plus
            size={17}
          />

          Add Budget Item
        </button>
      </div>

      {error &&
        !showItemModal && (
          <div className="budget-page-error">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError(
                  ""
                )
              }
            >
              <X
                size={15}
              />
            </button>
          </div>
        )}

      {loading ? (
        <div className="content-card budget-loading">
          <LoaderCircle
            size={25}
            className="spinner"
          />

          <p>
            Loading budget...
          </p>
        </div>
      ) : (
        <>
          <section className="budget-overview-card">
            <div className="budget-overview-main">
              <div className="budget-overview-total">
                <p className="card-eyebrow">
                  Total Wedding Budget
                </p>

                {editingBudget ? (
                  <div className="budget-edit-row">
                    <div className="budget-input-wrap">
                      <DollarSign
                        size={19}
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          budgetInput
                        }
                        onChange={(
                          event
                        ) =>
                          setBudgetInput(
                            event.target.value
                          )
                        }
                        autoFocus
                      />
                    </div>

                    <button
                      type="button"
                      className="primary-button compact"
                      onClick={
                        handleSaveBudget
                      }
                      disabled={
                        savingBudget
                      }
                    >
                      {savingBudget ? (
                        <LoaderCircle
                          size={16}
                          className="spinner"
                        />
                      ) : (
                        <Save
                          size={16}
                        />
                      )}

                      Save
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => {
                        setBudgetInput(
                          totalBudget
                            ? String(
                                totalBudget
                              )
                            : ""
                        );

                        setEditingBudget(
                          false
                        );
                      }}
                      aria-label="Cancel budget edit"
                    >
                      <X
                        size={17}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="budget-total-display">
                    <strong>
                      {formatCurrency(
                        totalBudget
                      )}
                    </strong>

                    <button
                      type="button"
                      className="icon-button"
                      onClick={() =>
                        setEditingBudget(
                          true
                        )
                      }
                      title="Edit total budget"
                    >
                      <Pencil
                        size={16}
                      />
                    </button>
                  </div>
                )}
              </div>

              <div className="budget-overview-progress">
                <div className="budget-progress-labels">
                  <span>
                    Current cost
                  </span>

                  <strong>
                    {getBudgetPercentage(
                      totals.totalCost,
                      totalBudget
                    )}
                    %
                  </strong>
                </div>

                <div className="budget-progress-track">
                  <div
                    className={
                      totals.totalCost >
                        totalBudget &&
                      totalBudget >
                        0
                        ? "over-budget"
                        : ""
                    }
                    style={{
                      width: `${Math.min(
                        100,
                        getBudgetPercentage(
                          totals.totalCost,
                          totalBudget
                        )
                      )}%`,
                    }}
                  />
                </div>

                <div className="budget-progress-footer">
                  <span>
                    {formatCurrency(
                      totals.totalCost
                    )}{" "}
                    committed
                  </span>

                  <span>
                    {totalBudget >
                    0
                      ? totals.budgetLeft >=
                        0
                        ? `${formatCurrency(
                            totals.budgetLeft
                          )} budget left`
                        : `${formatCurrency(
                            Math.abs(
                              totals.budgetLeft
                            )
                          )} over budget`
                      : "Set your budget to track remaining"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="budget-stats-grid">
            <BudgetStat
              icon={
                <CircleDollarSign
                  size={19}
                />
              }
              label="Total Cost"
              value={
                formatCurrency(
                  totals.totalCost
                )
              }
            />

            <BudgetStat
              icon={
                <Check
                  size={19}
                />
              }
              label="Paid"
              value={
                formatCurrency(
                  totals.paid
                )
              }
              type="paid"
            />

            <BudgetStat
              icon={
                <CalendarDays
                  size={19}
                />
              }
              label="Still Owed"
              value={
                formatCurrency(
                  totals.owed
                )
              }
              type="owed"
            />

            <BudgetStat
              icon={
                <Wallet
                  size={19}
                />
              }
              label="Budget Left"
              value={
                formatCurrency(
                  totals.budgetLeft
                )
              }
              type={
                totals.budgetLeft <
                0
                  ? "over"
                  : ""
              }
            />
          </section>

          {totals.estimatedCount >
            0 && (
            <div className="budget-estimate-summary">
              <span className="budget-estimate-badge">
                Estimate
              </span>

              <span>
                {totals.estimatedCount}{" "}
                {totals.estimatedCount ===
                1
                  ? "item is"
                  : "items are"}{" "}
                still estimated, totaling{" "}
                <strong>
                  {formatCurrency(
                    totals.estimatedTotal
                  )}
                </strong>
                .
              </span>
            </div>
          )}

          {totalBudget >
            0 &&
            totals.budgetLeft <
              0 && (
              <div className="budget-over-warning">
                You're currently{" "}
                <strong>
                  {formatCurrency(
                    Math.abs(
                      totals.budgetLeft
                    )
                  )}
                </strong>{" "}
                over your total wedding budget.
              </div>
            )}

          {items.length ===
          0 ? (
            <section className="content-card budget-empty">
              <CircleDollarSign
                size={42}
                strokeWidth={1.25}
              />

              <h2>
                No budget items yet
              </h2>

              <p>
                Add your wedding expenses to track
                costs, payments, balances, and due
                dates.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={
                  openAddItem
                }
              >
                <Plus
                  size={17}
                />

                Add First Item
              </button>
            </section>
          ) : (
            <section className="budget-categories">
              {categorySummaries.map(
                (summary) => (
                  <BudgetCategory
                    key={
                      summary.category
                    }
                    summary={
                      summary
                    }
                    vendorMap={
                      vendorMap
                    }
                    onEdit={
                      openEditItem
                    }
                    onDelete={
                      handleDeleteItem
                    }
                  />
                )
              )}
            </section>
          )}
        </>
      )}

      {showItemModal && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeItemModal
          }
        >
          <div
            className="task-modal budget-item-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="task-modal-header">
              <div>
                <p className="card-eyebrow">
                  {editingItemId
                    ? "Edit Expense"
                    : "New Expense"}
                </p>

                <h2>
                  {editingItemId
                    ? "Edit Budget Item"
                    : "Add Budget Item"}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={
                  closeItemModal
                }
                disabled={
                  savingItem
                }
              >
                <X
                  size={19}
                />
              </button>
            </div>

            <form
              className="task-form"
              onSubmit={
                handleSaveItem
              }
            >
              <label className="form-field">
                <span>
                  Item Name
                </span>

                <input
                  type="text"
                  name="name"
                  value={
                    itemForm.name
                  }
                  onChange={
                    handleItemChange
                  }
                  placeholder="Wedding Venue"
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
                        itemForm.category
                      }
                      onChange={
                        handleItemChange
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
                            {category}
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
                        itemForm.status
                      }
                      onChange={
                        handleItemChange
                      }
                    >
                      <option value="not-booked">
                        Not Booked
                      </option>

                      <option value="booked">
                        Booked
                      </option>

                      <option value="deposit-paid">
                        Deposit Paid
                      </option>

                      <option value="partially-paid">
                        Partially Paid
                      </option>

                      <option value="paid">
                        Paid
                      </option>
                    </select>

                    <ChevronDown
                      size={15}
                    />
                  </div>
                </label>
              </div>

              <div className="form-grid budget-cost-row">
                <label className="form-field">
                  <span>
                    Cost
                  </span>

                  <div className="money-input">
                    <DollarSign
                      size={15}
                    />

                    <input
                      type="number"
                      name="cost"
                      min="0"
                      step="0.01"
                      value={
                        itemForm.cost
                      }
                      onChange={
                        handleItemChange
                      }
                      placeholder="0.00"
                    />
                  </div>
                </label>

                <div className="form-field">
                  <span>
                    Cost Type
                  </span>

                  <div className="budget-cost-toggle">
                    <button
                      type="button"
                      className={
                        itemForm.costType ===
                        "estimated"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setItemForm(
                          (
                            current
                          ) => ({
                            ...current,

                            costType:
                              "estimated",
                          })
                        )
                      }
                    >
                      Estimated
                    </button>

                    <button
                      type="button"
                      className={
                        itemForm.costType ===
                        "actual"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setItemForm(
                          (
                            current
                          ) => ({
                            ...current,

                            costType:
                              "actual",
                          })
                        )
                      }
                    >
                      Actual
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>
                    Amount Paid
                  </span>

                  <div className="money-input">
                    <DollarSign
                      size={15}
                    />

                    <input
                      type="number"
                      name="amountPaid"
                      min="0"
                      step="0.01"
                      value={
                        itemForm.amountPaid
                      }
                      onChange={
                        handleItemChange
                      }
                      placeholder="0.00"
                    />
                  </div>
                </label>

                <label className="form-field">
                  <span>
                    Balance Due Date
                  </span>

                  <input
                    type="date"
                    name="dueDate"
                    value={
                      itemForm.dueDate
                    }
                    onChange={
                      handleItemChange
                    }
                  />
                </label>
              </div>

              <label className="form-field">
                <span>
                  Vendor
                </span>

                <div className="select-wrap">
                  <select
                    name="vendorId"
                    value={
                      itemForm.vendorId
                    }
                    onChange={
                      handleItemChange
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
                          {vendor.category
                            ? ` · ${vendor.category}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={15}
                  />
                </div>
              </label>

              {vendors.length ===
                0 && (
                <p className="budget-vendor-help">
                  Add vendors on the Vendors page and
                  they will appear here automatically.
                </p>
              )}

              <label className="form-field">
                <span>
                  Payment Method / Instructions
                </span>

                <textarea
                  name="paymentInstructions"
                  value={
                    itemForm.paymentInstructions
                  }
                  onChange={
                    handleItemChange
                  }
                  rows={3}
                  placeholder="Venmo @username, mail check to..., pay through vendor portal..."
                />
              </label>

              <label className="form-field">
                <span>
                  Notes
                </span>

                <textarea
                  name="notes"
                  value={
                    itemForm.notes
                  }
                  onChange={
                    handleItemChange
                  }
                  rows={4}
                  placeholder="Contract notes, what's included, payment schedule..."
                />
              </label>

              {error && (
                <div className="budget-modal-error">
                  {error}
                </div>
              )}

              <div className="task-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeItemModal
                  }
                  disabled={
                    savingItem
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    savingItem
                  }
                >
                  {savingItem ? (
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

                      {editingItemId
                        ? "Save Changes"
                        : "Add Item"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function BudgetStat({
  icon,
  label,
  value,
  type = "",
}) {
  return (
    <div
      className={`budget-stat-card ${
        type
          ? `budget-stat-${type}`
          : ""
      }`}
    >
      <div className="budget-stat-icon">
        {icon}
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}

function BudgetCategory({
  summary,
  vendorMap,
  onEdit,
  onDelete,
}) {
  const paidPercentage =
    summary.cost >
    0
      ? Math.min(
          100,
          Math.round(
            (
              summary.paid /
              summary.cost
            ) *
              100
          )
        )
      : 0;

  return (
    <section className="budget-category-card">
      <div className="budget-category-header">
        <div>
          <p className="card-eyebrow">
            Category
          </p>

          <h2>
            {summary.category}
          </h2>
        </div>

        <div className="budget-category-total">
          <strong>
            {formatCurrency(
              summary.cost
            )}
          </strong>

          <span>
            {summary.items.length}{" "}
            {summary.items.length ===
            1
              ? "item"
              : "items"}
          </span>
        </div>
      </div>

      <div className="budget-category-progress-labels">
        <span>
          Paid{" "}
          {formatCurrency(
            summary.paid
          )}
        </span>

        <span>
          {paidPercentage}%
        </span>
      </div>

      <div className="budget-category-progress">
        <div
          style={{
            width: `${paidPercentage}%`,
          }}
        />
      </div>

      <div className="budget-item-list">
        {summary.items.map(
          (item) => (
            <BudgetItemRow
              key={
                item.id
              }
              item={
                item
              }
              vendorMap={
                vendorMap
              }
              onEdit={() =>
                onEdit(
                  item
                )
              }
              onDelete={() =>
                onDelete(
                  item
                )
              }
            />
          )
        )}
      </div>
    </section>
  );
}

function BudgetItemRow({
  item,
  vendorMap,
  onEdit,
  onDelete,
}) {
  const cost =
    getBudgetItemCost(
      item
    );

  const costType =
    getBudgetItemCostType(
      item
    );

  const paid =
    getNumber(
      item.amountPaid
    );

  const remaining =
    Math.max(
      0,
      cost -
        paid
    );

  const linkedVendor =
    item.vendorId
      ? vendorMap.get(
          item.vendorId
        )
      : null;

  const vendorName =
    linkedVendor?.name ||
    item.vendorName ||
    "";

  return (
    <div className="budget-item-row">
      <div className="budget-item-main">
        <div>
          <div className="budget-item-title-row">
            <strong>
              {item.name}
            </strong>

            {costType ===
              "estimated" && (
              <span className="budget-estimate-badge">
                Estimate
              </span>
            )}

            <BudgetStatusBadge
              status={
                item.status
              }
            />
          </div>

          <div className="budget-item-meta">
            {vendorName && (
              <span>
                {vendorName}
              </span>
            )}

            {item.dueDate && (
              <span>
                Due{" "}
                {formatDate(
                  item.dueDate
                )}
              </span>
            )}
          </div>

          {item.paymentInstructions && (
            <p className="budget-payment-instructions">
              <strong>
                Payment:
              </strong>{" "}
              {item.paymentInstructions}
            </p>
          )}

          {item.notes && (
            <p className="budget-item-notes">
              {item.notes}
            </p>
          )}
        </div>
      </div>

      <div className="budget-item-money">
        <div>
          <span>
            Cost
          </span>

          <strong>
            {formatCurrency(
              cost
            )}
          </strong>

          {costType ===
            "estimated" && (
            <small>
              estimated
            </small>
          )}
        </div>

        <div>
          <span>
            Paid
          </span>

          <strong>
            {formatCurrency(
              paid
            )}
          </strong>
        </div>

        <div>
          <span>
            Remaining
          </span>

          <strong>
            {formatCurrency(
              remaining
            )}
          </strong>
        </div>
      </div>

      <div className="budget-item-actions">
        <button
          type="button"
          className="icon-button"
          onClick={
            onEdit
          }
          title="Edit budget item"
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
          title="Delete budget item"
        >
          <Trash2
            size={16}
          />
        </button>
      </div>
    </div>
  );
}

function BudgetStatusBadge({
  status,
}) {
  const labels = {
    "not-booked":
      "Not Booked",

    booked:
      "Booked",

    "deposit-paid":
      "Deposit Paid",

    "partially-paid":
      "Partially Paid",

    paid:
      "Paid",
  };

  return (
    <span
      className={`budget-status budget-status-${
        status ||
        "not-booked"
      }`}
    >
      {labels[
        status
      ] ||
        "Not Booked"}
    </span>
  );
}

function getNumber(
  value
) {
  const number =
    Number(
      value
    );

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
    item.cost !==
      null
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
    oldActual >
    0
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
    ) >
    0
  ) {
    return "actual";
  }

  if (
    getNumber(
      item.estimatedCost
    ) >
    0
  ) {
    return "estimated";
  }

  return "actual";
}

function getBudgetPercentage(
  amount,
  budget
) {
  if (
    !budget ||
    budget <=
      0
  ) {
    return 0;
  }

  return Math.round(
    (
      amount /
      budget
    ) *
      100
  );
}

function formatCurrency(
  amount
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style:
        "currency",

      currency:
        "USD",

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
  if (
    !dateString
  ) {
    return "";
  }

  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric",
    }
  ).format(
    date
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
    const dateComparison =
      first.dueDate.localeCompare(
        second.dueDate
      );

    if (
      dateComparison !==
      0
    ) {
      return dateComparison;
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

  return String(
    first.name ||
    ""
  ).localeCompare(
    String(
      second.name ||
      ""
    )
  );
}

export default Budget;