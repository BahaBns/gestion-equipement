// utils/actifUtils.ts - UPDATED for assignment-level status
import { Employee, Actif } from "@/state/api";

// Define types for the different possible structures
type ActifAssignment =
  | string
  | {
      actifId: string;
      quantity?: number;
      statusId?: string; // NEW: Assignment-level status ID
      status?: { statusId: string; name: string }; // NEW: Assignment-level status
      assignmentStatus?: { statusId: string; name: string }; // NEW: Alias for assignment status
      assignmentStatusId?: string; // NEW: Alias for assignment status ID
      actif?: { actifId: string };
    };

type LicenseAssignment =
  | string
  | {
      licenseId: string;
      quantity?: number;
      statusId?: string; // NEW: Assignment-level status ID
      status?: { statusId: string; name: string }; // NEW: Assignment-level status
      assignmentStatus?: { statusId: string; name: string }; // NEW: Alias for assignment status
      assignmentStatusId?: string; // NEW: Alias for assignment status ID
      license?: { licenseId: string };
    };

// Type guards for checking nested structures
function hasNestedActif(
  obj: any
): obj is { actif: { actifId: string }; quantity?: number } {
  return (
    obj &&
    typeof obj === "object" &&
    obj.actif &&
    typeof obj.actif === "object" &&
    "actifId" in obj.actif
  );
}

function hasNestedLicense(
  obj: any
): obj is { license: { licenseId: string }; quantity?: number } {
  return (
    obj &&
    typeof obj === "object" &&
    obj.license &&
    typeof obj.license === "object" &&
    "licenseId" in obj.license
  );
}

/**
 * Calculate actif assignment counts across all employees
 */
export const calculateActifAssignmentCounts = (
  employees: Employee[] = [],
  actifs: Actif[] = []
): Record<string, number> => {
  const counts: Record<string, number> = {};

  // Initialize all actifs with count 0
  actifs.forEach((actif) => {
    if (actif.actifId) {
      counts[actif.actifId] = 0;
    }
  });

  // Count assignments for each employee
  employees.forEach((employee) => {
    const employeeActifs = employee.actifs || [];

    employeeActifs.forEach((actif: any) => {
      // Handle different possible data structures
      let actifId;
      let quantity = 1;

      if (typeof actif === "string") {
        // Case 1: actif is just a string ID
        actifId = actif;
      } else if (actif && typeof actif === "object") {
        // Case 2: actif is an object that directly contains actifId
        if ("actifId" in actif) {
          actifId = actif.actifId;
          if ("quantity" in actif && typeof actif.quantity === "number") {
            quantity = actif.quantity;
          }
        }
        // Case 3: actif has a nested actif object
        else if (hasNestedActif(actif)) {
          actifId = actif.actif.actifId;
          if ("quantity" in actif && typeof actif.quantity === "number") {
            quantity = actif.quantity;
          }
        }
      }

      // Update the count if we found a valid actifId
      if (actifId) {
        // Initialize if this is the first time we're seeing this actifId
        if (counts[actifId] === undefined) {
          counts[actifId] = 0;
        }
        counts[actifId] += quantity;
      }
    });
  });

  return counts;
};

/**
 * Calculate license assignment counts across all employees
 */
export const calculateLicenseAssignmentCounts = (
  employees: Employee[] = [],
  licenses: any[] = []
): Record<string, number> => {
  const counts: Record<string, number> = {};

  // Initialize all licenses with count 0
  licenses.forEach((license) => {
    if (license.licenseId) {
      counts[license.licenseId] = 0;
    }
  });

  // Count assignments for each employee
  employees.forEach((employee) => {
    const employeeLicenses = employee.licenses || [];

    employeeLicenses.forEach((license: any) => {
      // Handle different possible data structures
      let licenseId;
      let quantity = 1;

      if (typeof license === "string") {
        // Case 1: license is just a string ID
        licenseId = license;
      } else if (license && typeof license === "object") {
        // Case 2: license is an object that directly contains licenseId
        if ("licenseId" in license) {
          licenseId = license.licenseId;
          if ("quantity" in license && typeof license.quantity === "number") {
            quantity = license.quantity;
          }
        }
        // Case 3: license has a nested license object
        else if (hasNestedLicense(license)) {
          licenseId = license.license.licenseId;
          if ("quantity" in license && typeof license.quantity === "number") {
            quantity = license.quantity;
          }
        }
      }

      // Update the count if we found a valid licenseId
      if (licenseId) {
        // Initialize if this is the first time we're seeing this licenseId
        if (counts[licenseId] === undefined) {
          counts[licenseId] = 0;
        }
        counts[licenseId] += quantity;
      }
    });
  });

  return counts;
};

/**
 * Normalize status name to handle variations in case, spelling, etc.
 */
export const normalizeStatusName = (status: string): string => {
  if (!status) return "";

  const normalized = status.toLowerCase().trim();

  if (
    normalized.includes("reserv") ||
    normalized.includes("réserv") ||
    normalized === "pending"
  ) {
    return "reserved";
  }

  if (
    normalized.includes("assign") ||
    normalized.includes("accepté") ||
    normalized === "accepted"
  ) {
    return "assigned";
  }

  if (normalized.includes("expir") || normalized === "expired") {
    return "expired";
  }

  if (normalized.includes("refus") || normalized.includes("reject")) {
    return "rejected";
  }

  return normalized;
};

