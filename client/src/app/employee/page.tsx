"use client";

import { useState, useEffect, useRef } from "react";
import {
  useGetEmployeesQuery,
  useGetActifsQuery,
  useGetLicensesQuery,
  useDeleteEmployeeMutation,
  useCreateEmployeeMutation,
  useAssignActifsToEmployeeMutation,
  useRemoveActifsFromEmployeeMutation,
  useAssignLicensesToEmployeeMutation,
  useRemoveLicensesFromEmployeeMutation,
  useUpdateActifStatusMutation,
  useUpdateLicenseStatusMutation,
  useGetStatusesQuery,
  useDownloadAttachmentQuery,
  useUpdateEmployeeMutation,
  License,
  Employee,
  Actif,
  EmployeeLicense,
} from "@/state/api";
import Header from "@/app/(components)/Header";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridColumnHeaderParams,
} from "@mui/x-data-grid";
import { getEmployeeColumns } from "./components/EmployeeColumns";
import CreateEmployeeDialog from "./components/CreateEmployeeDialog";
import UpdateEmployeeDialog from "./components/UpdateEmployeeDialog"; 
import DeleteConfirmationDialog from "./components/DeleteConfirmationDialog";
import AssignActifsDialog from "./components/AssignActifsDialog";
import AssignLicensesDialog from "./components/AssignLicensesDialog";
import ShowAssignedActifsDialog from "./components/ShowAssignedActifsDialog";
import ShowAssignedLicensesDialog from "./components/ShowAssignedLicensesDialog";
import RemoveActifDialog from "./components/RemoveActifDialog";
import RemoveLicencesDialog from "./components/RemoveLicenseDialog";
import ContractDialog from "./components/ContractDialog";
import { calculateActifAssignmentCounts } from "./utils/actifUtils";
import { calculateLicenseAssignmentCounts } from "./utils/licenseUtils";
import {
  UserPlus,
  Package,
  Key,
  Eye,
  Trash2,
  Download,
  Edit,
} from "lucide-react";
import { Button } from "@/app/(components)/Button";
import { Snackbar, Alert, Tab, Tabs } from "@mui/material";
import { ReactNode } from "react";

// Define interface for processed assigned licenses to match ShowAssignedLicensesDialog expectations
interface AssignedLicense {
  licenseId: string;
  softwareName: string;
  version: string;
  licenseType: string;
  licenseKey: string;
  quantity: number;
  expiryDate: string | Date;
  assignedAt: string | Date;
}

// Define interface for processed license item to help with type narrowing
interface ProcessedLicenseItem {
  licenseId: string;
  softwareName?: string;
  version?: string;
  licenseType?: string;
  licenseKey?: string;
  quantity?: number;
  expiryDate?: string | Date;
  assignedAt?: string | Date;
  license?: {
    licenseId: string;
    softwareName: string;
    version: string;
    licenseType?: string;
    licenseKey?: string;
    expiryDate?: string | Date;
  };
}

// Style for z-index handling
const additionalStyles = `
  .MuiDataGrid-row {
    position: relative;
    z-index: 1;
  }
  .MuiDataGrid-row:hover {
    z-index: 2;
  }
  .dropdown-open {
    z-index: 1000 !important;
    position: absolute;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  /* Solution pour la dernière ligne */
  .MuiDataGrid-row:last-child .absolute {
    bottom: 100%;
    top: auto !important;
  }
`;

