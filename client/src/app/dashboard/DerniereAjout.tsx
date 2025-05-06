"use client";

import { Actif, useGetActifsQuery } from "@/state/api";
import { ShoppingBag } from "lucide-react";
import React, { useState, useEffect } from "react";
import {
  getIconForSubcategory,
  getIconColorForCategory,
} from "../(components)/utils/iconUtils";
import { getSelectedDatabase } from "@/utils/auth";

const CardLastAddedAssets = () => {
  // State to track the selected database
  const [databaseName, setDatabaseName] = useState<string>("");

  // Fetch actifs data
  const { data: actifs, isLoading } = useGetActifsQuery();

  // Get selected database on component mount
  useEffect(() => {
    const selectedDb = getSelectedDatabase();
    setDatabaseName(selectedDb || "");

    // Listen for changes in database selection
    const handleStorageChange = () => {
      const updatedDb = getSelectedDatabase();
      setDatabaseName(updatedDb || "");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Define colors based on the selected database
  const primaryColor =
    databaseName.toLowerCase() === "insight" ? "green" : "blue";
  const bgColor =
    databaseName.toLowerCase() === "insight" ? "bg-green-100" : "bg-blue-100";
  const textColor =
    databaseName.toLowerCase() === "insight"
      ? "text-green-600"
      : "text-blue-600";

  // Get the last five added actifs
  const lastAddedActifs = actifs ? actifs.slice(-6).reverse() : [];

  // Render the icon for an actif based on its subcategory
  const renderActifIcon = (actif: Actif) => {
    const subcategoryName = actif.actifType;
    const categoryName = actif.category?.nom;

    const IconComponent = getIconForSubcategory(subcategoryName, categoryName);
    // You can override the icon color if needed
    const iconColor =
      databaseName.toLowerCase() === "insight"
        ? "#16a34a" // Green-600 color
        : getIconColorForCategory(categoryName); // Original color logic

    return React.createElement(IconComponent, {
      size: 40,
      color: iconColor,
      className: "p-2",
    });
  };

  // Helper to get display names for assets
  const getMarqueName = (actif: Actif) => {
    // Use marqueObj from the new structure
    return actif.marqueObj?.name || "";
  };

  const getModeleName = (actif: Actif) => {
    // Use modeleObj from the new structure
    return actif.modeleObj?.name || "";
  };

  // Helper to get supplier name - note that fournisseur string property
  // still exists alongside the new object structure
  const getFournisseurName = (actif: Actif) => {
    // Prefer the object relationship if available
    return actif.fournisseurObj?.name || actif.fournisseur || "";
  };

  return (
    <div className="row-span-3 xl:row-span-6 bg-white shadow-md rounded-2xl pb-4">
      {isLoading ? (
        <div className="m-5 text-gray-500">Chargement...</div>
      ) : (
        <>
          <h3 className="text-lg font-semibold px-7 pt-5 pb-2">
            Derniers équipements ajoutés
          </h3>
          <hr />
          <div className="overflow-auto h-full">
            {lastAddedActifs.length > 0 ? (
              lastAddedActifs.map((actif) => (
                <div
                  key={actif.actifId}
                  className="flex items-center justify-between gap-3 px-5 py-4 border-b"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg w-14 h-14 flex items-center justify-center bg-gray-50">
                      {renderActifIcon(actif)}
                    </div>
                    <div className="flex flex-col justify-between gap-1">
                      <div className="font-bold text-gray-700">
                        {actif.actifType}
                      </div>
                      <div className="flex text-sm items-center">
                        <span className="text-gray-500">
                          {getMarqueName(actif)} {getModeleName(actif)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs flex items-center">
                    <button
                      className={`p-2 rounded-full mr-2 ${bgColor} ${textColor}`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                    Ajouté le {new Date(actif.dateAjout).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-7 text-gray-500">
                Aucun équipement ajouté récemment.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CardLastAddedAssets;
