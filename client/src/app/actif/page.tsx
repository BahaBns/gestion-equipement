"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  useGetActifsQuery,
  useDeleteActifMutation,
  useGetCategoriesQuery,
  useUpdateActifMutation,
  useGetStatusesQuery,
  useGetLicensesQuery,
  useDeleteLicenseMutation,
  useUpdateLicenseMutation,
  useGetHashtagsQuery,
  useGetActifsByHashtagQuery,
  useGetLicensesByHashtagQuery,
  useGetActifsByMultipleHashtagsMutation,
  useGetLicensesByMultipleHashtagsMutation,
  useAssociateHashtagToActifMutation,
  useAssociateHashtagToLicenseMutation,
  useDissociateHashtagFromActifMutation,
  useDissociateHashtagFromLicenseMutation,
  useGetEtatsQuery,
  useGetMarquesQuery,
  useGetModelesByMarqueQuery,
  useGetFournisseursQuery,
  Actif,
  ActifType,
  License,
  Hashtag,
  Etat,
  Status,
  Category,
} from "@/state/api";
import { SearchIcon, ChevronDown, Tag, X } from "lucide-react";
import Header from "@/app/(components)/Header";
import EditActifModal from "./components/EditActifModal";
import EditLicenseModal from "./components/EditLicenseModal";
import DeleteConfirmationModal from "./components/deleteConfirmationModal";
import ActifsTableView from "./components/tableView";
import GridView from "./components/gridView";
import HashtagBadge from "./components/HashtagBadge";
import { CircularProgress } from "@mui/material";
import AssetCreationWrapper from "./components/assetCreationWrapper";
import HashtagManagementModal from "./components/HashtagManagementModal";

interface SortConfig {
  key: string;
  direction: "ascending" | "descending";
}

