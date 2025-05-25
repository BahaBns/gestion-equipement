"use client";

import React, { useState } from "react";
import {
  Edit,
  Trash,
  Info,
  ArrowUp,
  ArrowDown,
  Cpu,
  FileText,
  Building,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { Actif, License, Fournisseur } from "@/state/api";
import {
  getIconForSubcategory,
  getIconColorForCategory,
} from "../../(components)/utils/iconUtils";

// Add missing type definitions
interface Marque {
  marqueId: string;
  name: string;
  actifTypeId: string;
}

interface Modele {
  modeleId: string;
  name: string;
  marqueId: string;
}

interface SortConfig {
  key: string;
  direction: "ascending" | "descending";
}

interface ActifsTableViewProps {
  actifs: Actif[];
  licenses: License[];
  showLicenses: boolean;
  sortConfig: SortConfig | null;
  requestSort: (key: string) => void;
  onEdit: (item: Actif | License) => void;
  onDelete: (id: string) => void;
  onManageHashtags?: (item: Actif | License) => void;
}

const ActifsTableView = ({
  actifs,
  licenses,
  showLicenses,
  sortConfig,
  requestSort,
  onEdit,
  onDelete,
  onManageHashtags,
}: ActifsTableViewProps) => {
  const [selectedActif, setSelectedActif] = useState<Actif | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  // Helper functions
  const formatDate = (dateString: string | null | Date) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Date invalide"
      : date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  // Calculate days until expiry for licenses
  const getDaysUntilExpiry = (expiryDate: Date | string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get expiry status text
  const getExpiryStatusText = (license: License): string => {
    if (license.daysUntilExpiry !== undefined) {
      // If the API already calculated this for us
      if (license.daysUntilExpiry <= 0) {
        return `Expiré depuis ${Math.abs(license.daysUntilExpiry)} jours`;
      } else {
        return `Expire dans ${license.daysUntilExpiry} jours`;
      }
    } else if (license.expiryDate) {
      // Calculate it ourselves
      const daysLeft = getDaysUntilExpiry(license.expiryDate);
      if (daysLeft <= 0) {
        return `Expiré depuis ${Math.abs(daysLeft)} jours`;
      } else {
        return `Expire dans ${daysLeft} jours`;
      }
    }
    return "";
  };

  // Render the icon for an actif based on its subcategory
  const renderActifIcon = (actif: Actif) => {
    // First try to use the subcategoryName if it exists
    const subcategoryName = actif.actifType;
    const categoryName = actif.actiftype?.category?.nom;

    const IconComponent = getIconForSubcategory(subcategoryName, categoryName);
    const iconColor = getIconColorForCategory(categoryName);

    return React.createElement(IconComponent, {
      size: 20,
      color: iconColor,
      className: "inline-block mr-2",
    });
  };

  // Helper to get sort indicator
  const getSortIndicator = (columnName: string) => {
    if (sortConfig?.key === columnName) {
      return sortConfig.direction === "ascending" ? (
        <ArrowUp className="w-4 h-4 inline ml-1" />
      ) : (
        <ArrowDown className="w-4 h-4 inline ml-1" />
      );
    }
    return null;
  };

  // Truncate long text
  const truncateText = (text: string | undefined, maxLength: number = 30) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Get status color class
  const getStatusColorClass = (statusName: string | undefined) => {
    if (!statusName) return "bg-gray-100 text-gray-800";

    switch (statusName.toLowerCase()) {
      case "disponible":
        return "bg-green-100 text-green-800";
      case "attribué":
      case "réservé":
        return "bg-blue-100 text-blue-800";
      case "en réparation":
        return "bg-yellow-100 text-yellow-800";
      case "en maintenance":
        return "bg-orange-100 text-orange-800";
      case "défectueux":
      case "hors service":
      case "expiré":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get etat color class
  const getEtatColorClass = (etatName: string | undefined) => {
    if (!etatName) return "bg-gray-100 text-gray-800";

    switch (etatName.toLowerCase()) {
      case "en stock":
        return "bg-cyan-100 text-cyan-800";
      case "en service":
        return "bg-emerald-100 text-emerald-800";
      case "en panne":
        return "bg-red-100 text-red-800";
      case "en réparation":
        return "bg-amber-100 text-amber-800";
      case "fin de vie":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate total quantity assigned to employees for an actif
  const calculateAssignedQuantity = (actif: Actif): number => {
    if (!actif.employees || actif.employees.length === 0) return 0;
    return actif.employees.reduce(
      (total, emp) => total + (emp.quantity || 0),
      0
    );
  };

  // Calculate the libre (available) quantity for an actif
  const calculateLibreQuantity = (actif: Actif): number => {
    const totalQuantity = actif.quantity || 0;
    const assignedQuantity = calculateAssignedQuantity(actif);
    return Math.max(0, totalQuantity - assignedQuantity);
  };

  // Group and count actifs by status
  const getStatusQuantitiesSummary = (actif: Actif): string => {
    if (!actif.quantity || actif.quantity <= 1) {
      return actif.status?.name || "Non défini";
    }

    const assignedQuantity = calculateAssignedQuantity(actif);
    const libreQuantity = calculateLibreQuantity(actif);

    // If there's a mix of assigned and free quantities
    if (assignedQuantity > 0 && libreQuantity > 0) {
      // Determine the correct assignment status term
      let assignedStatus = "Assigné";
      if (
        actif.status?.name.toLowerCase() === "réservé" ||
        actif.status?.name.toLowerCase() === "attribué"
      ) {
        assignedStatus = actif.status.name;
      }

      return `${assignedQuantity} ${assignedStatus}, ${libreQuantity} Disponible`;
    }

    // If all quantities have the same status (all assigned or all free)
    return `${actif.quantity} ${actif.status?.name || "Non défini"}`;
  };

  // Group and count actifs by etat
  const getEtatQuantitiesSummary = (actif: Actif): string => {
    if (!actif.quantity || actif.quantity <= 1) {
      return actif.etat?.name || "Non défini";
    }

    const assignedQuantity = calculateAssignedQuantity(actif);
    const libreQuantity = calculateLibreQuantity(actif);

    // If there's a mix of assigned and available quantities
    if (assignedQuantity > 0 && libreQuantity > 0) {
      // Typically, assigned items are "En service" and available items are "En stock"
      // You can customize this mapping based on your business logic
      const assignedEtat = actif.etat?.name || "En service";
      const availableEtat = "En stock"; // Default état for available items

      return `${assignedQuantity} ${assignedEtat}, ${libreQuantity} ${availableEtat}`;
    }

    // If all quantities have the same état
    return `${actif.quantity} ${actif.etat?.name || "Non défini"}`;
  };

  // Get employee assignment summary
  const getEmployeeAssignmentSummary = (actif: Actif): React.ReactNode => {
    const libreQuantity = calculateLibreQuantity(actif);

    if (!actif.employees || actif.employees.length === 0) {
      // All are libre
      return (
        <span className="text-gray-500">
          Libre {actif.quantity > 1 ? `(${actif.quantity})` : ""}
        </span>
      );
    }

    // Build summary with libre and assigned quantities
    const parts = [];

    // Add libre part if there are unassigned items
    if (libreQuantity > 0) {
      parts.push(
        <span key="libre" className="text-gray-500">
          {libreQuantity} libre
        </span>
      );
    }

    // Add employee assignments
    actif.employees.forEach((emp, index) => {
      if (emp.quantity > 0) {
        parts.push(
          <span key={`emp-${index}`}>
            {emp.quantity} {emp.nom}
          </span>
        );
      }
    });

    if (parts.length === 1) {
      return parts[0];
    }

    // If we have more than one employee or libre + employees
    if (parts.length > 1) {
      return (
        <div className="relative group">
          <span className="cursor-pointer text-blue-600 flex items-center">
            <User className="w-4 h-4 mr-1" />
            {parts[0]} + {parts.length - 1}
          </span>
          <div className="absolute z-10 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg p-2 mt-1 min-w-[200px]">
            <ul className="text-sm">
              {parts.map((part, idx) => (
                <li key={idx} className="py-1 flex justify-between">
                  {part}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    // Fallback
    return <span className="text-gray-500">Libre</span>;
  };

  // This function handles displaying supplier information
  const getFournisseurDisplay = (actif: Actif): React.ReactNode => {
    // Check if actif uses multiple suppliers
    if (actif.fournisseurs && actif.fournisseurs.length > 1) {
      // Multiple suppliers - show summary with popover/tooltip
      const totalSuppliers = actif.fournisseurs.length;

      return (
        <div className="relative group">
          <span className="cursor-pointer text-blue-600 flex items-center">
            <Building className="w-4 h-4 mr-1 text-gray-600" />
            <span>
              {actif.fournisseurs[0].fournisseur?.name || "Non spécifié"} +{" "}
              {totalSuppliers - 1}
            </span>
          </span>
          <div className="absolute z-10 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg p-2 mt-1 min-w-[240px] left-0">
            <h4 className="font-medium mb-1 text-sm text-gray-700">
              Fournisseurs:
            </h4>
            <ul className="text-sm">
              {actif.fournisseurs.map((supplier) => (
                <li
                  key={supplier.fournisseurId}
                  className="py-1 flex justify-between"
                >
                  <span>{supplier.fournisseur?.name || "Non spécifié"}</span>
                  <span className="ml-4 text-gray-500">
                    {supplier.quantity} unité(s)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    } else if (actif.fournisseurs && actif.fournisseurs.length === 1) {
      // Single supplier from fournisseurs array
      return (
        <div className="flex items-center">
          <Building className="w-4 h-4 mr-1 text-gray-600" />
          <span>
            {actif.fournisseurs[0].fournisseur?.name || "Non spécifié"}
          </span>
        </div>
      );
    } else if (actif.fournisseurObj) {
      // Single supplier from fournisseurObj
      return (
        <div className="flex items-center">
          <Building className="w-4 h-4 mr-1 text-gray-600" />
          <span>{actif.fournisseurObj.name}</span>
        </div>
      );
    } else if (
      typeof actif.fournisseur === "object" &&
      actif.fournisseur &&
      "name" in actif.fournisseur
    ) {
      // Single supplier from fournisseur object
      return (
        <div className="flex items-center">
          <Building className="w-4 h-4 mr-1 text-gray-600" />
          <span>{(actif.fournisseur as any).name}</span>
        </div>
      );
    } else if (actif.fournisseur) {
      // Single supplier from string
      return (
        <div className="flex items-center">
          <Building className="w-4 h-4 mr-1 text-gray-600" />
          <span>{String(actif.fournisseur)}</span>
        </div>
      );
    }

    // Default case: no supplier
    return (
      <div className="flex items-center text-gray-400">
        <Building className="w-4 h-4 mr-1" />
        <span>Non spécifié</span>
      </div>
    );
  };

  // Helper to get marque/modele name from objects
  const getMarqueName = (actif: Actif): string => {
    // Use marqueObj which is the correct property in the Actif interface
    if (actif.marqueObj) {
      return actif.marqueObj.name;
    }
    return "Non spécifié";
  };

  const getModeleName = (actif: Actif): string => {
    // Use modeleObj which is the correct property in the Actif interface
    if (actif.modeleObj) {
      return actif.modeleObj.name;
    }
    return "Non spécifié";
  };

  // UPDATED: Fixed download function for actif attachments
  const handleDownloadAttachment = async (
    attachmentId: string,
    fileName: string
  ) => {
    try {
      // Create a URL using the download endpoint
      const downloadUrl = `${
        process.env.NEXT_PUBLIC_API_BASE_URL || "/api"
      }/attachments/${attachmentId}/download`;

      // Get the authorization token
      const token = localStorage.getItem("token");

      // Fetch the file with authorization
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`
        );
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      alert("Erreur lors du téléchargement. Veuillez réessayer.");
    }
  };

  // UPDATED: Fixed download function for license attachments
  const handleDownloadLicenseAttachment = async (
    attachmentId: string,
    fileName: string
  ) => {
    try {
      // Create a URL using the download endpoint
      const downloadUrl = `${
        process.env.NEXT_PUBLIC_API_BASE_URL || "/api"
      }/license-attachments/${attachmentId}/download`;

      // Get the authorization token
      const token = localStorage.getItem("token");

      // Fetch the file with authorization
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`
        );
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading license attachment:", error);
      alert("Erreur lors du téléchargement. Veuillez réessayer.");
    }
  };

  // Modal for showing actif specification details
  const SpecificationDetailsModal = () => {
    if (!selectedActif) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-medium mb-4">
            {getMarqueName(selectedActif)} {getModeleName(selectedActif)} -
            Spécifications
          </h3>

          <div className="space-y-2">
            {selectedActif.specification ? (
              <>
                <p className="flex items-center">
                  <Cpu className="w-4 h-4 mr-2" />
                  <span className="font-medium">CPU:</span>{" "}
                  {selectedActif.specification.cpu || "Non spécifié"}
                </p>
                <p>
                  <span className="font-medium">RAM:</span>
                  {" + "}
                  {selectedActif.specification.ram || "Non spécifié"}
                </p>
                <p>
                  <span className="font-medium">Stockage:</span>{" "}
                  {selectedActif.specification.stockage || "Non spécifié"}
                </p>
                <p>
                  <span className="font-medium">Carte Graphique:</span>{" "}
                  {selectedActif.specification.graphique || "Non spécifié"}
                </p>
              </>
            ) : (
              <p className="text-gray-500">Aucune spécification disponible</p>
            )}

            <div className="mt-4">
              <h4 className="font-medium mb-2">Information Générale</h4>
              <p>
                <span className="font-medium">Numéro de série:</span>{" "}
                {selectedActif.serialNumber}
              </p>
              <div className="flex flex-col space-y-2">
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getStatusColorClass(
                      selectedActif.status?.name
                    )}`}
                  >
                    {getStatusQuantitiesSummary(selectedActif)}
                  </span>
                </p>
                {selectedActif.etat && (
                  <p>
                    <span className="font-medium">État:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getEtatColorClass(
                        selectedActif.etat?.name
                      )}`}
                    >
                      {getEtatQuantitiesSummary(selectedActif)}
                    </span>
                  </p>
                )}
              </div>
              <p>
                <span className="font-medium">Type d`actif:</span>{" "}
                {selectedActif.actiftype?.nom}
              </p>
              {selectedActif.invoiceNumber && (
                <p>
                  <span className="font-medium">Numéro de facture:</span>{" "}
                  {selectedActif.invoiceNumber}
                </p>
              )}
              {selectedActif.warrantyEnd && (
                <p>
                  <span className="font-medium">Fin de garantie:</span>{" "}
                  {formatDate(selectedActif.warrantyEnd)}
                </p>
              )}
            </div>

            {/* Supplier information - Updated for multiple suppliers */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Information Fournisseur</h4>

              {selectedActif.fournisseurs &&
              selectedActif.fournisseurs.length > 0 ? (
                <div>
                  {selectedActif.fournisseurs.length === 1 ? (
                    // Single supplier view
                    <div>
                      <p className="flex items-center">
                        <Building className="w-4 h-4 mr-2" />
                        <span className="font-medium">Fournisseur:</span>{" "}
                        {selectedActif.fournisseurs[0].fournisseur?.name ||
                          "Non spécifié"}
                      </p>

                      {selectedActif.fournisseurs[0].fournisseur?.email && (
                        <p className="ml-6 flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium">Email:</span>{" "}
                          {selectedActif.fournisseurs[0].fournisseur.email}
                        </p>
                      )}

                      {selectedActif.fournisseurs[0].fournisseur?.phone && (
                        <p className="ml-6 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-green-500" />
                          <span className="font-medium">Téléphone:</span>{" "}
                          {selectedActif.fournisseurs[0].fournisseur.phone}
                        </p>
                      )}

                      <p className="ml-6 flex items-center">
                        <span className="font-medium">Quantité:</span>{" "}
                        {selectedActif.fournisseurs[0].quantity}
                      </p>
                    </div>
                  ) : (
                    // Multiple suppliers view
                    <div>
                      <p className="flex items-center mb-2">
                        <Building className="w-4 h-4 mr-2" />
                        <span className="font-medium">
                          Fournisseurs multiples (
                          {selectedActif.fournisseurs.length})
                        </span>
                      </p>

                      <ul className="ml-6 space-y-3">
                        {selectedActif.fournisseurs.map((supplier) => (
                          <li
                            key={supplier.fournisseurId}
                            className="border-l-2 border-blue-200 pl-3"
                          >
                            <p className="font-medium">
                              {supplier.fournisseur?.name || "Non spécifié"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Quantité: {supplier.quantity}
                            </p>

                            {supplier.fournisseur?.email && (
                              <p className="text-sm flex items-center">
                                <Mail className="w-3 h-3 mr-1 text-blue-500" />
                                {supplier.fournisseur.email}
                              </p>
                            )}

                            {supplier.fournisseur?.phone && (
                              <p className="text-sm flex items-center">
                                <Phone className="w-3 h-3 mr-1 text-green-500" />
                                {supplier.fournisseur.phone}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : selectedActif.fournisseurObj ? (
                // Legacy single supplier view
                <div>
                  <p className="flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    <span className="font-medium">Fournisseur:</span>{" "}
                    {selectedActif.fournisseurObj.name}
                  </p>

                  {selectedActif.fournisseurObj.email && (
                    <p className="ml-6 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="font-medium">Email:</span>{" "}
                      {selectedActif.fournisseurObj.email}
                    </p>
                  )}

                  {selectedActif.fournisseurObj.phone && (
                    <p className="ml-6 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-green-500" />
                      <span className="font-medium">Téléphone:</span>{" "}
                      {selectedActif.fournisseurObj.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">
                  Information fournisseur non disponible
                </p>
              )}
            </div>

            {/* Attribution section */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Attribution</h4>
              {selectedActif.employees && selectedActif.employees.length > 0 ? (
                <div>
                  <ul className="space-y-1">
                    {selectedActif.employees.map((emp, index) => (
                      <li key={index}>
                        <span className="font-medium">{emp.nom}</span> -{" "}
                        {emp.quantity} unité(s)
                        {emp.email && (
                          <span className="text-gray-500 ml-1">
                            ({emp.email})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {calculateLibreQuantity(selectedActif) > 0 && (
                    <p className="mt-2 text-gray-600">
                      Unités disponibles:{" "}
                      {calculateLibreQuantity(selectedActif)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">
                  {selectedActif.quantity > 1
                    ? `${selectedActif.quantity} unités disponibles`
                    : "Non attribué"}
                </p>
              )}
            </div>

            {/* UPDATED: Attachments section with fixed download functionality */}
            {selectedActif.attachments &&
              selectedActif.attachments.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">
                    Pièces jointes ({selectedActif.attachments.length})
                  </h4>
                  <ul className="space-y-1">
                    {selectedActif.attachments.map((attachment) => (
                      <li
                        key={attachment.attachmentId}
                        className="text-blue-600 underline cursor-pointer"
                      >
                        <span
                          onClick={() =>
                            handleDownloadAttachment(
                              attachment.attachmentId,
                              attachment.fileName
                            )
                          }
                        >
                          {attachment.fileName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setSelectedActif(null)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition duration-150"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal for showing license details
  const LicenseDetailsModal = () => {
    if (!selectedLicense) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-medium mb-4">
            {selectedLicense.softwareName} {selectedLicense.version} - Détails
          </h3>

          <div className="space-y-2">
            <div className="mt-2">
              <h4 className="font-medium mb-2">Information Licence</h4>
              <p className="flex items-center">
                <Building className="w-4 h-4 mr-2" />
                <span className="font-medium">Fournisseur:</span>{" "}
                {selectedLicense.vendorName || "Non spécifié"}
              </p>
              <p>
                <span className="font-medium">Type de Licence:</span>{" "}
                {selectedLicense.licenseType}
              </p>
              {selectedLicense.licenseKey && (
                <p>
                  <span className="font-medium">Clé de Licence:</span>{" "}
                  {selectedLicense.licenseKey}
                </p>
              )}
              <p>
                <span className="font-medium">Quantité:</span>{" "}
                {selectedLicense.licenseQuantity}
              </p>
              <div className="flex flex-col space-y-2">
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getStatusColorClass(
                      selectedLicense.status?.name
                    )}`}
                  >
                    {selectedLicense.status?.name || "Non défini"}
                    {selectedLicense.licenseQuantity > 1
                      ? ` (${selectedLicense.licenseQuantity})`
                      : ""}
                  </span>
                </p>
                {selectedLicense.etat && (
                  <p>
                    <span className="font-medium">État:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getEtatColorClass(
                        selectedLicense.etat?.name
                      )}`}
                    >
                      {selectedLicense.etat?.name || "Non défini"}
                      {selectedLicense.licenseQuantity > 1
                        ? ` (${selectedLicense.licenseQuantity})`
                        : ""}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-2">
              <h4 className="font-medium mb-2">Dates</h4>
              <p>
                <span className="font-medium">Date d`ajout:</span>{" "}
                {formatDate(selectedLicense.startDate)}
              </p>
              <p>
                <span className="font-medium">Date d`expiration:</span>{" "}
                {formatDate(selectedLicense.expiryDate)}
              </p>
              <p
                className={`${
                  getDaysUntilExpiry(selectedLicense.expiryDate) <= 30
                    ? "text-orange-600"
                    : getDaysUntilExpiry(selectedLicense.expiryDate) <= 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                <span className="font-medium">Statut:</span>{" "}
                {getExpiryStatusText(selectedLicense)}
              </p>
            </div>

            <div className="mt-2">
              <h4 className="font-medium mb-2">Contact</h4>
              {selectedLicense.vendorContact ? (
                <p>
                  <span className="font-medium">Contact Fournisseur:</span>{" "}
                  {selectedLicense.vendorContact}
                </p>
              ) : (
                <p className="text-gray-500">
                  Aucun contact fournisseur spécifié
                </p>
              )}
              {selectedLicense.supportContact ? (
                <p>
                  <span className="font-medium">Contact Support:</span>{" "}
                  {selectedLicense.supportContact}
                </p>
              ) : (
                <p className="text-gray-500">Aucun contact support spécifié</p>
              )}
            </div>

            {/* UPDATED: License attachments section with fixed download functionality */}
            {selectedLicense.attachments &&
              selectedLicense.attachments.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">
                    Pièces jointes ({selectedLicense.attachments.length})
                  </h4>
                  <ul className="space-y-1">
                    {selectedLicense.attachments.map((attachment) => (
                      <li
                        key={attachment.attachmentId}
                        className="text-blue-600 underline cursor-pointer"
                      >
                        <span
                          onClick={() =>
                            handleDownloadLicenseAttachment(
                              attachment.attachmentId,
                              attachment.fileName
                            )
                          }
                        >
                          {attachment.fileName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Attribution section */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Attribution</h4>
              {selectedLicense.employees &&
              selectedLicense.employees.length > 0 ? (
                <div>
                  <ul className="space-y-1">
                    {selectedLicense.employees.map((emp, index) => (
                      <li key={index}>
                        <span className="font-medium">{emp.nom}</span> -{" "}
                        {emp.quantity} licence(s)
                        {emp.email && (
                          <span className="text-gray-500 ml-1">
                            ({emp.email})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {selectedLicense.licenseQuantity -
                    selectedLicense.employees.reduce(
                      (sum, emp) => sum + (emp.quantity || 0),
                      0
                    ) >
                    0 && (
                    <p className="mt-2 text-gray-600">
                      Licences disponibles:{" "}
                      {selectedLicense.licenseQuantity -
                        selectedLicense.employees.reduce(
                          (sum, emp) => sum + (emp.quantity || 0),
                          0
                        )}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">
                  {selectedLicense.licenseQuantity > 1
                    ? `${selectedLicense.licenseQuantity} licences disponibles`
                    : "Non attribuée"}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setSelectedLicense(null)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition duration-150"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Actifs Table */}
      {actifs.length > 0 ||
      (showLicenses && licenses && licenses.length > 0) ? (
        <div className="space-y-8">
          {actifs.length > 0 && (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold p-4 border-b">Hardware</h2>
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("nom")}
                    >
                      Nom {getSortIndicator("nom")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("marque")}
                    >
                      Marque/Modèle {getSortIndicator("marque")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("fournisseur")}
                    >
                      Fournisseur {getSortIndicator("fournisseur")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("category.nom")}
                    >
                      Catégorie {getSortIndicator("category.nom")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("serialNumber")}
                    >
                      N° Série {getSortIndicator("serialNumber")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("status.name")}
                    >
                      Statut {getSortIndicator("status.name")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("etat.name")}
                    >
                      État {getSortIndicator("etat.name")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("dateAjout")}
                    >
                      Date d`ajout {getSortIndicator("dateAjout")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("warrantyEnd")}
                    >
                      Garantie {getSortIndicator("warrantyEnd")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("quantity")}
                    >
                      Quantité {getSortIndicator("quantity")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("employees")}
                    >
                      Occupé {getSortIndicator("employees")}
                    </th>
                    <th className="py-3 px-4 text-center font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {actifs.map((actif) => {
                    const assignedQuantity = calculateAssignedQuantity(actif);

                    return (
                      <tr
                        key={actif.actifId}
                        className="border-b border-gray-200 hover:bg-gray-50 transition duration-150"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {renderActifIcon(actif)}
                            <span>
                              {actif.actifType || getModeleName(actif)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">
                            {getMarqueName(actif)}
                          </span>{" "}
                          {getModeleName(actif)}
                        </td>
                        <td className="py-3 px-4">
                          {getFournisseurDisplay(actif)}
                        </td>
                        <td className="py-3 px-4">
                          {actif.actiftype?.category?.nom || "Aucune catégorie"}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">
                          {actif.serialNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColorClass(
                              actif.status?.name
                            )}`}
                          >
                            {getStatusQuantitiesSummary(actif)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getEtatColorClass(
                              actif.etat?.name
                            )}`}
                          >
                            {getEtatQuantitiesSummary(actif)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {formatDate(actif.dateAjout)}
                        </td>
                        <td className="py-3 px-4">
                          {actif.warrantyEnd ? (
                            <span
                              className={`${
                                new Date(actif.warrantyEnd) < new Date()
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {formatDate(actif.warrantyEnd)}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="py-3 px-4">{actif.quantity || 0}</td>
                        <td className="py-3 px-4">{assignedQuantity}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center space-x-3 z-50">
                            <button
                              onClick={() => {
                                setSelectedActif(actif);
                              }}
                              className="text-purple-600 hover:text-purple-800 transition duration-150"
                              title="Voir détails"
                            >
                              <Info className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => onEdit(actif)}
                              className="text-blue-600 hover:text-blue-800 transition duration-150"
                              title="Modifier"
                            >
                              <Edit className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => onDelete(actif.actifId)}
                              className="text-red-600 hover:text-red-800 transition duration-150"
                              title="Supprimer"
                            >
                              <Trash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Licenses Table */}
          {showLicenses && licenses && licenses.length > 0 && (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold p-4 border-b">Software</h2>
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("softwareName")}
                    >
                      Logiciel {getSortIndicator("softwareName")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("vendorName")}
                    >
                      Fournisseur {getSortIndicator("vendorName")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("licenseType")}
                    >
                      Type {getSortIndicator("licenseType")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("licenseKey")}
                    >
                      Clé {getSortIndicator("licenseKey")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("status.name")}
                    >
                      Statut {getSortIndicator("status.name")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("etat.name")}
                    >
                      État {getSortIndicator("etat.name")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("expiryDate")}
                    >
                      Expiration {getSortIndicator("expiryDate")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("licenseQuantity")}
                    >
                      Quantité {getSortIndicator("licenseQuantity")}
                    </th>
                    <th
                      className="py-3 px-4 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort("employees")}
                    >
                      Occupé {getSortIndicator("employees")}
                    </th>
                    <th className="py-3 px-4 text-center font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((license) => {
                    // Calculate assigned quantity for licenses
                    const assignedQuantity = license.employees
                      ? license.employees.reduce(
                          (sum, emp) => sum + (emp.quantity || 0),
                          0
                        )
                      : 0;

                    const libreQuantity = Math.max(
                      0,
                      license.licenseQuantity - assignedQuantity
                    );

                    return (
                      <tr
                        key={license.licenseId}
                        className="border-b border-gray-200 hover:bg-gray-50 transition duration-150"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <FileText
                              size={20}
                              color="#3182CE"
                              className="inline-block mr-2"
                            />
                            <span className="font-medium">
                              {license.softwareName}&nbsp;
                            </span>
                            {"  "}
                            {license.version}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-1 text-gray-600" />
                            <span>{license.vendorName || "Non spécifié"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{license.licenseType}</td>
                        <td className="py-3 px-4 font-mono text-sm">
                          {license.licenseKey
                            ? truncateText(license.licenseKey, 15)
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              license.status?.name === "Actif" ||
                              license.status?.name === "Disponible"
                                ? "bg-green-100 text-green-800"
                                : license.status?.name === "Expiré" ||
                                  new Date(license.expiryDate) < new Date()
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {license.licenseQuantity > 1
                              ? `${license.licenseQuantity} ${
                                  new Date(license.expiryDate) < new Date()
                                    ? "Expiré"
                                    : license.status?.name || "Non défini"
                                }`
                              : new Date(license.expiryDate) < new Date()
                              ? "Expiré"
                              : license.status?.name || "Non défini"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getEtatColorClass(
                              license.etat?.name
                            )}`}
                          >
                            {license.licenseQuantity > 1
                              ? `${license.licenseQuantity} ${
                                  license.etat?.name || "Non défini"
                                }`
                              : license.etat?.name || "Non défini"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`${
                              getDaysUntilExpiry(license.expiryDate) <= 30
                                ? "text-orange-600"
                                : getDaysUntilExpiry(license.expiryDate) <= 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {formatDate(license.expiryDate)}
                          </span>
                        </td>
                        <td className="py-3 px-4">{license.licenseQuantity}</td>
                        <td className="py-3 px-4">{assignedQuantity}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center space-x-3">
                            <button
                              onClick={() => {
                                setSelectedLicense(license);
                              }}
                              className="text-purple-600 hover:text-purple-800 transition duration-150"
                              title="Voir détails"
                            >
                              <Info className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => onEdit(license)}
                              className="text-blue-600 hover:text-blue-800 transition duration-150"
                              title="Modifier"
                            >
                              <Edit className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => onDelete(license.licenseId)}
                              className="text-red-600 hover:text-red-800 transition duration-150"
                              title="Supprimer"
                            >
                              <Trash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          Aucun élément trouvé...
        </div>
      )}

      {/* Specification Details Modal */}
      {selectedActif && <SpecificationDetailsModal />}

      {/* License Details Modal */}
      {selectedLicense && <LicenseDetailsModal />}
    </>
  );
};

export default ActifsTableView;
