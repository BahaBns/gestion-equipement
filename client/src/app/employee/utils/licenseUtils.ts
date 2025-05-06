// utils/licenseUtils.ts
import { License, Employee } from "@/state/api";

// Define interfaces for the different possible structures
interface LicenseAssignmentWithDirectId {
  licenseId: string;
  quantity?: number;
}

interface LicenseAssignmentWithNestedLicense {
  license: {
    licenseId: string;
  };
  quantity?: number;
}

// Type for all possible license assignment structures
type LicenseAssignment = 
  | string 
  | LicenseAssignmentWithDirectId 
  | LicenseAssignmentWithNestedLicense;

// Type guard to check if an object has a nested license structure
function hasNestedLicense(obj: any): obj is LicenseAssignmentWithNestedLicense {
  return (
    obj && 
    typeof obj === "object" && 
    "license" in obj &&
    obj.license && 
    typeof obj.license === "object" && 
    "licenseId" in obj.license
  );
}

/**
 * Calculates how many of each license have been assigned across all employees
 */
export const calculateLicenseAssignmentCounts = (
  employees: Employee[],
  licenses: License[]
): Record<string, number> => {
  const counts: Record<string, number> = {};

  // Initialize counts with 0 for all licenses
  licenses.forEach((license) => {
    counts[license.licenseId] = 0;
  });

  // Count assignments for each license
  employees.forEach((employee) => {
    if (
      employee.licenses &&
      Array.isArray(employee.licenses) &&
      employee.licenses.length > 0
    ) {
      employee.licenses.forEach((licenseItem: any) => {
        // Handle different possible structures of the license item
        let licenseId: string | undefined;
        let quantity: number = 1; // Default to 1 if not specified

        if (typeof licenseItem === "string") {
          // Case 1: licenseItem is just the licenseId as a string
          licenseId = licenseItem;
        } else if (licenseItem && typeof licenseItem === "object") {
          if ("licenseId" in licenseItem) {
            // Case 2: licenseItem has direct licenseId property
            licenseId = licenseItem.licenseId;
            // Check if quantity exists and is a number
            if (
              "quantity" in licenseItem &&
              typeof licenseItem.quantity === "number"
            ) {
              quantity = licenseItem.quantity;
            }
          } else if (hasNestedLicense(licenseItem)) {
            // Case 3: licenseItem has a nested license object
            licenseId = licenseItem.license.licenseId;
            // Check if quantity exists and is a number
            if (
              "quantity" in licenseItem &&
              typeof licenseItem.quantity === "number"
            ) {
              quantity = licenseItem.quantity;
            }
          }
        }

        // Add to counts if we successfully determined the licenseId
        if (licenseId) {
          counts[licenseId] = (counts[licenseId] || 0) + quantity;
        }
      });
    }
  });

  return counts;
};

/**
 * Gets the number of available copies of a license that can be assigned
 *
 * @param license The license to check
 * @param assignmentCounts Record of current assignments
 * @returns Number of available copies
 */
export const getAvailableQuantity = (
  license: License,
  assignmentCounts: Record<string, number>
): number => {
  const currentAssignments = assignmentCounts[license.licenseId] || 0;
  return Math.max(0, license.licenseQuantity - currentAssignments);
};

/**
 * Checks if a license is fully assigned (no copies left to assign)
 *
 * @param license The license to check
 * @param assignmentCounts Record of current assignments
 * @returns True if fully assigned, false otherwise
 */
export const isLicenseFullyAssigned = (
  license: License,
  assignmentCounts: Record<string, number>
): boolean => {
  return getAvailableQuantity(license, assignmentCounts) <= 0;
};
