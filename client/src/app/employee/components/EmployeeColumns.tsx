// components/EmployeeColumns.tsx
import { GridColDef } from "@mui/x-data-grid";
import { Button, Box } from "@mui/material";
import AssignmentStatusBadge from "./AssignmentStatusBadge";
import LicenseStatusBadge from "./LicenseStatusBadge";

type EmployeeColumnProps = {
  handleOpenAssignModal: (employeeId: string) => void;
  handleOpenAssignLicensesModal: (employeeId: string) => void;
  handleShowAssignedActifs: (employeeId: string) => void;
  handleShowAssignedLicenses: (employeeId: string) => void;
  handleOpenDeleteConfirm: (employeeId: string) => void;
};

export const getEmployeeColumns = ({
  handleOpenAssignModal,
  handleOpenAssignLicensesModal,
  handleShowAssignedActifs,
  handleShowAssignedLicenses,
  handleOpenDeleteConfirm,
}: EmployeeColumnProps): GridColDef[] => {
  return [
    { field: "nom", headerName: "Nom", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    {
      field: "actifCount",
      headerName: "Equipements",
      width: 170,
      renderCell: (params) => {
        // Get all actifs assigned to this employee
        const assignedActifs = params.row.actifs || [];

        // Debug: Log actifs structure for this employee
        if (params.row.nom) {
          console.log(
            `Employee ${params.row.nom} actifs structure:`,
            assignedActifs
          );
        }

        // Calculate status counts
        let pendingCount = 0;
        let acceptedCount = 0;
        let totalQuantity = 0;

        assignedActifs.forEach((actif: any) => {
          // Handle different data structures
          let status = "";
          let quantity = 1; // Default quantity if not specified

          if (actif && typeof actif === "object") {
            // IMPROVED STATUS DETECTION
            // Try multiple paths to find status information
            if (
              actif.status &&
              typeof actif.status === "object" &&
              actif.status.name
            ) {
              status = actif.status.name;
              console.log(`Found status.name: "${status}"`);
            } else if (actif.status && typeof actif.status === "string") {
              status = actif.status;
              console.log(`Found status string: "${status}"`);
            } else if (
              actif.actif &&
              actif.actif.status &&
              actif.actif.status.name
            ) {
              status = actif.actif.status.name;
              console.log(`Found actif.status.name: "${status}"`);
            } else if (actif.statusName) {
              status = actif.statusName;
              console.log(`Found statusName: "${status}"`);
            } else if (actif.statusId) {
              // Direct mapping for known status IDs
              if (
                actif.statusId === "STATUS_RESERVED" ||
                actif.statusId === "STA-1"
              ) {
                status = "Réservé";
                console.log(`Mapped statusId to: "${status}"`);
              } else if (
                actif.statusId === "STATUS_ASSIGNE" ||
                actif.statusId === "STATUS_ACCEPTED" ||
                actif.statusId === "STA-2"
              ) {
                status = "Assigné";
                console.log(`Mapped statusId to: "${status}"`);
              } else {
                // Default to Réservé for unknown status IDs
                status = "Réservé";
                console.log(
                  `Unknown statusId in equipment column: ${actif.statusId} - defaulting to Réservé`
                );
              }
            } else if (actif.actif && actif.actif.statusId) {
              // Similar mapping for nested status IDs
              if (
                actif.actif.statusId === "STATUS_RESERVED" ||
                actif.actif.statusId === "STA-1"
              ) {
                status = "Réservé";
                console.log(`Mapped nested statusId to: "${status}"`);
              } else if (
                actif.actif.statusId === "STATUS_ASSIGNE" ||
                actif.actif.statusId === "STATUS_ACCEPTED" ||
                actif.actif.statusId === "STA-2"
              ) {
                status = "Assigné";
                console.log(`Mapped nested statusId to: "${status}"`);
              } else {
                // Default to Réservé for unknown status IDs
                status = "Réservé";
                console.log(
                  `Unknown nested statusId in equipment column: ${actif.actif.statusId} - defaulting to Réservé`
                );
              }
            } else {
              // If no status is found, default to Réservé
              status = "Réservé";
              console.log("No status found for actif, defaulting to Réservé");
            }

            // IMPROVED QUANTITY DETECTION
            // Try multiple paths to find quantity information
            if (typeof actif.quantity === "number") {
              quantity = actif.quantity;
            } else if (
              actif.actif &&
              typeof actif.actif.quantity === "number"
            ) {
              quantity = actif.actif.quantity;
            }

            // IMPROVED STATUS MATCHING with debug logging
            if (status) {
              const normalizedStatus = status.toLowerCase();
              console.log(`Normalized status: "${normalizedStatus}"`);

              // Added EXACT STRING CHECK for Réservé - this line is critical
              if (
                status === "Réservé" ||
                normalizedStatus.includes("reserv") ||
                normalizedStatus.includes("réserv") ||
                normalizedStatus === "pending" ||
                normalizedStatus === "en attente"
              ) {
                pendingCount += quantity;
                console.log(
                  `Pending count increased by ${quantity} to ${pendingCount}`
                );
              } else if (
                status === "Assigné" ||
                normalizedStatus.includes("assign") ||
                normalizedStatus.includes("assigné") ||
                normalizedStatus.includes("accepté") ||
                normalizedStatus === "accepted"
              ) {
                acceptedCount += quantity;
                console.log(
                  `Accepted count increased by ${quantity} to ${acceptedCount}`
                );
              } else {
                // For any other status, assume it's pending
                pendingCount += quantity;
                console.log(
                  `Unrecognized status: "${status}" - adding to pending count`
                );
              }

              totalQuantity += quantity;
            } else {
              // If we couldn't determine status, default to pending
              pendingCount += quantity;
              totalQuantity += quantity;
              console.log(
                "Couldn't determine status for equipment, defaulting to pending"
              );
              console.log("Actif data:", actif);
            }
          } else if (typeof actif === "string") {
            // Handle case where actif is just a string ID
            // Default to pending for string IDs
            pendingCount += 1;
            totalQuantity += 1;
            console.log("Actif is a string ID, defaulting to pending");
          }
        });

        // Determine the overall status to display
        let statusToShow = "reserved"; // CHANGED FROM "pending" TO "reserved"

        if (totalQuantity === 0) {
          statusToShow = "default";
          console.log("Setting status to default (no items)");
        } else if (pendingCount > 0 && acceptedCount > 0) {
          statusToShow = "mixed";
          console.log(
            `Setting status to mixed (pending: ${pendingCount}, accepted: ${acceptedCount})`
          );
        } else if (pendingCount > 0) {
          statusToShow = "reserved"; // CHANGED FROM "pending" TO "reserved"
          console.log(`Setting status to reserved (count: ${pendingCount})`);
        } else if (acceptedCount > 0) {
          statusToShow = "accepted";
          console.log(`Setting status to accepted (count: ${acceptedCount})`);
        } else {
          statusToShow = "default";
          console.log(
            `Setting status to default (total: ${totalQuantity}, but no recognized statuses)`
          );
        }

        // Debug what we're passing to the component
        console.log(
          `BADGE INPUT: status=${statusToShow}, pendingCount=${pendingCount}, acceptedCount=${acceptedCount}, totalCount=${totalQuantity}`
        );

        return (
          <AssignmentStatusBadge
            status={statusToShow}
            pendingCount={pendingCount}
            acceptedCount={acceptedCount}
            totalCount={totalQuantity}
            showCounts={true}
            size="small"
          />
        );
      },
    },
    {
      field: "licenseCount",
      headerName: "Licences",
      width: 170,
      renderCell: (params) => {
        // Get all licenses assigned to this employee
        const assignedLicenses = params.row.licenses || [];

        // Calculate status counts for licenses
        let pendingCount = 0;
        let acceptedCount = 0;
        let totalQuantity = 0;
        let expiringCount = 0;

        assignedLicenses.forEach((license: any) => {
          // Handle different data structures
          let status = "";
          let quantity = 1; // Default quantity if not specified
          let expiryDate: Date | null = null;

          if (license && typeof license === "object") {
            // IMPROVED STATUS DETECTION
            // Try multiple paths to find status information
            if (
              license.status &&
              typeof license.status === "object" &&
              license.status.name
            ) {
              status = license.status.name;
            } else if (license.status && typeof license.status === "string") {
              status = license.status;
            } else if (
              license.license &&
              license.license.status &&
              license.license.status.name
            ) {
              status = license.license.status.name;
            } else if (license.statusName) {
              status = license.statusName;
            } else if (license.statusId) {
              // Direct mapping for known status IDs
              if (
                license.statusId === "STATUS_RESERVED" ||
                license.statusId === "STA-1"
              ) {
                status = "Réservé";
              } else if (
                license.statusId === "STATUS_ASSIGNE" ||
                license.statusId === "STATUS_ACCEPTED" ||
                license.statusId === "STA-2"
              ) {
                status = "Assigné";
              } else {
                // Default to Réservé for unknown status IDs
                status = "Réservé";
                console.log(
                  `Unknown statusId in license column: ${license.statusId} - defaulting to Réservé`
                );
              }
            } else if (license.license && license.license.statusId) {
              // Similar mapping for nested status IDs
              if (
                license.license.statusId === "STATUS_RESERVED" ||
                license.license.statusId === "STA-1"
              ) {
                status = "Réservé";
              } else if (
                license.license.statusId === "STATUS_ASSIGNE" ||
                license.license.statusId === "STATUS_ACCEPTED" ||
                license.license.statusId === "STA-2"
              ) {
                status = "Assigné";
              } else {
                // Default to Réservé for unknown status IDs
                status = "Réservé";
                console.log(
                  `Unknown nested statusId in license column: ${license.license.statusId} - defaulting to Réservé`
                );
              }
            } else {
              // If no status is found, default to Réservé
              status = "Réservé";
              console.log("No status found for license, defaulting to Réservé");
            }

            // IMPROVED QUANTITY DETECTION
            // Try multiple paths to find quantity information
            if (typeof license.quantity === "number") {
              quantity = license.quantity;
            } else if (
              license.license &&
              typeof license.license.quantity === "number"
            ) {
              quantity = license.license.quantity;
            }

            // Get expiry date
            if (license.expiryDate) {
              expiryDate = new Date(license.expiryDate);
            } else if (license.license?.expiryDate) {
              expiryDate = new Date(license.license.expiryDate);
            }

            // IMPROVED STATUS MATCHING
            // Case-insensitive comparisons and check for partial matches
            const normalizedStatus = status.toLowerCase();
            if (
              status === "Réservé" ||
              normalizedStatus.includes("reserv") ||
              normalizedStatus.includes("réserv") ||
              normalizedStatus === "pending" ||
              normalizedStatus === "en attente"
            ) {
              pendingCount += quantity;
            } else if (
              status === "Assigné" ||
              normalizedStatus.includes("assign") ||
              normalizedStatus.includes("assigné") ||
              normalizedStatus.includes("accepté") ||
              normalizedStatus === "accepted"
            ) {
              acceptedCount += quantity;

              // Check if license is expiring soon (within 30 days)
              if (expiryDate) {
                const daysUntilExpiry = Math.ceil(
                  (expiryDate.getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
                  expiringCount += quantity;
                }
              }
            } else {
              // For unknown statuses, assume pending
              pendingCount += quantity;
              console.log(
                `Unrecognized license status: "${status}" - adding to pending count`
              );
            }

            totalQuantity += quantity;
          } else if (typeof license === "string") {
            // Handle case where license is just a string ID
            // Default to pending for string IDs
            pendingCount += 1;
            totalQuantity += 1;
            console.log("License is a string ID, defaulting to pending");
          }
        });

        // Determine the overall status to display
        let statusToShow = "default";

        if (totalQuantity === 0) {
          statusToShow = "default";
        } else if (pendingCount > 0 && acceptedCount > 0) {
          statusToShow = "mixed";
        } else if (pendingCount > 0) {
          statusToShow = "pending";
        } else if (expiringCount > 0) {
          statusToShow = "expiring";
        } else if (acceptedCount > 0) {
          statusToShow = "accepted";
        }

        return (
          <LicenseStatusBadge
            status={statusToShow}
            pendingCount={pendingCount}
            acceptedCount={acceptedCount}
            totalCount={totalQuantity}
            expiringCount={expiringCount}
            showCounts={true}
            size="small"
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 400,
      renderCell: (params) => (
        <Box className="flex space-x-2">
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenAssignModal(params.row.employeeId)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: "bold",
              padding: "6px 12px",
              minWidth: "100px",
              backgroundColor: "#1976d2",
              "&:hover": { backgroundColor: "#1565c0" },
            }}
          >
            Rés. Equip.
          </Button>

          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleOpenAssignLicensesModal(params.row.employeeId)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: "bold",
              padding: "6px 12px",
              minWidth: "100px",
              backgroundColor: "#9c27b0",
              "&:hover": { backgroundColor: "#7b1fa2" },
            }}
          >
            Rés. Lic.
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={() => handleShowAssignedActifs(params.row.employeeId)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: "bold",
              padding: "6px 12px",
              minWidth: "100px",
            }}
          >
            Voir équip.
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleShowAssignedLicenses(params.row.employeeId)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: "bold",
              padding: "6px 12px",
              minWidth: "100px",
            }}
          >
            Voir lic.
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={() => handleOpenDeleteConfirm(params.row.employeeId)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: "bold",
              padding: "6px 12px",
              minWidth: "100px",
              backgroundColor: "#d32f2f",
              "&:hover": { backgroundColor: "#b71c1c" },
            }}
          >
            Supprimer
          </Button>
        </Box>
      ),
    },
  ];
};
