import {
    ExternalLink,
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

const groupOrder = [
    "Bridesmaids",
    "Groomsmen",
    "Parents",
    "Bride & Groom",
    "Wedding Party",
    "Other",
];

function SelectedOutfits() {
    const [
        selections,
        setSelections,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    useEffect(() => {
        const unsubscribe =
            onSnapshot(
                collection(
                    db,
                    "weddings",
                    WEDDING_ID,
                    "selectedOutfits"
                ),
                (snapshot) => {
                    setSelections(
                        snapshot.docs
                            .map(
                                (selectionDoc) => ({
                                    id:
                                        selectionDoc.id,

                                    ...selectionDoc.data(),
                                })
                            )
                            .filter(
                                (selection) =>
                                    selection.visible !==
                                    false
                            )
                    );

                    setLoading(false);
                },
                (firebaseError) => {
                    console.error(
                        "Error loading selected outfits:",
                        firebaseError
                    );

                    setLoading(false);
                }
            );

        return unsubscribe;
    }, []);

    const groupedSelections =
        useMemo(
            () => {
                const grouped = {};

                selections.forEach(
                    (selection) => {
                        const group =
                            selection.group ||
                            "Other";

                        if (
                            !grouped[
                            group
                            ]
                        ) {
                            grouped[
                                group
                            ] = [];
                        }

                        grouped[
                            group
                        ].push(
                            selection
                        );
                    }
                );

                Object.values(
                    grouped
                ).forEach(
                    (groupSelections) => {
                        groupSelections.sort(
                            (first, second) =>
                                String(
                                    first.displayName ||
                                    first.personName ||
                                    ""
                                ).localeCompare(
                                    String(
                                        second.displayName ||
                                        second.personName ||
                                        ""
                                    )
                                )
                        );
                    }
                );

                return grouped;
            },
            [selections]
        );

    const groups =
        Object.keys(
            groupedSelections
        ).sort(
            compareGroups
        );

    return (
        <main className="page selected-outfits-page">
            <section className="selected-outfits-intro">
                <p className="page-eyebrow">
                    Selected Outfits
                </p>

                <h1 className="page-title">
                    What We're Wearing
                </h1>

                <p className="page-description">
                    Take a look at what members of the wedding
                    party have chosen to wear for the wedding.
                </p>
            </section>

            {loading ? (
                <div className="content-card">
                    Loading selected outfits...
                </div>
            ) : groups.length ===
                0 ? (
                <div className="content-card selected-outfits-empty">
                    <Shirt
                        size={22}
                    />

                    <div>
                        <strong>
                            Nothing selected yet.
                        </strong>

                        <p>
                            Outfits will appear here as everyone
                            finalizes their choices.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="selected-outfit-groups">
                    {groups.map(
                        (group) => (
                            <section
                                className="selected-outfit-group"
                                key={
                                    group
                                }
                            >
                                <div className="selected-outfit-group-heading">
                                    <p className="card-eyebrow">
                                        Wedding Party
                                    </p>

                                    <h2>
                                        {group}
                                    </h2>

                                    {group ===
                                        "Groomsmen" && (
                                            <p>
                                                The groomsmen will wear the same
                                                suit with their assigned tie
                                                colors.
                                            </p>
                                        )}
                                </div>

                                <div
                                    className={`selected-outfit-grid ${getGridClass(
                                        group
                                    )}`}
                                >
                                    {groupedSelections[
                                        group
                                    ].map(
                                        (selection) => (
                                            <SelectedOutfitCard
                                                key={
                                                    selection.id
                                                }
                                                selection={
                                                    selection
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            </section>
                        )
                    )}
                </div>
            )}
        </main>
    );
}

function SelectedOutfitCard({
    selection,
}) {
    return (
        <article className="selected-outfit-card">
            <div className="selected-outfit-image">
                {selection.imageUrl ? (
                    <img
                        src={
                            selection.imageUrl
                        }
                        alt={
                            selection.outfitName ||
                            `${selection.displayName || selection.personName}'s outfit`
                        }
                        loading="lazy"
                    />
                ) : (
                    <div className="selected-outfit-placeholder">
                        <Shirt
                            size={30}
                        />
                    </div>
                )}
            </div>

            <div className="selected-outfit-content">
                {selection.color && (
                    <p className="card-eyebrow">
                        {selection.color}
                    </p>
                )}

                <h3>
                    {selection.displayName ||
                        selection.personName}
                </h3>

                {selection.outfitName && (
                    <p>
                        {selection.outfitName}
                    </p>
                )}

                {selection.purchaseUrl && (
                    <a
                        href={
                            selection.purchaseUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                    >
                        View Outfit

                        <ExternalLink
                            size={13}
                        />
                    </a>
                )}
            </div>
        </article>
    );
}

function getGridClass(
    group
) {
    if (
        group ===
        "Bridesmaids" ||
        group ===
        "Groomsmen"
    ) {
        return "selected-outfit-grid-3";
    }

    if (
        group ===
        "Parents"
    ) {
        return "selected-outfit-grid-4";
    }

    return "selected-outfit-grid-default";
}

function compareGroups(
    first,
    second
) {
    const firstIndex =
        groupOrder.indexOf(
            first
        );

    const secondIndex =
        groupOrder.indexOf(
            second
        );

    if (
        firstIndex ===
        -1 &&
        secondIndex ===
        -1
    ) {
        return first.localeCompare(
            second
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

export default SelectedOutfits;