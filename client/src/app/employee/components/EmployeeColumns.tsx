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
  headerName: "Équipements",
  width: 170,
  renderCell: (params) => {
    const assignedActifs = params.row.actifs || [];

    console.log(`Employee ${params.row.nom} actifs structure:`, assignedActifs);

    let pendingCount = 0;
    let acceptedCount = 0;
    let totalQuantity = 0;

    assignedActifs.forEach((actif: any) => {
      let status = "";
      let quantity = 1;

      if (actif && typeof actif === "object") {
        // 🔥 UPDATED: Check assignment-level status FIRST
        if (actif.assignmentStatus && actif.assignmentStatus.name) {
          status = actif.assignmentStatus.name;
          console.log(`✅ Found assignment-level status: "${status}"`);
        }
        // Fallback to assignmentStatusId mapping
        else if (actif.assignmentStatusId) {
          // Map common status IDs
          if (actif.assignmentStatusId.includes("RESERVED") || actif.assignmentStatusId === "STA-1") {
            status = "Réservé";
          } else if (actif.assignmentStatusId.includes("ASSIGNED") || actif.assignmentStatusId === "STA-2") {
            status = "Assigné";
          } else {
            status = "Réservé"; // Default
          }
          console.log(`📍 Mapped assignmentStatusId "${actif.assignmentStatusId}" to "${status}"`);
        }
        // Legacy fallback for old data structure
        else if (actif.status && typeof actif.status === "object" && actif.status.name) {
          status = actif.status.name;
          console.log(`⚠️ Using legacy status: "${status}"`);
        }
        else {
          status = "Réservé";
          console.log(`❌ No status found, defaulting to "Réservé"`);
        }

        // Get quantity (prioritize assignment quantity)
        if (typeof actif.assignmentQuantity === "number") {
          quantity = actif.assignmentQuantity;
        } else if (typeof actif.quantity === "number") {
          quantity = actif.quantity;
        }

        // Count based on status
        const normalizedStatus = status.toLowerCase();
        if (
          status === "Réservé" ||
          normalizedStatus.includes("reserv") ||
          normalizedStatus.includes("réserv") ||
          normalizedStatus === "pending" ||
          normalizedStatus === "en attente"
        ) {
          pendingCount += quantity;
          console.log(`📊 Added ${quantity} to pending (total: ${pendingCount})`);
        } else if (
          status === "Assigné" ||
          normalizedStatus.includes("assign") ||
          normalizedStatus.includes("assigné") ||
          normalizedStatus.includes("accepté") ||
          normalizedStatus === "accepted"
        ) {
          acceptedCount += quantity;
          console.log(`📊 Added ${quantity} to accepted (total: ${acceptedCount})`);
        } else {
          pendingCount += quantity;
          console.log(`📊 Unknown status "${status}", added ${quantity} to pending`);
        }

        totalQuantity += quantity;
      }
    });

    // Determine overall status to display
    let statusToShow = "default";

    if (totalQuantity === 0) {
      statusToShow = "default";
    } else if (pendingCount > 0 && acceptedCount > 0) {
      statusToShow = "mixed";
    } else if (pendingCount > 0) {
      statusToShow = "reserved";
    } else if (acceptedCount > 0) {
      statusToShow = "accepted";
    }

    console.log(
      `🎯 FINAL RESULT: status=${statusToShow}, pending=${pendingCount}, accepted=${acceptedCount}, total=${totalQuantity}`
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
        // Similar updates for licenses...
        const assignedLicenses = params.row.licenses || [];

        let pendingCount = 0;
        let acceptedCount = 0;
        let totalQuantity = 0;
        let expiringCount = 0;

        assignedLicenses.forEach((license: any) => {
          let status = "";
          let quantity = 1;
          let expiryDate: Date | null = null;

          if (license && typeof license === "object") {
            // UPDATED: Check assignment-level status first
            if (license.assignmentStatus && license.assignmentStatus.name) {
              status = license.assignmentStatus.name;
            }
            // Fallback logic similar to actifs
            else if (license.status && typeof license.status === "object" && license.status.name) {
              status = license.status.name;
            }
            else if (license.license && license.status && license.status.name) {
              status = license.status.name;
            }
            else if (license.license && license.license.status && license.license.status.name) {
              status = license.license.status.name;
            }
            else {
              status = "Réservé";
            }

            // Extract quantity and expiry date
            if (typeof license.quantity === "number") {
              quantity = license.quantity;
            }

            if (license.expiryDate) {
              expiryDate = new Date(license.expiryDate);
            } else if (license.license?.expiryDate) {
              expiryDate = new Date(license.license.expiryDate);
            }

            // Count based on status
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

              // Check for expiring licenses
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
              pendingCount += quantity;
            }

            totalQuantity += quantity;
          }
        });

        // Determine overall status
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