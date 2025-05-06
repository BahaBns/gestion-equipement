import { Actif } from "@/state/api";

/**
 * Helper utilities for working with the Actif data structure
 * These functions handle the transition from direct string properties to object relationships
 */

/**
 * Get the display name of the marque (brand) for an asset
 */
export const getMarqueName = (actif: Actif): string => {
  // Use marqueObj from the new structure
  return actif.marqueObj?.name || "N/A";
};

/**
 * Get the display name of the modele (model) for an asset
 */
export const getModeleName = (actif: Actif): string => {
  // Use modeleObj from the new structure
  return actif.modeleObj?.name || "N/A";
};

/**
 * Get the display name of the fournisseur (supplier) for an asset
 * Note: Unlike marque/modele which were removed, fournisseur still exists as a direct property
 */
export const getFournisseurName = (actif: Actif): string => {
  // Prefer the object relationship if available, fallback to direct property
  return actif.fournisseurObj?.name || actif.fournisseur || "N/A";
};

/**
 * Calculate the total quantity of assets assigned to employees
 */
export const getEmployeeAssignedQuantity = (actif: Actif): number => {
  if (!actif.employees || actif.employees.length === 0) return 0;

  return actif.employees.reduce((sum, emp) => sum + (emp.quantity || 0), 0);
};

/**
 * Calculate the total quantity of assets assigned to suppliers
 */
export const getSupplierAssignedQuantity = (actif: Actif): number => {
  let assignedQuantity = 0;

  // Check fournisseurs array
  if (actif.fournisseurs && actif.fournisseurs.length > 0) {
    assignedQuantity += actif.fournisseurs.reduce(
      (sum, fournisseur) => sum + (fournisseur.quantity || 0),
      0
    );
  }

  // Check multipleSuppliers array if useMultipleSuppliers flag is set
  if (
    actif.useMultipleSuppliers === true &&
    actif.multipleSuppliers &&
    actif.multipleSuppliers.length > 0
  ) {
    assignedQuantity += actif.multipleSuppliers.reduce(
      (sum, supplier) => sum + (supplier.quantity || 0),
      0
    );
  }

  // If no explicit assignments via collections but there is a direct fournisseur property,
  // and useMultipleSuppliers is not true, count that as an assignment
  if (
    assignedQuantity === 0 &&
    actif.useMultipleSuppliers !== true &&
    actif.fournisseur &&
    actif.quantity > 0
  ) {
    assignedQuantity = actif.quantity;
  }

  return assignedQuantity;
};

/**
 * Calculate the total assigned quantity of an asset (to both employees and suppliers)
 */
export const getTotalAssignedQuantity = (actif: Actif): number => {
  return (
    getEmployeeAssignedQuantity(actif) + getSupplierAssignedQuantity(actif)
  );
};

/**
 * Determine if an asset has any assignments (to employees or suppliers)
 */
export const hasAnyAssignments = (actif: Actif): boolean => {
  return getTotalAssignedQuantity(actif) > 0;
};