const Users = () => {
  const {
    data: employees,
    isError,
    isLoading,
    refetch,
  } = useGetEmployeesQuery();
  const { data: actifs } = useGetActifsQuery();
  const { data: licenses } = useGetLicensesQuery();
  const { data: statuses } = useGetStatusesQuery();

  const [deleteEmployee] = useDeleteEmployeeMutation();
  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation(); // Add the update employee mutation
  const [assignActifs] = useAssignActifsToEmployeeMutation();
  const [removeActifs] = useRemoveActifsFromEmployeeMutation();
  const [assignLicenses] = useAssignLicensesToEmployeeMutation();
  const [removeLicenses] = useRemoveLicensesFromEmployeeMutation();
  const [updateActifStatus] = useUpdateActifStatusMutation();
  const [updateLicenseStatus] = useUpdateLicenseStatusMutation();

  // Ref for dropdown elements
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // New state for dropdown management
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: string | null;
  }>({});

  // Modal states
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false); // New state for update modal
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [openAssignLicensesModal, setOpenAssignLicensesModal] = useState(false);
  const [openShowAssignedModal, setOpenShowAssignedModal] = useState(false);
  const [openShowAssignedLicensesModal, setOpenShowAssignedLicensesModal] =
    useState(false);
  const [openContractDialog, setOpenContractDialog] = useState(false);

  // The notification system (if not already implemented)
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Data states
  const [newEmployee, setNewEmployee] = useState({ nom: "", email: "" });
  const [employeeToUpdate, setEmployeeToUpdate] = useState<{
    employeeId: string;
    nom: string;
    email: string;
  }>({
    employeeId: "",
    nom: "",
    email: "",
  }); // New state for employee to update
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );

  // Actif states
  const [selectedActifs, setSelectedActifs] = useState<string[]>([]);
  const [assignedActifs, setAssignedActifs] = useState<any[]>([]);
  const [actifToRemove, setActifToRemove] = useState<string | null>(null);
  const [actifAssignmentCounts, setActifAssignmentCounts] = useState<
    Record<string, number>
  >({});
  const [employeeAssignedActifs, setEmployeeAssignedActifs] = useState<
    string[]
  >([]);
  const [contractActifId, setContractActifId] = useState<string | null>(null);

  // License states
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [assignedLicenses, setAssignedLicenses] = useState<AssignedLicense[]>(
    []
  );
  const [licenseToRemove, setLicenseToRemove] = useState<string | null>(null);
  const [licenseAssignmentCounts, setLicenseAssignmentCounts] = useState<
    Record<string, number>
  >({});
  const [employeeAssignedLicenses, setEmployeeAssignedLicenses] = useState<
    string[]
  >([]);

  const [isContractDownloading, setIsContractDownloading] = useState(false);
  const [isPendingLicenseRemoval, setIsPendingLicenseRemoval] = useState(false);

  // Monitor modal state changes
  useEffect(() => {
    console.log("openAssignModal changed to:", openAssignModal);
  }, [openAssignModal]);

  useEffect(() => {
    console.log("openShowAssignedModal changed to:", openShowAssignedModal);
  }, [openShowAssignedModal]);

  useEffect(() => {
    console.log("openAssignLicensesModal changed to:", openAssignLicensesModal);
  }, [openAssignLicensesModal]);

  useEffect(() => {
    console.log(
      "openShowAssignedLicensesModal changed to:",
      openShowAssignedLicensesModal
    );
  }, [openShowAssignedLicensesModal]);

  // Effect to close dropdowns when clicking outside (improved)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close dropdowns if we're clicking on a dropdown item
      // This gives the dropdown item's click handler time to execute
      if ((e.target as Element).closest(".dropdown-menu-item")) {
        return;
      }

      setOpenDropdowns({});
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calculate actif and license assignment counts
  useEffect(() => {
    if (employees && actifs) {
      const counts = calculateActifAssignmentCounts(employees, actifs);
      setActifAssignmentCounts(counts);
    }

    if (employees && licenses) {
      const counts = calculateLicenseAssignmentCounts(employees, licenses);
      setLicenseAssignmentCounts(counts);
    }
  }, [employees, actifs, licenses]);

  // Update employeeAssignedLicenses when selectedEmployeeId changes
  useEffect(() => {
    if (selectedEmployeeId && employees) {
      const employee = employees.find(
        (emp) => emp.employeeId === selectedEmployeeId
      );

      if (employee) {
        console.log("Selected employee data:", employee);

        // Extract the actifIds from the employee's assigned actifs
        if (employee.actifs && Array.isArray(employee.actifs)) {
          const assignedActifIds = employee.actifs.map((actif) =>
            typeof actif === "string" ? actif : actif.actifId
          );
          setEmployeeAssignedActifs(assignedActifIds);
        } else {
          setEmployeeAssignedActifs([]);
        }

        // Enhanced license data extraction
        if (employee.licenses && Array.isArray(employee.licenses)) {
          console.log("Employee licenses data:", employee.licenses);

          // Support multiple data structures the API might return
          const assignedLicenseIds: string[] = [];

          for (const license of employee.licenses) {
            let licenseId: string | null = null;

            // Handle case where license is a string ID
            if (typeof license === "string") {
              licenseId = license;
            }
            // Handle case where license is an object with licenseId
            else if (typeof license === "object" && license !== null) {
              if ("licenseId" in license && license.licenseId) {
                licenseId = license.licenseId as string;
              }
              // Handle case where license has a nested license object
              else if (
                "license" in license &&
                license.license &&
                typeof license.license === "object" &&
                "licenseId" in license.license
              ) {
                licenseId = license.license.licenseId as string;
              }
            }

            if (licenseId) {
              assignedLicenseIds.push(licenseId);
            }
          }

          console.log("Extracted assigned license IDs:", assignedLicenseIds);
          setEmployeeAssignedLicenses(assignedLicenseIds);
        } else {
          setEmployeeAssignedLicenses([]);
        }
      } else {
        setEmployeeAssignedActifs([]);
        setEmployeeAssignedLicenses([]);
      }
    } else {
      setEmployeeAssignedActifs([]);
      setEmployeeAssignedLicenses([]);
    }
  }, [selectedEmployeeId, employees]);

  // Handlers with added debugging
  const handleOpenDeleteConfirm = (employeeId: string) => {
    setEmployeeToDelete(employeeId);
    setOpenDeleteConfirm(true);
  };

  // New handler for opening the update modal
  const handleOpenUpdateModal = (employeeId: string) => {
    const employee = employees?.find((emp) => emp.employeeId === employeeId);
    if (employee) {
      setEmployeeToUpdate({
        employeeId: employee.employeeId,
        nom: employee.nom,
        email: employee.email,
      });
      setOpenUpdateModal(true);
    }
  };

  // New handler for updating an employee
  const handleUpdate = async () => {
    try {
      await updateEmployee({
        employeeId: employeeToUpdate.employeeId,
        nom: employeeToUpdate.nom,
        email: employeeToUpdate.email,
      }).unwrap();
      setOpenUpdateModal(false);
      refetch();
      showNotification("Employé mis à jour avec succès", "success");
    } catch (error) {
      console.error("Failed to update employee:", error);
      showNotification("Échec de la mise à jour de l'employé", "error");
    }
  };

  const refetchEmployeeActifs = async () => {
    if (selectedEmployeeId && employees) {
      try {
        // Option 1: Refetch from the API directly
        const response = await fetch(
          `/api/employee/${selectedEmployeeId}/actifs`
        );
        if (response.ok) {
          const data = await response.json();
          setAssignedActifs(data);
        }

        // Option 2: Alternatively, refetch all employees data and update
        await refetch(); // This is the refetch function from your useGetEmployeesQuery hook

        // Then update the assigned actifs from the refreshed data
        const refreshedEmployee = employees?.find(
          (emp) => emp.employeeId === selectedEmployeeId
        );
        if (refreshedEmployee) {
          setAssignedActifs(refreshedEmployee.actifs || []);
        }
      } catch (error) {
        console.error("Failed to refresh actifs:", error);
      }
    }
  };

  const handleDelete = async () => {
    if (employeeToDelete) {
      try {
        await deleteEmployee(employeeToDelete).unwrap();
        setOpenDeleteConfirm(false);
        setEmployeeToDelete(null);
        refetch();
        showNotification("Employé supprimé avec succès", "success");
      } catch (error) {
        console.error("Failed to delete employee:", error);
        showNotification("Échec de la suppression de l'employé", "error");
      }
    }
  };

  const handleCreate = async () => {
    try {
      await createEmployee(newEmployee).unwrap();
      setOpenCreateModal(false);
      setNewEmployee({ nom: "", email: "" });
      refetch();
      showNotification("Employé créé avec succès", "success");
    } catch (error) {
      console.error("Failed to create employee:", error);
      showNotification("Échec de la création de l'employé", "error");
    }
  };

  // Actif Handlers with debugging
  const handleOpenAssignModal = (employeeId: string) => {
    console.log("handleOpenAssignModal called with:", employeeId);
    setSelectedEmployeeId(employeeId);
    setOpenAssignModal(true); // This should open the modal
    setSelectedActifs([]);
    console.log("openAssignModal set to:", true);
  };

  const handleAssignActifs = async (quantities?: Record<string, number>) => {
    if (selectedEmployeeId && selectedActifs.length > 0) {
      try {
        // Find the "Réservé" status
        const reservedStatus = statuses?.find(
          (status) => status.name === "Réservé"
        );

        if (!reservedStatus) {
          showNotification(
            "Statut 'Réservé' non trouvé dans le système",
            "error"
          );
          return;
        }

        // Assign actifs to employee with the new API that handles email notification
        const result = await assignActifs({
          employeeId: selectedEmployeeId,
          actifIds: selectedActifs,
          quantities: quantities || {},
        }).unwrap();

        setOpenAssignModal(false);
        setSelectedActifs([]);

        // Force refresh to get the latest data
        await refetch();

        // Show appropriate notification based on the API response
        if (result && typeof result === "object" && "emailSent" in result) {
          showNotification(
            result.emailSent
              ? "Équipements réservés avec succès et notification envoyée à l'employé"
              : "Équipements réservés mais l'envoi de l'email a échoué. L'employé devra être notifié manuellement.",
            result.emailSent ? "success" : "warning"
          );
        } else {
          showNotification("Équipements réservés avec succès", "success");
        }

        return result;
      } catch (error) {
        console.error("Échec de réservation des équipements:", error);
        showNotification("Échec de réservation des équipements", "error");
        throw error;
      }
    }
  };

  const handleShowAssignedActifs = (employeeId: string) => {
    console.log("handleShowAssignedActifs called with:", employeeId);
    const employee = employees?.find((emp) => emp.employeeId === employeeId);
    if (employee) {
      console.log("Found employee:", employee);
      console.log("Employee actifs:", employee.actifs);
      setAssignedActifs(employee.actifs || []);
      setSelectedEmployeeId(employeeId);
      setOpenShowAssignedModal(true);
      console.log("openShowAssignedModal set to:", true);
    } else {
      console.error("Employee not found for ID:", employeeId);
    }
  };

  const handleRemoveActif = async (reason?: string) => {
    if (selectedEmployeeId && actifToRemove) {
      try {
        // Get the actif to determine its status
        const actif = actifs?.find((a) => a.actifId === actifToRemove);
        const actifStatus = actif?.status?.name || "";
        const isPending = actifStatus === "Réservé";

        // Call the API to remove the actif
        await removeActifs({
          employeeId: selectedEmployeeId,
          actifIds: [actifToRemove],
          reason: reason, // Pass the reason to the API
        }).unwrap();

        // Update local state
        setAssignedActifs(
          assignedActifs.filter((actif) =>
            typeof actif === "string"
              ? actif !== actifToRemove
              : actif.actifId !== actifToRemove
          )
        );

        setActifToRemove(null);

        // Force refresh to get the latest data
        await refetch();

        // Show appropriate notification
        showNotification(
          isPending
            ? "Réservation annulée avec succès"
            : "Équipement retiré avec succès",
          "success"
        );
      } catch (error) {
        console.error("Échec du retrait de l'équipement:", error);
        showNotification("Échec du retrait de l'équipement", "error");
      }
    }
  };

  // Handle opening the remove dialog with status context
  const handleOpenRemoveLicenseDialog = (licenseId: string) => {
    const license = licenses?.find((l) => l.licenseId === licenseId);
    const isPending = license?.status?.name === "Réservé";

    setLicenseToRemove(licenseId);
    setIsPendingLicenseRemoval(isPending || false);
  };

  const handleOpenRemoveDialog = (actifId: string) => {
    const actif = actifs?.find((a) => a.actifId === actifId);
    const isPending = actif?.status?.name === "Réservé";

    setActifToRemove(actifId);
    setIsPendingRemoval(isPending || false);
  };

  const showNotification = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Add this additional state for handling pending removals
  const [isPendingRemoval, setIsPendingRemoval] = useState(false);

  // License Handlers with debugging
  const handleOpenAssignLicensesModal = (employeeId: string) => {
    console.log("handleOpenAssignLicensesModal called with:", employeeId);
    setSelectedEmployeeId(employeeId);
    setOpenAssignLicensesModal(true);
    setSelectedLicenses([]);
    console.log("openAssignLicensesModal set to:", true);
  };

  const handleAssignLicenses = async (quantities?: Record<string, number>) => {
    if (selectedEmployeeId && selectedLicenses.length > 0) {
      try {
        // Find the "Réservé" status
        const reservedStatus = statuses?.find(
          (status) => status.name === "Réservé"
        );

        if (!reservedStatus) {
          showNotification(
            "Statut 'Réservé' non trouvé dans le système",
            "error"
          );
          return;
        }

        // Assign licenses to employee with the new API that handles email notification
        const result = await assignLicenses({
          employeeId: selectedEmployeeId,
          licenseIds: selectedLicenses,
          quantities: quantities || {},
        }).unwrap();

        setOpenAssignLicensesModal(false);
        setSelectedLicenses([]);

        // Force refresh to get the latest data
        await refetch();

        // Show appropriate notification based on the API response
        if (result && typeof result === "object" && "emailSent" in result) {
          showNotification(
            result.emailSent
              ? "Licences réservées avec succès et notification envoyée à l'employé"
              : "Licences réservées mais l'envoi de l'email a échoué. L'employé devra être notifié manuellement.",
            result.emailSent ? "success" : "warning"
          );
        } else {
          showNotification("Licences réservées avec succès", "success");
        }

        return result;
      } catch (error) {
        console.error("Échec de réservation des licences:", error);
        showNotification("Échec de réservation des licences", "error");
        throw error;
      }
    }
  };

  const handleShowAssignedLicenses = (employeeId: string) => {
    console.log("handleShowAssignedLicenses called with:", employeeId);
    const employee = employees?.find((emp) => emp.employeeId === employeeId);

    if (employee) {
      console.log("Showing licenses for employee:", employee);
      console.log("Employee licenses data:", employee.licenses);

      if (
        !employee.licenses ||
        !Array.isArray(employee.licenses) ||
        employee.licenses.length === 0
      ) {
        setAssignedLicenses([]);
        console.log("No licenses found for this employee");
      } else {
        // Process the licenses to handle potential nested structures
        const processedLicenses: AssignedLicense[] = [];

        for (const licenseItem of employee.licenses) {
          console.log("Processing license item:", licenseItem);

          let processedLicense: AssignedLicense | null = null;

          // If license is a string ID
          if (typeof licenseItem === "string") {
            console.log("License is a string ID:", licenseItem);
            const fullLicense = licenses?.find(
              (l) => l.licenseId === licenseItem
            );
            if (fullLicense) {
              processedLicense = {
                licenseId: fullLicense.licenseId,
                softwareName: fullLicense.softwareName || "Unknown",
                version: fullLicense.version || "Unknown",
                licenseType: fullLicense.licenseType || "Standard",
                licenseKey: fullLicense.licenseKey || "N/A",
                quantity: 1, // Default quantity
                expiryDate: fullLicense.expiryDate || new Date(),
                assignedAt: new Date().toISOString(),
              };
            }
          }
          // If license is an object with licenseId and other direct properties
          else if (
            licenseItem &&
            typeof licenseItem === "object" &&
            licenseItem !== null &&
            "licenseId" in licenseItem
          ) {
            const typedLicenseItem = licenseItem as ProcessedLicenseItem;
            console.log(
              "License is an object with licenseId:",
              typedLicenseItem
            );

            // Case where it has all properties directly
            if (
              "softwareName" in typedLicenseItem &&
              "version" in typedLicenseItem
            ) {
              processedLicense = {
                licenseId: typedLicenseItem.licenseId,
                softwareName: typedLicenseItem.softwareName || "Unknown",
                version: typedLicenseItem.version || "Unknown",
                licenseType: typedLicenseItem.licenseType || "Standard",
                licenseKey: typedLicenseItem.licenseKey || "N/A",
                quantity: typedLicenseItem.quantity || 1,
                expiryDate: typedLicenseItem.expiryDate || new Date(),
                assignedAt:
                  typedLicenseItem.assignedAt || new Date().toISOString(),
              };
            } else {
              // We need to combine with license data from the licenses array
              const fullLicense = licenses?.find(
                (l) => l.licenseId === typedLicenseItem.licenseId
              );
              if (fullLicense) {
                processedLicense = {
                  licenseId: typedLicenseItem.licenseId,
                  softwareName: fullLicense.softwareName || "Unknown",
                  version: fullLicense.version || "Unknown",
                  licenseType: fullLicense.licenseType || "Standard",
                  licenseKey: fullLicense.licenseKey || "N/A",
                  quantity: typedLicenseItem.quantity || 1,
                  expiryDate: fullLicense.expiryDate || new Date(),
                  assignedAt:
                    typedLicenseItem.assignedAt || new Date().toISOString(),
                };
              }
            }
          }
          // If license has a nested license object
          else if (
            licenseItem &&
            typeof licenseItem === "object" &&
            licenseItem !== null &&
            "license" in licenseItem &&
            (licenseItem as any).license
          ) {
            const typedLicenseItem = licenseItem as ProcessedLicenseItem;
            console.log(
              "License has a nested license object:",
              typedLicenseItem
            );

            if (typedLicenseItem.license) {
              const license = typedLicenseItem.license;
              processedLicense = {
                licenseId: license.licenseId,
                softwareName: license.softwareName || "Unknown",
                version: license.version || "Unknown",
                licenseType: license.licenseType || "Standard",
                licenseKey: license.licenseKey || "N/A",
                quantity: typedLicenseItem.quantity || 1,
                expiryDate: license.expiryDate || new Date(),
                assignedAt:
                  typedLicenseItem.assignedAt || new Date().toISOString(),
              };
            }
          }

          if (processedLicense) {
            console.log("Processed license:", processedLicense);
            processedLicenses.push(processedLicense);
          }
        }

        console.log("Final processed licenses:", processedLicenses);
        setAssignedLicenses(processedLicenses);
      }

      setSelectedEmployeeId(employeeId);
      setOpenShowAssignedLicensesModal(true);
      console.log("openShowAssignedLicensesModal set to:", true);
    } else {
      console.error("Employee not found:", employeeId);
      showNotification("Erreur: Employé non trouvé", "error");
    }
  };

  const handleRemoveLicense = async (reason?: string) => {
    if (selectedEmployeeId && licenseToRemove) {
      try {
        // Get the license to determine its status
        const license = licenses?.find((l) => l.licenseId === licenseToRemove);
        const licenseStatus = license?.status?.name || "";
        const isPending = licenseStatus === "Réservé";

        // Call the API to remove the license
        await removeLicenses({
          employeeId: selectedEmployeeId,
          licenseIds: [licenseToRemove],
          reason: reason, // Pass the reason to the API
        }).unwrap();

        // Update local state
        setAssignedLicenses(
          assignedLicenses.filter(
            (license) => license.licenseId !== licenseToRemove
          )
        );

        setLicenseToRemove(null);

        // Force refresh to get the latest data
        await refetch();

        // Show appropriate notification
        showNotification(
          isPending
            ? "Réservation de licence annulée avec succès"
            : "Licence retirée avec succès",
          "success"
        );
      } catch (error) {
        console.error("Échec du retrait de la licence:", error);
        showNotification("Échec du retrait de la licence", "error");
      }
    }
  };

  // Function to generate and download a contract
  const generateContract = async (employeeId: string, actifId: string) => {
    try {
      setIsContractDownloading(true);

      // In a real implementation, you would make an API call to the backend
      // to generate a proper PDF document and return it as a blob
      // For example: const response = await fetch(`/api/contracts/generate/${employeeId}/${actifId}`);

      const employee = employees?.find((emp) => emp.employeeId === employeeId);
      const actif = actifs?.find((act) => act.actifId === actifId);

      if (employee && actif) {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // In a real implementation, you would call the backend to generate the PDF
        // For now, we'll redirect to a pre-existing PDF endpoint or a PDF viewer

        // For demo purposes, we'll use a workaround that creates a simple HTML document
        // and opens it in a new tab, where it can be printed to PDF by the user
        const contractHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <title>Contrat d'Assignation d'Équipement</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { line-height: 1.6; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-line { border-top: 1px solid #333; width: 200px; padding-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            table, th, td { border: 1px solid #ddd; }
            th, td { padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CONTRAT D'ASSIGNATION D'ÉQUIPEMENT</h1>
            <p>Date: ${new Date().toLocaleDateString("fr-FR")}</p>
          </div>
          
          <div class="content">
            <h2>Informations de l'Employé</h2>
            <p><strong>Nom:</strong> ${employee.nom}</p>
            <p><strong>Email:</strong> ${employee.email}</p>
            
            <h2>Détails de l'Équipement</h2>
            <table>
              <tr>
                <th>Type</th>
                <th>Numéro de série</th>
                <th>Description</th>
              </tr>
              <tr>
                <td>${actif.actifType || "N/A"}</td>
                <td>${actif.serialNumber || "N/A"}</td>
                <td>${actif.actifType || "N/A"}</td>
              </tr>
            </table>
            
            <h2>Conditions d'Utilisation</h2>
            <p>Je soussigné(e) déclare avoir reçu l'équipement décrit ci-dessus et m'engage à:</p>
            <ol>
              <li>Utiliser cet équipement uniquement dans le cadre de mes fonctions professionnelles</li>
              <li>Prendre soin de l'équipement et signaler immédiatement tout dysfonctionnement</li>
              <li>Restituer l'équipement à la fin de mon contrat ou à la demande de la société</li>
              <li>Ne pas installer de logiciels non autorisés sur l'équipement</li>
              <li>Protéger les données confidentielles présentes sur l'équipement</li>
            </ol>
            
            <div class="signature">
              <div>
                <p class="signature-line">Signature de l'employé</p>
              </div>
              <div>
                <p class="signature-line">Signature du responsable</p>
              </div>
            </div>
          </div>
          
          <script>
            // Auto-print when loaded
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
        `;

        // Create a Blob with the HTML content
        const htmlBlob = new Blob([contractHTML], { type: "text/html" });

        // Open in a new tab
        const url = URL.createObjectURL(htmlBlob);
        window.open(url, "_blank");

        setIsContractDownloading(false);
        setOpenContractDialog(false);
        showNotification(
          "Contrat ouvert dans un nouvel onglet. Utilisez la fonction d'impression du navigateur pour enregistrer en PDF.",
          "success"
        );
      }
    } catch (error) {
      console.error("Failed to generate contract:", error);
      setIsContractDownloading(false);
      showNotification("Échec de la génération du contrat", "error");
    }
  };

  // Custom column rendering with styles matching the Categories component
  const getCustomColumns = () => {
    const baseColumns = getEmployeeColumns({
      handleOpenAssignModal,
      handleOpenAssignLicensesModal,
      handleShowAssignedActifs,
      handleShowAssignedLicenses,
      handleOpenDeleteConfirm,
    });

    // Find the actions column and update it to match the Categories style
    const actionsColumnIndex = baseColumns.findIndex(
      (col) => col.field === "actions"
    );

    if (actionsColumnIndex >= 0) {
      baseColumns[actionsColumnIndex] = {
        ...baseColumns[actionsColumnIndex],
        width: 450, // Increase width to fit buttons better (increased for new button)
        align: "right", // Align content to the right
        renderHeader: (params: GridColumnHeaderParams) => (
          <strong style={{ fontWeight: "bold" }}>
            {params.colDef.headerName}
          </strong>
        ),
        renderCell: (params: GridRenderCellParams) => {
          const employeeId = params.row.employeeId;
          const isEquipmentDropdownOpen =
            openDropdowns[employeeId] === "equipment";
          const isLicenseDropdownOpen = openDropdowns[employeeId] === "license";

          const toggleDropdown = (
            dropdown: string,
            event: React.MouseEvent
          ) => {
            event.stopPropagation();
            setOpenDropdowns((prev) => {
              // Close the dropdown if it's already open
              if (prev[employeeId] === dropdown) {
                const newState = { ...prev };
                delete newState[employeeId];
                return newState;
              }
              // Otherwise open this dropdown and close any others
              return {
                ...prev,
                [employeeId]: dropdown,
              };
            });
          };

          return (
            <div className="flex flex-wrap gap-2 items-center justify-end pr-4 w-full h-full">
              {/* Equipment Management Button with Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center justify-center px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition duration-150"
                  onClick={(e) => toggleDropdown("equipment", e)}
                >
                  <Package className="w-4 h-4 mr-1.5" />
                  Équipement
                </button>
                {isEquipmentDropdownOpen && (
                  <div
                    className="absolute left-0 top-full mt-1 bg-white shadow-lg rounded z-50 w-36"
                    style={{ zIndex: 9999 }}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(
                          "Assigner clicked for employee:",
                          employeeId
                        );
                        handleOpenAssignModal(employeeId);
                        setTimeout(() => setOpenDropdowns({}), 50); // Delay closing the dropdown
                      }}
                      className="dropdown-menu-item px-3 py-2 hover:bg-blue-50 text-sm cursor-pointer flex items-center"
                    >
                      <Package className="w-3 h-3 mr-1.5 text-blue-600" />
                      Assigner
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(
                          "Consulter clicked for employee:",
                          employeeId
                        );
                        handleShowAssignedActifs(employeeId);
                        setTimeout(() => setOpenDropdowns({}), 50); // Delay closing the dropdown
                      }}
                      className="dropdown-menu-item px-3 py-2 hover:bg-blue-50 text-sm cursor-pointer flex items-center"
                    >
                      <Eye className="w-3 h-3 mr-1.5 text-blue-600" />
                      Consulter
                    </div>
                  </div>
                )}
              </div>

              {/* License Management Button with Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center justify-center px-3 py-1.5 text-sm text-violet-600 bg-violet-50 hover:bg-violet-100 rounded transition duration-150"
                  onClick={(e) => toggleDropdown("license", e)}
                >
                  <Key className="w-4 h-4 mr-1.5" />
                  Licences
                </button>
                {isLicenseDropdownOpen && (
                  <div
                    className="absolute left-0 top-full mt-1 bg-white shadow-lg rounded z-50 w-36"
                    style={{ zIndex: 9999 }}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(
                          "Assigner licenses clicked for employee:",
                          employeeId
                        );
                        handleOpenAssignLicensesModal(employeeId);
                        setTimeout(() => setOpenDropdowns({}), 50); // Delay closing the dropdown
                      }}
                      className="dropdown-menu-item px-3 py-2 hover:bg-violet-50 text-sm cursor-pointer flex items-center"
                    >
                      <Key className="w-3 h-3 mr-1.5 text-violet-600" />
                      Assigner
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(
                          "Consulter licenses clicked for employee:",
                          employeeId
                        );
                        handleShowAssignedLicenses(employeeId);
                        setTimeout(() => setOpenDropdowns({}), 50); // Delay closing the dropdown
                      }}
                      className="dropdown-menu-item px-3 py-2 hover:bg-violet-50 text-sm cursor-pointer flex items-center"
                    >
                      <Eye className="w-3 h-3 mr-1.5 text-violet-600" />
                      Consulter
                    </div>
                  </div>
                )}
              </div>

              {/* Modify Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenUpdateModal(employeeId);
                }}
                className="flex items-center justify-center px-3 py-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded transition duration-150"
              >
                <Edit className="w-4 h-4 mr-1.5" />
                Modifier
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDeleteConfirm(employeeId);
                }}
                className="flex items-center justify-center px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded transition duration-150"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Supprimer
              </button>
            </div>
          );
        },
      };
    }

    // Update header styles for all columns
    return baseColumns.map((column) => ({
      ...column,
      renderHeader: (params: GridColumnHeaderParams): ReactNode => (
        <strong style={{ fontWeight: "bold" }}>
          {params.colDef.headerName}
        </strong>
      ),
    })) as GridColDef[];
  };

  if (isLoading) {
    return <p>Chargement...</p>;
  }

  if (isError || !employees) {
    return <p className="text-red-500">Échec de récupération des employés</p>;
  }

  const columns = getCustomColumns();

  return (
    <div className="p-5">
      {/* Add the CSS styles */}
      <style>{additionalStyles}</style>

      <Header name="Employés" />
      <div className="flex justify-end my-4">
        <Button
          onClick={() => setOpenCreateModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-150 flex items-center justify-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Créer un employé
        </Button>
      </div>
      <div className="bg-white shadow rounded-lg border border-gray-200 mt-5">
        <DataGrid
          rows={employees}
          columns={columns}
          getRowId={(row) => row.employeeId}
          checkboxSelection={false}
          className="!text-gray-700 relative"
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          autoHeight
          sx={{
            "& .MuiDataGrid-row": {
              position: "relative",
              zIndex: 1,
              "&:hover": {
                zIndex: 2,
              },
            },
            "& .MuiDataGrid-cell": {
              overflow: "visible !important",
            },
          }}
        />
      </div>

      {/* Dialogs */}
      <CreateEmployeeDialog
        open={openCreateModal}
        onClose={() => {
          console.log("Closing CreateEmployeeDialog");
          setOpenCreateModal(false);
        }}
        newEmployee={newEmployee}
        setNewEmployee={setNewEmployee}
        handleCreate={handleCreate}
      />

      {/* Update Employee Dialog */}
      <UpdateEmployeeDialog
        open={openUpdateModal}
        onClose={() => {
          console.log("Closing UpdateEmployeeDialog");
          setOpenUpdateModal(false);
        }}
        employee={employeeToUpdate}
        setEmployee={setEmployeeToUpdate}
        handleUpdate={handleUpdate}
      />

      <DeleteConfirmationDialog
        open={openDeleteConfirm}
        onClose={() => {
          console.log("Closing DeleteConfirmationDialog");
          setOpenDeleteConfirm(false);
        }}
        handleDelete={handleDelete}
      />

      {/* Actif Dialogs */}
      <AssignActifsDialog
        open={openAssignModal}
        onClose={() => {
          console.log("Closing AssignActifsDialog");
          setOpenAssignModal(false);
        }}
        actifs={actifs || []}
        selectedActifs={selectedActifs}
        setSelectedActifs={setSelectedActifs}
        handleAssignActifs={handleAssignActifs}
        actifAssignmentCounts={actifAssignmentCounts}
        employeeAssignedActifs={employeeAssignedActifs}
        statuses={statuses || []}
        employeeId={selectedEmployeeId}
        employees={employees} // Add employees to props
      />
      <ShowAssignedActifsDialog
        open={openShowAssignedModal}
        onClose={() => setOpenShowAssignedModal(false)}
        assignedActifs={assignedActifs}
        setActifToRemove={(id) => id && handleOpenRemoveDialog(id)}
        resendInvitation={() => {
          showNotification("Fonction de renvoi désactivée", "info");
        }}
        refetchData={refetchEmployeeActifs} // <-- Pass the refetch function
      />

      <RemoveActifDialog
        open={!!actifToRemove}
        onClose={() => {
          setActifToRemove(null);
          setIsPendingRemoval(false);
        }}
        handleRemoveActif={handleRemoveActif}
        isPending={isPendingRemoval}
      />

      {/* License Dialogs */}
      <AssignLicensesDialog
        open={openAssignLicensesModal}
        onClose={() => {
          console.log("Closing AssignLicensesDialog");
          setOpenAssignLicensesModal(false);
        }}
        licenses={licenses || []}
        selectedLicenses={selectedLicenses}
        setSelectedLicenses={setSelectedLicenses}
        handleAssignLicenses={handleAssignLicenses}
        licenseAssignmentCounts={licenseAssignmentCounts}
        employeeAssignedLicenses={employeeAssignedLicenses}
        statuses={statuses || []}
        employeeId={selectedEmployeeId}
        employees={employees} // Add employees to props
      />
      <ShowAssignedLicensesDialog
        open={openShowAssignedLicensesModal}
        onClose={() => setOpenShowAssignedLicensesModal(false)}
        assignedLicenses={assignedLicenses}
        setLicenseToRemove={(id) => id && handleOpenRemoveLicenseDialog(id)}
        resendInvitation={() => {
          showNotification("Fonction de renvoi désactivée", "info");
        }}
      />

      <RemoveLicencesDialog
        open={!!licenseToRemove}
        onClose={() => {
          setLicenseToRemove(null);
          setIsPendingLicenseRemoval(false);
        }}
        handleRemoveLicense={handleRemoveLicense}
        isPending={isPendingLicenseRemoval}
      />

      {/* Contract Dialog */}
      <ContractDialog
        open={openContractDialog}
        onClose={() => setOpenContractDialog(false)}
        handleDownload={() => {
          if (selectedEmployeeId && contractActifId) {
            generateContract(selectedEmployeeId, contractActifId);
          }
        }}
        isDownloading={isContractDownloading}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Users;