const Actifs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "actif" | "license";
  } | null>(null);
  const [isTableView, setIsTableView] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actifToEdit, setActifToEdit] = useState<Actif | null>(null);
  const [licenseToEdit, setLicenseToEdit] = useState<License | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [showLicenses, setShowLicenses] = useState(true);

  // Multiple hashtags state
  const [selectedHashtags, setSelectedHashtags] = useState<Hashtag[]>([]);
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false);
  const [itemForHashtags, setItemForHashtags] = useState<
    Actif | License | null
  >(null);
  const [hashtagFilterMenuOpen, setHashtagFilterMenuOpen] = useState(false);
  const [hashtagSearchTerm, setHashtagSearchTerm] = useState("");
  const hashtagFilterRef = useRef<HTMLDivElement>(null);

  // Add sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // For multi-hashtag filtering
  const [multiFilteredActifs, setMultiFilteredActifs] = useState<
    Actif[] | null
  >(null);
  const [multiFilteredLicenses, setMultiFilteredLicenses] = useState<
    License[] | null
  >(null);
  const [isLoadingMultiHashtagData, setIsLoadingMultiHashtagData] =
    useState<boolean>(false);

  // New mutations for multi-hashtag filtering
  const [getActifsByMultipleHashtags, { isLoading: isLoadingMultipleActifs }] =
    useGetActifsByMultipleHashtagsMutation();

  const [
    getLicensesByMultipleHashtags,
    { isLoading: isLoadingMultipleLicenses },
  ] = useGetLicensesByMultipleHashtagsMutation();

  // Fetch actifs and licenses
  const {
    data: actifs,
    isLoading: isLoadingActifs,
    isError: isActifsError,
    refetch: refetchActifs,
  } = useGetActifsQuery(searchTerm);

  const {
    data: licenses,
    isLoading: isLoadingLicenses,
    isError: isLicensesError,
    refetch: refetchLicenses,
  } = useGetLicensesQuery(searchTerm);

  // Fetch hashtags
  const {
    data: hashtags,
    isLoading: isLoadingHashtags,
    isError: isHashtagsError,
  } = useGetHashtagsQuery();

  const {
    data: etats,
    isLoading: isEtatsLoading,
    isError: isEtatsError,
  } = useGetEtatsQuery();

  // Fetch marques, modeles, and fournisseurs for dropdown menus
  const {
    data: marques,
    isLoading: isLoadingMarques,
    isError: isMarquesError,
  } = useGetMarquesQuery();

  const {
    data: fournisseurs,
    isLoading: isLoadingFournisseurs,
    isError: isFournisseursError,
  } = useGetFournisseursQuery();

  // We keep the original API hooks, but only use them when a single hashtag is selected
  // for backward compatibility
  const {
    data: singleFilteredActifs,
    isLoading: isLoadingSingleFilteredActifs,
  } = useGetActifsByHashtagQuery(
    selectedHashtags.length === 1 ? selectedHashtags[0]?.hashtagId || "" : "",
    {
      skip: selectedHashtags.length !== 1,
    }
  );

  const {
    data: singleFilteredLicenses,
    isLoading: isLoadingSingleFilteredLicenses,
  } = useGetLicensesByHashtagQuery(
    selectedHashtags.length === 1 ? selectedHashtags[0]?.hashtagId || "" : "",
    {
      skip: selectedHashtags.length !== 1,
    }
  );

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useGetCategoriesQuery();

  // Using updated status endpoint from status controller
  const {
    data: statuses,
    isLoading: isStatusesLoading,
    isError: isStatusesError,
  } = useGetStatusesQuery();

  // State to hold all actif types from different categories
  const [allActifTypes, setAllActifTypes] = useState<ActifType[]>([]);
  const [isLoadingAllActifTypes, setIsLoadingAllActifTypes] =
    useState<boolean>(true);
  const [actifTypesError, setActifTypesError] = useState<boolean>(false);

  useEffect(() => {
    console.log("Hashtags data:", hashtags);
  }, [hashtags]);

  // Process actifs to ensure marqueObj, modeleObj, and fournisseurObj are set
  const processedActifs = useMemo(() => {
    if (!actifs) return [];

    return actifs.map((actif) => {
      // For each actif, ensure it has the object representations of marque, modele, and fournisseur
      // if they're available from the API
      return {
        ...actif,
        // If marqueObj isn't set but marqueId is, find the matching marque
        marqueObj:
          actif.marqueObj ||
          (actif.marqueId && marques
            ? marques.find((m) => m.marqueId === actif.marqueId)
            : undefined),

        // If modeleObj isn't set but modeleId is, find the matching modele
        modeleObj:
          actif.modeleObj ||
          (actif.modeleId && marques
            ? marques
                .flatMap((m) => m.modeles || [])
                .find((m) => m.modeleId === actif.modeleId)
            : undefined),

        // If fournisseurObj isn't set but fournisseurId is, find the matching fournisseur
        fournisseurObj:
          actif.fournisseurObj ||
          (actif.fournisseurId && fournisseurs
            ? fournisseurs.find((f) => f.fournisseurId === actif.fournisseurId)
            : undefined),
      };
    });
  }, [actifs, marques, fournisseurs]);

  // Update multi-hashtag filtering logic when hashtags selection changes
  useEffect(() => {
    if (selectedHashtags.length <= 1) {
      // If 0 or 1 hashtag selected, we use the original API
      setMultiFilteredActifs(null);
      setMultiFilteredLicenses(null);
      return;
    }

    const fetchMultiHashtagData = async () => {
      setIsLoadingMultiHashtagData(true);
      try {
        // Get all hashtag IDs we're filtering by
        const hashtagIds = selectedHashtags.map((ht) => ht.hashtagId);

        // Use our new mutations to get data filtered by multiple hashtags
        const [actifResults, licenseResults] = await Promise.all([
          getActifsByMultipleHashtags(hashtagIds).unwrap(),
          getLicensesByMultipleHashtags(hashtagIds).unwrap(),
        ]);

        console.log("Multi-hashtag actifs:", actifResults);
        console.log("Multi-hashtag licenses:", licenseResults);

        setMultiFilteredActifs(actifResults);
        setMultiFilteredLicenses(licenseResults);
      } catch (error) {
        console.error("Error filtering by multiple hashtags:", error);
        // In case of error, just reset the filters
        setMultiFilteredActifs([]);
        setMultiFilteredLicenses([]);
      } finally {
        setIsLoadingMultiHashtagData(false);
      }
    };

    if (selectedHashtags.length > 1) {
      fetchMultiHashtagData();
    }
  }, [
    selectedHashtags,
    getActifsByMultipleHashtags,
    getLicensesByMultipleHashtags,
  ]);

  // Fetch actif types for each category
  useEffect(() => {
    const fetchActifTypesForAllCategories = async () => {
      if (!categories) return;

      setIsLoadingAllActifTypes(true);
      try {
        const promises = categories.map((category) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories/${category.categoryId}/actiftypes`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          ).then((res) => res.json())
        );

        const results = await Promise.all(promises);
        // Flatten results from all categories
        const allTypes = results.flat();
        setAllActifTypes(allTypes);
        setActifTypesError(false);
      } catch (error) {
        console.error("Error fetching actif types:", error);
        setActifTypesError(true);
      } finally {
        setIsLoadingAllActifTypes(false);
      }
    };

    if (categories && categories.length > 0) {
      fetchActifTypesForAllCategories();
    }
  }, [categories]);

  // Using updated mutation endpoints
  const [deleteActif, { isLoading: isDeletingActif }] =
    useDeleteActifMutation();
  const [deleteLicense, { isLoading: isDeletingLicense }] =
    useDeleteLicenseMutation();
  const [updateActif, { isLoading: isUpdatingActif }] =
    useUpdateActifMutation();
  const [updateLicense, { isLoading: isUpdatingLicense }] =
    useUpdateLicenseMutation();

  // Reset success message after 3 seconds
  useEffect(() => {
    if (createSuccess) {
      const timer = setTimeout(() => {
        setCreateSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [createSuccess]);

  // Close hashtag filter menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        hashtagFilterRef.current &&
        !hashtagFilterRef.current.contains(event.target as Node)
      ) {
        setHashtagFilterMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Refresh items after CRUD operations
  useEffect(() => {
    if (
      !isDeletingActif &&
      !isUpdatingActif &&
      !isDeletingLicense &&
      !isUpdatingLicense
    ) {
      refetchActifs();
      refetchLicenses();
    }
  }, [
    isDeletingActif,
    isUpdatingActif,
    isDeletingLicense,
    isUpdatingLicense,
    refetchActifs,
    refetchLicenses,
  ]);

  // Sorting function
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";

    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }

    setSortConfig({ key, direction });
  };

  // Get sorted actifs
  const sortedActifs = useMemo(() => {
    if (!processedActifs) return [];

    // Ensure proper relationships are loaded for each actif
    const enhancedActifs = processedActifs.map((actif) => {
      return {
        ...actif,
        actiftype: actif.actiftype || {
          actifTypeId: actif.actifTypeId,
          nom: actif.actifType || "Type inconnu",
          category: {
            categoryId: null,
            nom: null,
          },
        },
      };
    });

    return getSortedItems(enhancedActifs, sortConfig);
  }, [processedActifs, sortConfig]);

  // Get sorted licenses
  const sortedLicenses = useMemo(() => {
    if (!licenses) return [];

    // Apply sorting logic to licenses
    return [...licenses].sort((a, b) => {
      if (!sortConfig) return a.softwareName.localeCompare(b.softwareName);

      // Handle different sorts based on key
      switch (sortConfig.key) {
        case "softwareName":
          return sortConfig.direction === "ascending"
            ? a.softwareName.localeCompare(b.softwareName)
            : b.softwareName.localeCompare(a.softwareName);

        case "vendorName":
          return sortConfig.direction === "ascending"
            ? (a.vendorName || "").localeCompare(b.vendorName || "")
            : (b.vendorName || "").localeCompare(a.vendorName || "");

        case "licenseKey":
          return sortConfig.direction === "ascending"
            ? (a.licenseKey || "").localeCompare(b.licenseKey || "")
            : (b.licenseKey || "").localeCompare(a.licenseKey || "");

        case "expiryDate":
          const dateA = new Date(a.expiryDate).getTime();
          const dateB = new Date(b.expiryDate).getTime();
          return sortConfig.direction === "ascending"
            ? dateA - dateB
            : dateB - dateA;

        case "licenseQuantity":
          return sortConfig.direction === "ascending"
            ? a.licenseQuantity - b.licenseQuantity
            : b.licenseQuantity - a.licenseQuantity;

        default:
          return sortConfig.direction === "ascending"
            ? a.softwareName.localeCompare(b.softwareName)
            : b.softwareName.localeCompare(a.softwareName);
      }
    });
  }, [licenses, sortConfig]);

  // Get active items based on hashtag filtering
  const activeActifs = useMemo(() => {
    if (selectedHashtags.length === 0) {
      return sortedActifs;
    } else if (selectedHashtags.length === 1) {
      return singleFilteredActifs
        ? // Process filtered actifs to ensure they have object representations
          singleFilteredActifs.map((actif) => ({
            ...actif,
            marqueObj:
              actif.marqueObj ||
              (actif.marqueId && marques
                ? marques.find((m) => m.marqueId === actif.marqueId)
                : undefined),
            modeleObj:
              actif.modeleObj ||
              (actif.modeleId && marques
                ? marques
                    .flatMap((m) => m.modeles || [])
                    .find((m) => m.modeleId === actif.modeleId)
                : undefined),
            fournisseurObj:
              actif.fournisseurObj ||
              (actif.fournisseurId && fournisseurs
                ? fournisseurs.find(
                    (f) => f.fournisseurId === actif.fournisseurId
                  )
                : undefined),
          }))
        : [];
    } else {
      return multiFilteredActifs
        ? // Process multi-filtered actifs to ensure they have object representations
          multiFilteredActifs.map((actif) => ({
            ...actif,
            marqueObj:
              actif.marqueObj ||
              (actif.marqueId && marques
                ? marques.find((m) => m.marqueId === actif.marqueId)
                : undefined),
            modeleObj:
              actif.modeleObj ||
              (actif.modeleId && marques
                ? marques
                    .flatMap((m) => m.modeles || [])
                    .find((m) => m.modeleId === actif.modeleId)
                : undefined),
            fournisseurObj:
              actif.fournisseurObj ||
              (actif.fournisseurId && fournisseurs
                ? fournisseurs.find(
                    (f) => f.fournisseurId === actif.fournisseurId
                  )
                : undefined),
          }))
        : [];
    }
  }, [
    selectedHashtags,
    singleFilteredActifs,
    multiFilteredActifs,
    sortedActifs,
    marques,
    fournisseurs,
  ]);

  const activeLicenses = useMemo(() => {
    if (selectedHashtags.length === 0) {
      return sortedLicenses;
    } else if (selectedHashtags.length === 1) {
      return singleFilteredLicenses || [];
    } else {
      return multiFilteredLicenses || [];
    }
  }, [
    selectedHashtags,
    singleFilteredLicenses,
    multiFilteredLicenses,
    sortedLicenses,
  ]);

  // Combine actifs and licenses for the grid view
  const combinedItems = useMemo(() => {
    const items = [...activeActifs] as (Actif | License)[];
    if (showLicenses && activeLicenses) {
      items.push(...activeLicenses);
    }
    return items;
  }, [activeActifs, showLicenses, activeLicenses]);

  // Check if an item is a License
  const isLicense = (item: Actif | License): item is License => {
    return (item as License).licenseId !== undefined;
  };

  const handleDeleteClick = (itemId: string) => {
    // Determine if it's an actif or license based on the ID format or presence
    const isLicenseId = licenses?.some(
      (license) => license.licenseId === itemId
    );

    setItemToDelete({
      id: itemId,
      type: isLicenseId ? "license" : "actif",
    });

    setIsDeleteModalOpen(true);
  };

  const handleEditClick = (item: Actif | License) => {
    if (isLicense(item)) {
      setLicenseToEdit(item);
      setActifToEdit(null);
    } else {
      setActifToEdit(item);
      setLicenseToEdit(null);
    }
    setIsEditModalOpen(true);
  };

  // Handle opening the hashtag management modal
  const handleManageHashtags = (item: Actif | License) => {
    setItemForHashtags(item);
    setIsHashtagModalOpen(true);
  };

  const handleUpdateActif = async (formData: FormData) => {
    try {
      // Log the form data for debugging
      console.log("Updating actif with form data:");
      Array.from(formData.keys()).forEach((key) => {
        console.log(`${key}: ${formData.get(key)}`);
      });

      await updateActif(formData).unwrap();
      setIsEditModalOpen(false);
      setActifToEdit(null);
      refetchActifs();
    } catch (error: any) {
      console.error("Error updating actif:", error);

      // More detailed error handling
      if (error.data && error.data.message) {
        alert(`Failed to update actif: ${error.data.message}`);
      } else {
        alert("Failed to update actif: " + (error.message || "Unknown error"));
      }
    }
  };

  const handleUpdateLicense = async (formData: FormData) => {
    try {
      // Log the form data for debugging
      console.log("Updating license with form data:");
      Array.from(formData.keys()).forEach((key) => {
        console.log(`${key}: ${formData.get(key)}`);
      });

      await updateLicense(formData).unwrap();
      setIsEditModalOpen(false);
      setLicenseToEdit(null);
      refetchLicenses();
    } catch (error: any) {
      console.error("Error updating license:", error);

      // More detailed error handling
      if (error.data && error.data.message) {
        alert(`Failed to update license: ${error.data.message}`);
      } else {
        alert(
          "Failed to update license: " + (error.message || "Unknown error")
        );
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        if (itemToDelete.type === "actif") {
          await deleteActif(itemToDelete.id).unwrap();
        } else {
          await deleteLicense(itemToDelete.id).unwrap();
        }

        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        refetchActifs();
        refetchLicenses();
      } catch (error: any) {
        console.error(`Error deleting ${itemToDelete.type}:`, error);

        // More detailed error handling
        if (error.data && error.data.message) {
          alert(`Failed to delete ${itemToDelete.type}: ${error.data.message}`);
        } else {
          alert(
            `Failed to delete ${itemToDelete.type}: ${
              error.message || "Unknown error"
            }`
          );
        }
      }
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const toggleLicensesDisplay = () => {
    setShowLicenses(!showLicenses);
  };

  // Toggle hashtag filter menu
  const toggleHashtagFilterMenu = () => {
    setHashtagFilterMenuOpen(!hashtagFilterMenuOpen);
  };

  // Check if a hashtag is already selected
  const isHashtagSelected = (hashtag: Hashtag) => {
    return selectedHashtags.some((h) => h.hashtagId === hashtag.hashtagId);
  };

  // Toggle hashtag selection (add or remove)
  const toggleHashtagSelection = (hashtag: Hashtag) => {
    if (isHashtagSelected(hashtag)) {
      setSelectedHashtags(
        selectedHashtags.filter((h) => h.hashtagId !== hashtag.hashtagId)
      );
    } else {
      setSelectedHashtags([...selectedHashtags, hashtag]);
    }
  };

  // Clear all hashtag filters
  const clearAllHashtagFilters = () => {
    setSelectedHashtags([]);
    setHashtagSearchTerm("");
  };

  // Remove a specific hashtag from filters
  const removeHashtagFilter = (hashtagId: string) => {
    setSelectedHashtags(
      selectedHashtags.filter((h) => h.hashtagId !== hashtagId)
    );
  };

  // Filter hashtags based on search term
  const filteredHashtags = useMemo(() => {
    if (!hashtags) return [];
    if (!hashtagSearchTerm) return hashtags;

    return hashtags.filter((hashtag) =>
      hashtag.name.toLowerCase().includes(hashtagSearchTerm.toLowerCase())
    );
  }, [hashtags, hashtagSearchTerm]);

  // Loading state now includes all required data
  if (
    isLoadingActifs ||
    isLoadingLicenses ||
    isCategoriesLoading ||
    isStatusesLoading ||
    isEtatsLoading ||
    isLoadingAllActifTypes ||
    isLoadingMultiHashtagData ||
    isLoadingMultipleActifs ||
    isLoadingMultipleLicenses ||
    isLoadingMarques ||
    isLoadingFournisseurs ||
    (selectedHashtags.length === 1 &&
      (isLoadingSingleFilteredActifs || isLoadingSingleFilteredLicenses))
  ) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress size={40} />
        <span className="ml-3">Chargement...</span>
      </div>
    );
  }

  // Error handling for all required data
  if (isActifsError || !actifs) {
    return (
      <div className="text-center text-red-500 py-4">
        Erreur lors du chargement des actifs. Veuillez réessayer.
      </div>
    );
  }

  // Add error handling for etats
  if (isEtatsError || !etats) {
    return (
      <div className="text-center text-red-500 py-4">
        Erreur lors du chargement des états. Veuillez réessayer.
      </div>
    );
  }

  if (isLicensesError || !licenses) {
    return (
      <div className="text-center text-red-500 py-4">
        Erreur lors du chargement des licences. Veuillez réessayer.
      </div>
    );
  }

  if (isCategoriesError || !categories) {
    return (
      <div className="text-center text-red-500 py-4">
        Erreur lors du chargement des catégories. Veuillez réessayer.
      </div>
    );
  }

  if (isStatusesError || !statuses) {
    return (
      <div className="text-center text-red-500 py-4">
        Erreur lors du chargement des statuts. Veuillez réessayer.
      </div>
    );
  }

  if (actifTypesError) {
    return (
      <div className="text-center text-red-500 py-4">
        Erreur lors du chargement des types d`actifs. Veuillez réessayer.
      </div>
    );
  }

  if (isHashtagsError) {
    return (
      <div className="text-center text-red-500 py-4">
        Erreur lors du chargement des hashtags. Veuillez réessayer.
      </div>
    );
  }

  // Add error handling for marques and fournisseurs
  if (isMarquesError) {
    return (
      <div className="text-center text-red-500 py-4">
        Erreur lors du chargement des marques. Veuillez réessayer.
      </div>
    );
  }

  if (isFournisseursError) {
    return (
      <div className="text-center text-red-500 py-4">
        Erreur lors du chargement des fournisseurs. Veuillez réessayer.
      </div>
    );
  }

  return (
    <div className="mx-auto pb-5 w-full">
      {/* Success message */}
      {createSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>Asset créé avec succès!</span>
          <button
            onClick={() => setCreateSuccess(false)}
            className="text-green-700"
          >
            ×
          </button>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="mb-6">
        <div className="flex items-center border-2 border-gray-200 rounded">
          <SearchIcon className="w-5 h-5 text-gray-500 m-2" />
          <input
            className="w-full py-2 px-4 rounded bg-white"
            placeholder="Rechercher des equipements et licences..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* HEADER BAR */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center flex-wrap">
          <Header name="Matériel" />

          {/* Multiple hashtag filter indicators */}
          {selectedHashtags.length > 0 && (
            <div className="ml-4 flex items-center flex-wrap">
              <span className="text-sm text-gray-600 mr-2">Filtres:</span>
              {selectedHashtags.map((hashtag) => (
                <div key={hashtag.hashtagId} className="mr-2 mb-2">
                  <HashtagBadge
                    name={hashtag.name}
                    onRemove={() => removeHashtagFilter(hashtag.hashtagId)}
                  />
                </div>
              ))}
              {selectedHashtags.length > 1 && (
                <button
                  onClick={clearAllHashtagFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 ml-2"
                >
                  Effacer tout
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          {/* Hashtag filter button */}
          <div className="relative" ref={hashtagFilterRef}>
            <div className="relative">
              {/* Filter button with indicator */}
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-md transition-all bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={toggleHashtagFilterMenu}
                aria-expanded={hashtagFilterMenuOpen}
                aria-haspopup="true"
              >
                <Tag className="w-5 h-5" />
                <span>Filtrer</span>
                {selectedHashtags.length > 0 && (
                  <span className="flex items-center justify-center h-5 min-w-5 px-1 text-xs font-medium rounded-full bg-white text-indigo-700">
                    {selectedHashtags.length}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    hashtagFilterMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown menu */}
              {hashtagFilterMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  {/* Search input */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Rechercher un hashtag..."
                        className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={hashtagSearchTerm}
                        onChange={(e) => setHashtagSearchTerm(e.target.value)}
                      />
                      {hashtagSearchTerm && (
                        <button
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setHashtagSearchTerm("")}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hashtag list */}
                  <ul className="py-1 max-h-60 overflow-y-auto">
                    {isLoadingHashtags ? (
                      <li className="flex items-center justify-center p-4 text-gray-500">
                        <CircularProgress size={16} className="mr-2" />
                        <span>Chargement...</span>
                      </li>
                    ) : filteredHashtags.length > 0 ? (
                      filteredHashtags.map((hashtag) => (
                        <li key={hashtag.hashtagId}>
                          <button
                            onClick={() => toggleHashtagSelection(hashtag)}
                            className={`flex items-center w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                              isHashtagSelected(hashtag) ? "bg-indigo-50" : ""
                            }`}
                          >
                            {isHashtagSelected(hashtag) ? (
                              <span className="w-5 h-5 text-indigo-600 mr-2">
                                ✓
                              </span>
                            ) : (
                              <span className="w-5 h-5 text-gray-400 mr-2"></span>
                            )}
                            <span
                              className={
                                isHashtagSelected(hashtag)
                                  ? "text-indigo-700 font-medium"
                                  : "text-gray-700"
                              }
                            >
                              #{hashtag.name}
                            </span>
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-3 text-center text-gray-500">
                        Aucun hashtag trouvé
                      </li>
                    )}
                  </ul>

                  {/* Clear filters */}
                  {selectedHashtags.length > 0 && (
                    <div className="p-2 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={clearAllHashtagFilters}
                        className="flex items-center justify-center w-full gap-1 text-indigo-600 hover:text-indigo-800 py-1.5 rounded hover:bg-indigo-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Effacer tous les filtres</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Asset Creation Wrapper */}
          <AssetCreationWrapper
            onSuccess={() => {
              refetchActifs();
              refetchLicenses();
              setCreateSuccess(true);
            }}
          />

          <button
            className={`flex items-center ${
              isTableView
                ? "bg-purple-500 hover:bg-purple-700"
                : "bg-green-500 hover:bg-green-700"
            } text-white font-bold py-2 px-4 rounded transition duration-150`}
            onClick={() => setIsTableView(!isTableView)}
          >
            {isTableView ? "Vue en grille" : "Vue en tableau"}
          </button>
        </div>
      </div>

      {/* Toggle Licenses Button */}
      <div className="mb-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={toggleLicensesDisplay}
        >
          {showLicenses ? "Masquer les licences" : "Afficher les licences"}
        </button>
      </div>

      {/* CONTENT LIST */}
      {combinedItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-100 rounded-lg">
          {selectedHashtags.length > 0
            ? `Aucun asset trouvé avec les hashtags sélectionnés`
            : `Aucun asset trouvé. Utilisez le bouton "Ajouter un asset" pour commencer.`}
        </div>
      ) : isTableView ? (
        <ActifsTableView
          actifs={activeActifs}
          licenses={activeLicenses}
          showLicenses={showLicenses}
          sortConfig={sortConfig}
          requestSort={requestSort}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onManageHashtags={handleManageHashtags}
        />
      ) : (
        <GridView
          items={combinedItems}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      )}

      {/* MODALS */}
      {actifToEdit && (
        <EditActifModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setActifToEdit(null);
          }}
          onUpdate={handleUpdateActif}
          actif={actifToEdit}
          categories={categories}
          statuses={statuses}
          etats={etats}
          actifTypes={allActifTypes}
        />
      )}

      {licenseToEdit && (
        <EditLicenseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setLicenseToEdit(null);
          }}
          onUpdate={handleUpdateLicense}
          license={licenseToEdit}
          categories={categories}
          statuses={statuses}
          etats={etats}
          // Make sure all license types are available for editing
          licenseTypes={[]} // You'll need to fetch these or pass them from parent
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

      {/* Hashtag Management Modal */}
      {itemForHashtags && (
        <HashtagManagementModal
          isOpen={isHashtagModalOpen}
          onClose={() => {
            setIsHashtagModalOpen(false);
            setItemForHashtags(null);
          }}
          item={itemForHashtags}
          onSuccess={() => {
            refetchActifs();
            refetchLicenses();
          }}
        />
      )}
    </div>
  );
};

export default Actifs;

// Utility function for sorting
const getSortedItems = (actifs: Actif[], sortConfig: SortConfig | null) => {
  if (!sortConfig) return actifs;

  return [...actifs].sort((a, b) => {
    // Special handling for marque/modele which might be either direct fields or relations
    if (sortConfig.key === "marque") {
      const marqueA = a.marqueObj?.name || "";
      const marqueB = b.marqueObj?.name || "";
      return sortConfig.direction === "ascending"
        ? marqueA.localeCompare(marqueB)
        : marqueB.localeCompare(marqueA);
    }

    if (sortConfig.key === "modele") {
      const modeleA = a.modeleObj?.name || "";
      const modeleB = b.modeleObj?.name || "";
      return sortConfig.direction === "ascending"
        ? modeleA.localeCompare(modeleB)
        : modeleB.localeCompare(modeleA);
    }

    if (sortConfig.key === "fournisseur") {
      const fournisseurA =
        a.fournisseurObj?.name || String(a.fournisseur || "");
      const fournisseurB =
        b.fournisseurObj?.name || String(b.fournisseur || "");
      return sortConfig.direction === "ascending"
        ? fournisseurA.localeCompare(fournisseurB)
        : fournisseurB.localeCompare(fournisseurA);
    }

    const aValue = getValue(a, sortConfig.key);
    const bValue = getValue(b, sortConfig.key);

    // Handle empty values
    const valA = aValue !== undefined && aValue !== null ? aValue : "";
    const valB = bValue !== undefined && bValue !== null ? bValue : "";

    // Special handling for dates
    if (sortConfig.key === "dateAjout") {
      return sortConfig.direction === "ascending"
        ? new Date(valA).getTime() - new Date(valB).getTime()
        : new Date(valB).getTime() - new Date(valA).getTime();
    }

    // Special handling for employees array
    if (sortConfig.key === "employees") {
      const nameA =
        a.employees && a.employees.length > 0 ? a.employees[0]?.nom || "" : "";
      const nameB =
        b.employees && b.employees.length > 0 ? b.employees[0]?.nom || "" : "";

      return sortConfig.direction === "ascending"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    }

    // String comparison for text
    if (typeof valA === "string" && typeof valB === "string") {
      return sortConfig.direction === "ascending"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    // Numeric comparison
    return sortConfig.direction === "ascending"
      ? valA > valB
        ? 1
        : -1
      : valA < valB
      ? 1
      : -1;
  });
};

const getValue = (obj: any, key: string): any => {
  return key.includes(".")
    ? key
        .split(".")
        .reduce((acc: any, k: string) => (acc ? acc[k] : undefined), obj)
    : obj[key];
};