/**
 * Extract status information from an assignment object, prioritizing assignment-level status
 */
export const extractActifStatus = (
  actif: any
): {
  statusName: string;
  statusId: string | null;
  isAssignmentLevel: boolean;
} => {
  if (!actif) {
    return { statusName: "", statusId: null, isAssignmentLevel: false };
  }

  // Try various paths to find status information
  let statusName = "";
  let statusId = null;
  let isAssignmentLevel = false;

  if (typeof actif === "object") {
    // PRIORITY 1: Assignment-level status (NEW)
    if (actif.assignmentStatus && typeof actif.assignmentStatus === "object" && actif.assignmentStatus.name) {
      statusName = actif.assignmentStatus.name;
      statusId = actif.assignmentStatus.statusId || actif.assignmentStatusId || null;
      isAssignmentLevel = true;
      console.log(`Found assignment-level status: "${statusName}"`);
    }
    // PRIORITY 2: Direct assignment status ID
    else if (actif.assignmentStatusId || (actif.statusId && actif.assignmentStatus)) {
      statusId = actif.assignmentStatusId || actif.statusId;
      isAssignmentLevel = true;
      console.log(`Found assignment-level status ID: "${statusId}"`);
    }
    // PRIORITY 3: Status object when it's part of an assignment (could be assignment-level)
    else if (actif.status && typeof actif.status === "object" && actif.status.name && !actif.actif) {
      statusName = actif.status.name;
      statusId = actif.status.statusId || null;
      isAssignmentLevel = true; // Assume it's assignment-level if no nested actif
      console.log(`Found status (likely assignment-level): "${statusName}"`);
    }
    // PRIORITY 4: Nested structure with assignment status
    else if (actif.actif && actif.status && typeof actif.status === "object" && actif.status.name) {
      statusName = actif.status.name;
      statusId = actif.status.statusId || null;
      isAssignmentLevel = true;
      console.log(`Found nested assignment status: "${statusName}"`);
    }
    // FALLBACK: Global actif status
    else if (actif.actif && actif.actif.status && typeof actif.actif.status === "object" && actif.actif.status.name) {
      statusName = actif.actif.status.name;
      statusId = actif.actif.status.statusId || null;
      isAssignmentLevel = false;
      console.log(`Found global actif status: "${statusName}"`);
    }
    // OLD STRUCTURE: Direct status object with name property
    else if (actif.status && typeof actif.status === "object" && actif.status.name) {
      statusName = actif.status.name;
      statusId = actif.status.statusId || null;
      isAssignmentLevel = false; // Could be either, assume global for backward compatibility
      console.log(`Found direct status: "${statusName}"`);
    }
    // Status as a direct string property
    else if (actif.status && typeof actif.status === "string") {
      statusName = actif.status;
      isAssignmentLevel = false;
      console.log(`Found string status: "${statusName}"`);
    }
    // Status name as a direct property
    else if (actif.statusName && typeof actif.statusName === "string") {
      statusName = actif.statusName;
      isAssignmentLevel = false;
      console.log(`Found statusName: "${statusName}"`);
    }
    // Status ID as a direct property
    else if (actif.statusId) {
      statusId = actif.statusId;
      isAssignmentLevel = false;
      console.log(`Found statusId: "${statusId}"`);
    }
  }

  return {
    statusName: statusName,
    statusId: statusId,
    isAssignmentLevel: isAssignmentLevel,
  };
};

/**
 * Helper function to derive display status for an employee's actifs
 */
export const getActifDisplayStatus = (
  employeeActifs: any[] = []
): {
  statusToShow: string;
  pendingCount: number;
  acceptedCount: number;
  totalQuantity: number;
} => {
  let pendingCount = 0;
  let acceptedCount = 0;
  let totalQuantity = 0;

  employeeActifs.forEach((actif: any) => {
    let status = "";
    let quantity = 1;

    if (typeof actif === "string") {
      // Just a string ID, count it but can't determine status
      totalQuantity += 1;
    } else if (actif && typeof actif === "object") {
      // Extract status information (prioritizes assignment-level)
      const statusInfo = extractActifStatus(actif);
      status = statusInfo.statusName;

      // Extract quantity
      if ("quantity" in actif && typeof actif.quantity === "number") {
        quantity = actif.quantity;
      } else if (
        actif.actif &&
        "quantity" in actif.actif &&
        typeof actif.actif.quantity === "number"
      ) {
        quantity = actif.actif.quantity;
      }

      // Update counts based on normalized status
      const normalizedStatus = normalizeStatusName(status);
      if (normalizedStatus === "reserved") {
        pendingCount += quantity;
      } else if (normalizedStatus === "assigned") {
        acceptedCount += quantity;
      }

      totalQuantity += quantity;
    }
  });

  // Determine overall status to show
  let statusToShow = "default";

  if (totalQuantity === 0) {
    statusToShow = "default";
  } else if (pendingCount > 0 && acceptedCount > 0) {
    statusToShow = "mixed";
  } else if (pendingCount > 0) {
    statusToShow = "pending";
  } else if (acceptedCount > 0) {
    statusToShow = "accepted";
  }

  return {
    statusToShow,
    pendingCount,
    acceptedCount,
    totalQuantity,
  };
};