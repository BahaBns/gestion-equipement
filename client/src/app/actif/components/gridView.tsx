"use client";

import {
  getIconForSubcategory,
  getIconColorForCategory,
} from "../../(components)/utils/iconUtils";
import {
  Edit,
  Trash,
  Info,
  FileText,
  Building,
  Phone,
  HelpCircle,
  Activity,
} from "lucide-react";
import { Actif, License } from "@/state/api";
import React from "react";

type GridViewProps = {
  items: (Actif | License)[];
  onEdit: (item: Actif | License) => void;
  onDelete: (id: string) => void;
};

const GridView = ({ items, onEdit, onDelete }: GridViewProps) => {
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

  // Check if the item is a License
  const isLicense = (item: Actif | License): item is License => {
    return (item as License).licenseId !== undefined;
  };

  // Render the icon for an item
  const renderItemIcon = (item: Actif | License) => {
    if (isLicense(item)) {
      // Always use FileText icon for licenses with a blue color
      return <FileText size={36} color="#3182CE" className="mb-2" />;
    } else {
      // For actif (hardware), use existing icon logic
      // Get category through actiftype relationship
      const categoryName = item.actiftype?.category?.nom;
      const IconComponent = getIconForSubcategory(item.actifType, categoryName);
      const iconColor = getIconColorForCategory(categoryName);

      return React.createElement(IconComponent, {
        size: 36,
        color: iconColor,
        className: "mb-2",
      });
    }
  };

  // Check if an item belongs to the "Logiciels" category
  const isSoftwareCategory = (item: Actif | License) => {
    if (isLicense(item)) {
      return true; // All licenses are software
    } else {
      return item.actiftype?.category?.nom === "Logiciels";
    }
  };

  // Truncate long text
  const truncateText = (text: string, maxLength: number = 60) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Get category name through relationship
  const getCategoryName = (item: Actif | License) => {
    if (isLicense(item)) {
      return "Logiciels";
    } else {
      // If actiftype exists and has a category with a name, use it
      if (item.actiftype?.category?.nom) {
        return item.actiftype.category.nom;
      }
      // If actifTypeId exists but no category data, the relation wasn't loaded
      else if (item.actifTypeId) {
        return "Catégorie non trouvée";
      }
      // If no actifTypeId exists, there's truly no category
      else {
        return "Aucune catégorie";
      }
    }
  };

  // Get status name using the updated status relationship
  const getStatusName = (item: Actif | License) => {
    // First check if status object exists and has a name
    if (item.status && item.status.name) {
      // If it's a license, we might want to override with "Expiré" if it's expired
      if (
        isLicense(item) &&
        item.expiryDate &&
        new Date(item.expiryDate) < new Date()
      ) {
        return "Expiré";
      }
      // Otherwise use the status name from the relationship
      return item.status.name;
    }

    // Fallbacks if the status relationship isn't loaded properly
    if (isLicense(item)) {
      // For licenses, check if they're expired when status is missing
      if (item.expiryDate && new Date(item.expiryDate) < new Date()) {
        return "Expiré";
      }
    }

    // Default fallback
    return "Statut inconnu";
  };

  // Get etat name from the etat relationship
  const getEtatName = (item: Actif | License) => {
    // Check if etat object exists and has a name
    if (item.etat && item.etat.name) {
      return item.etat.name;
    }

    // Default fallback
    return "État inconnu";
  };

  // Get status class based on status name
  const getStatusClass = (statusName: string) => {
    switch (statusName) {
      case "Disponible":
        return "bg-green-100 text-green-800";
      case "Attribué":
      case "Réservé":
        return "bg-blue-100 text-blue-800";
      case "En réparation":
        return "bg-orange-100 text-orange-800";
      case "Hors service":
      case "Expiré":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get etat class based on etat name
  const getEtatClass = (etatName: string) => {
    switch (etatName?.toLowerCase()) {
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

  // Get item ID (licenseId or actifId)
  const getItemId = (item: Actif | License): string => {
    return isLicense(item) ? item.licenseId : item.actifId;
  };

  // Calculate days until expiry for licenses
  const getDaysUntilExpiry = (expiryDate: Date | string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get expiry status text
  const getExpiryStatusText = (item: License): string => {
    if (item.daysUntilExpiry !== undefined) {
      // If the API already calculated this for us
      if (item.daysUntilExpiry <= 0) {
        return `Expiré depuis ${Math.abs(item.daysUntilExpiry)} jours`;
      } else {
        return `Expire dans ${item.daysUntilExpiry} jours`;
      }
    } else if (item.expiryDate) {
      // Calculate it ourselves
      const daysLeft = getDaysUntilExpiry(item.expiryDate);
      if (daysLeft <= 0) {
        return `Expiré depuis ${Math.abs(daysLeft)} jours`;
      } else {
        return `Expire dans ${daysLeft} jours`;
      }
    }
    return "";
  };

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        Aucun élément trouvé...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <div
          key={getItemId(item)}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200"
        >
          <div className="p-5">
            <div className="flex flex-col items-center mb-4">
              {renderItemIcon(item)}
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {isLicense(item)
                    ? `${item.softwareName} ${item.version}`
                    : item.actifType}
                </h3>
                <p className="text-sm text-gray-500">{getCategoryName(item)}</p>

                {/* Status and Etat badges */}
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusClass(
                      getStatusName(item)
                    )}`}
                  >
                    {getStatusName(item)}
                  </span>

                  {/* Add Etat badge if etat exists */}
                  {item.etat && (
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getEtatClass(
                        getEtatName(item)
                      )}`}
                    >
                      {getEtatName(item)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm mt-4">
              {/* Common fields */}
              <div className="flex justify-between">
                <span className="font-medium">
                  {isLicense(item) ? "Date d'ajout:" : "Date d'ajout:"}
                </span>
                <span>
                  {formatDate(
                    isLicense(item) ? item.startDate : item.dateAjout
                  )}
                </span>
              </div>

              {/* Item specific fields */}
              {isLicense(item) ? (
                // License specific details
                <>
                  {/* Vendor field */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium flex items-center">
                      <Building className="w-3 h-3 mr-1" />
                      Fournisseur:
                    </span>
                    <span className="text-right">
                      {truncateText(item.vendorName || "Non spécifié", 20)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">Type de licence:</span>
                    <span>{item.licenseType}</span>
                  </div>

                  {/* License key field */}
                  {item.licenseKey && (
                    <div className="flex justify-between">
                      <span className="font-medium">Clé:</span>
                      <span className="text-right">
                        {truncateText(item.licenseKey, 15)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="font-medium">Expiration:</span>
                    <span className="text-right">
                      {formatDate(item.expiryDate)}
                    </span>
                  </div>

                  {/* Show days until expiry for licenses */}
                  {item.expiryDate && (
                    <div className="flex justify-between">
                      <span className="font-medium">Statut:</span>
                      <span
                        className={`text-right ${
                          getDaysUntilExpiry(item.expiryDate) <= 30
                            ? "text-orange-600"
                            : getDaysUntilExpiry(item.expiryDate) <= 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {getExpiryStatusText(item)}
                      </span>
                    </div>
                  )}

                  {/* Contact info with hover display */}
                  {(item.vendorContact || item.supportContact) && (
                    <div className="flex justify-between items-start">
                      <span className="font-medium">Contacts:</span>
                      <div className="text-right relative group">
                        <Phone className="w-4 h-4 cursor-pointer text-blue-600 inline" />
                        <div className="absolute z-10 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg p-2 right-0 mt-1 min-w-[200px]">
                          <ul className="text-sm">
                            {item.vendorContact && (
                              <li className="py-1 text-left">
                                <span className="font-medium">
                                  Fournisseur:
                                </span>{" "}
                                {item.vendorContact}
                              </li>
                            )}
                            {item.supportContact && (
                              <li className="py-1 text-left">
                                <span className="font-medium">Support:</span>{" "}
                                {item.supportContact}
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Actif (hardware) specific details
                <>
                  {/* Supplier field for Actif */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium flex items-center">
                      <Building className="w-3 h-3 mr-1" />
                      Fournisseur:
                    </span>
                    <span className="text-right">
                      {truncateText(item.fournisseur || "Non spécifié", 20)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">Marque / Modèle:</span>
                    <span>
                      {truncateText(
                        `${item.marqueObj?.name || "Unknown Marque"} ${
                          item.modeleObj?.name || "Unknown Modele"
                        }`,
                        20
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">N° de série:</span>
                    <span className="text-right">
                      {truncateText(item.serialNumber, 15)}
                    </span>
                  </div>

                  {/* Warranty Display */}
                  {item.warrantyEnd && (
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {isSoftwareCategory(item) ? "Expiration:" : "Garantie:"}
                      </span>
                      <span>{formatDate(item.warrantyEnd)}</span>
                    </div>
                  )}

                  {/* Display Etat information with icon when hovering for detailed info */}
                  {item.etat && (
                    <div className="flex justify-between items-start">
                      <span className="font-medium flex items-center">
                        <Activity className="w-3 h-3 mr-1" />
                        État:
                      </span>
                      <span className="text-right">{item.etat.name}</span>
                    </div>
                  )}

                  {/* Contact info with hover display for Actif */}
                  {(item.contactFournisseur || item.Contactsupport) && (
                    <div className="flex justify-between items-start">
                      <span className="font-medium">Contacts:</span>
                      <div className="text-right relative group">
                        <Phone className="w-4 h-4 cursor-pointer text-blue-600 inline" />
                        <div className="absolute z-10 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg p-2 right-0 mt-1 min-w-[200px]">
                          <ul className="text-sm">
                            {item.contactFournisseur && (
                              <li className="py-1 text-left">
                                <span className="font-medium">
                                  Fournisseur:
                                </span>{" "}
                                {item.contactFournisseur}
                              </li>
                            )}
                            {item.Contactsupport && (
                              <li className="py-1 text-left">
                                <span className="font-medium">Support:</span>{" "}
                                {item.Contactsupport}
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Quantity for both */}
              <div className="flex justify-between">
                <span className="font-medium">Quantité:</span>
                <span>
                  {isLicense(item) ? item.licenseQuantity : item.quantity}
                </span>
              </div>

              {/* Specifications for actifs */}
              {!isLicense(item) && item.specification && (
                <div className="flex justify-between items-start">
                  <span className="font-medium">Spécifications:</span>
                  <div className="text-right relative group">
                    <Info className="w-4 h-4 cursor-pointer text-blue-600 inline" />
                    <div className="absolute z-10 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg p-2 right-0 mt-1 min-w-[200px]">
                      <ul className="text-sm">
                        {item.specification.ram && (
                          <li className="py-1 text-left">
                            RAM: {item.specification.ram}
                          </li>
                        )}
                        {item.specification.cpu && (
                          <li className="py-1 text-left">
                            CPU: {item.specification.cpu}
                          </li>
                        )}
                        {item.specification.stockage && (
                          <li className="py-1 text-left">
                            Stockage: {item.specification.stockage}
                          </li>
                        )}
                        {item.specification.graphique && (
                          <li className="py-1 text-left">
                            Graphique: {item.specification.graphique}
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Employees for both actifs and licenses */}
              {item.employees && item.employees.length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="font-medium">Exploité par:</span>
                  <div className="text-right">
                    {item.employees.length === 1 ? (
                      <span>{item.employees[0].nom}</span>
                    ) : (
                      <div className="relative group">
                        <span className="cursor-pointer text-blue-600">
                          {item.employees[0].nom} +{item.employees.length - 1}
                        </span>
                        <div className="absolute z-10 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg p-2 right-0 mt-1 min-w-[150px]">
                          <ul className="text-sm">
                            {item.employees.map((employee, index) => (
                              <li key={index} className="py-1 text-left">
                                {employee.nom} ({employee.quantity || 1})
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex border-t border-gray-200">
            <button
              onClick={() => onEdit(item)}
              className="flex-1 py-3 text-blue-600 hover:bg-blue-50 transition duration-150 flex items-center justify-center"
            >
              <Edit className="w-4 h-4 mr-1" />
              Modifier
            </button>
            <div className="border-r border-gray-200"></div>
            <button
              onClick={() => onDelete(getItemId(item))}
              className="flex-1 py-3 text-red-600 hover:bg-red-50 transition duration-150 flex items-center justify-center"
            >
              <Trash className="w-4 h-4 mr-1" />
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GridView;
