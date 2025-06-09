// components/AssignLicensesDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  InputAdornment,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
} from "@mui/material";
import { Search, Mail } from "lucide-react";
import { License, Status, Employee } from "@/state/api";

type AssignLicensesDialogProps = {
  open: boolean;
  onClose: () => void;
  licenses: License[];
  selectedLicenses: string[];
  setSelectedLicenses: (licenses: string[]) => void;
  handleAssignLicenses: (quantities?: Record<string, number>) => Promise<any>;
  licenseAssignmentCounts: Record<string, number>;
  employeeAssignedLicenses: string[];
  statuses: Status[];
  employeeId: string | null;
  employees?: Employee[]; // Added to get employee-specific info
};

const AssignLicensesDialog = ({
  open,
  onClose,
  licenses,
  selectedLicenses,
  setSelectedLicenses,
  handleAssignLicenses,
  licenseAssignmentCounts,
  employeeAssignedLicenses,
  statuses,
  employeeId,
  employees = [], // Default value to prevent errors when not provided
}: AssignLicensesDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [licenseQuantities, setLicenseQuantities] = useState<
    Record<string, number>
  >({});
  const [reservedStatusId, setReservedStatusId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<{
    success: boolean;
    message: string;
    emailSent: boolean;
  } | null>(null);


    // Reset dialog state when opening
  useEffect(() => {
    if (open) {
      // Reset all local state when dialog opens
      setSearchTerm("");
      setAssignmentResult(null);
      setIsAssigning(false);
      setSelectedLicenses([]);
      setLicenseQuantities({});
    }
  }, [open, setSelectedLicenses]);

  // Find the "Réservé" status ID when the component loads
  useEffect(() => {
    if (statuses) {
      const reservedStatus = statuses.find(
        (status) => status.name === "Réservé"
      );
      if (reservedStatus) {
        setReservedStatusId(reservedStatus.statusId);
      }
    }
  }, [statuses]);

  // Filter licenses based on search term, availability, and handle already assigned licenses differently
  useEffect(() => {
    const filtered = licenses
      .filter((license) => {
        const currentAssignments =
          licenseAssignmentCounts[license.licenseId] || 0;
        const maxQuantity = license.licenseQuantity || 0;

        // Only show items that still have available quantity
        return maxQuantity > currentAssignments;
      })
      .filter(
        (license) =>
          license.softwareName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          license.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
          license.licenseType
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (license.vendorName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ??
            false)
      );

    setFilteredLicenses(filtered || []);

    // Initialize quantities
    const initialQuantities: Record<string, number> = {};
    filtered.forEach((license) => {
      initialQuantities[license.licenseId] = 1;
    });

    setLicenseQuantities((prevQuantities) => ({
      ...prevQuantities,
      ...initialQuantities,
    }));
  }, [
    searchTerm,
    licenses,
    licenseAssignmentCounts,
    employeeAssignedLicenses,
    employeeId,
    employees,
  ]);

  const handleSelectAll = () => {
    if (filteredLicenses.length === selectedLicenses.length) {
      setSelectedLicenses([]);
    } else {
      setSelectedLicenses(filteredLicenses.map((license) => license.licenseId));
    }
  };

  const handleQuantityChange = (licenseId: string, value: number) => {
    setLicenseQuantities({
      ...licenseQuantities,
      [licenseId]: value,
    });
  };

  const handleConfirmAssign = async () => {
    if (selectedLicenses.length === 0) return;

    setIsAssigning(true);
    setAssignmentResult(null);

    try {
      const result = await handleAssignLicenses(licenseQuantities);

      setAssignmentResult({
        success: true,
        message:
          "Licences réservées avec succès. Un email a été envoyé à l&apos;employé pour acceptation.",
        emailSent: result?.emailSent || false,
      });

      // Keep the dialog open to show the result, user will close it manually
    } catch (error: any) {
      setAssignmentResult({
        success: false,
        message: error.message || "Erreur lors de la réservation des licences",
        emailSent: false,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const isAllSelected =
    filteredLicenses.length > 0 &&
    filteredLicenses.length === selectedLicenses.length;

  const getEmployeeAssignedQuantity = (license: License) => {
    // Find the current employee
    const currentEmployee = employees.find(
      (emp) => emp.employeeId === employeeId
    );

    // Find how much of this license the employee already has
    const employeeLicense = currentEmployee?.licenses?.find(
      (l) =>
        typeof l === "object" &&
        "licenseId" in l &&
        l.licenseId === license.licenseId
    );

    // Get the quantity this employee has (default to 0 if not found)
    return employeeLicense && "quantity" in employeeLicense
      ? employeeLicense.quantity
      : 0;
  };

  const getAvailableQuantity = (license: License) => {
    // Get total assignments across all employees
    const totalAssignments = licenseAssignmentCounts[license.licenseId] || 0;

    // Available is simply total minus what&apos;s assigned to everyone (including this employee)
    return license.licenseQuantity - totalAssignments;
  };

  const formatExpiryDate = (date: Date | string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  // Find the current employee
  const currentEmployee = employeeId
    ? employees.find((emp) => emp.employeeId === employeeId)
    : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h6">
          Réserver des licences pour{" "}
          {currentEmployee ? currentEmployee.nom : "l&apos;employé"}
        </Typography>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par nom de logiciel, version, type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 1,
            mb: 1,
          }}
        >
          <Typography variant="body2">
            {filteredLicenses?.length || 0} licences disponibles
          </Typography>
          <Button size="small" onClick={handleSelectAll}>
            {isAllSelected ? "Désélectionner tout" : "Sélectionner tout"}
          </Button>
        </Box>
      </Box>

      <Divider />

      {assignmentResult && (
        <Box sx={{ px: 3, py: 2 }}>
          <Alert
            severity={assignmentResult.success ? "success" : "error"}
            icon={
              assignmentResult.success && assignmentResult.emailSent ? (
                <Mail />
              ) : undefined
            }
          >
            {assignmentResult.message}
            {assignmentResult.success && !assignmentResult.emailSent && (
              <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                Note: L&apos;email de notification n&apos;a pas pu être envoyé. L&apos;employé
                devra être notifié manuellement.
              </Typography>
            )}
          </Alert>
        </Box>
      )}

      <DialogContent sx={{ height: "350px", pt: 1 }}>
        {filteredLicenses && filteredLicenses.length > 0 ? (
          <List sx={{ pt: 0 }}>
            {filteredLicenses.map((license) => {
              const availableQuantity = getAvailableQuantity(license);
              const alreadyAssigned = employeeAssignedLicenses.includes(
                license.licenseId
              );

              return (
                <ListItem
                  key={license.licenseId}
                  sx={{
                    py: 1,
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <Box display="flex" width="100%" alignItems="center">
                    <Checkbox
                      checked={selectedLicenses.includes(license.licenseId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLicenses([
                            ...selectedLicenses,
                            license.licenseId,
                          ]);
                        } else {
                          setSelectedLicenses(
                            selectedLicenses.filter(
                              (id) => id !== license.licenseId
                            )
                          );
                        }
                      }}
                      edge="start"
                    />
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          <Typography fontWeight={500}>
                            {license.softwareName} {license.version}
                          </Typography>
                          <Tooltip
                            title={`${availableQuantity} sur ${license.licenseQuantity} disponibles`}
                          >
                            <Box
                              component="span"
                              ml={1}
                              display="flex"
                              alignItems="center"
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ({availableQuantity}/{license.licenseQuantity})
                              </Typography>
                              {alreadyAssigned && (
                                <Typography
                                  variant="caption"
                                  color="primary"
                                  sx={{ ml: 1 }}
                                >
                                  [Vous avez déjà{" "}
                                  {getEmployeeAssignedQuantity(license)}]
                                </Typography>
                              )}
                            </Box>
                          </Tooltip>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body2"
                            component="span"
                            display="block"
                          >
                            Type: {license.licenseType} | Clé:{" "}
                            {license.licenseKey || "N/A"}
                          </Typography>
                          <Typography
                            variant="body2"
                            component="span"
                            display="block"
                          >
                            Expire le: {formatExpiryDate(license.expiryDate)}
                          </Typography>
                        </>
                      }
                    />
                  </Box>

                  {selectedLicenses.includes(license.licenseId) && (
                    <Box mt={1} ml={4} width="60%">
                      <FormControl fullWidth size="small">
                        <InputLabel id={`quantity-label-${license.licenseId}`}>
                          Quantité
                        </InputLabel>
                        <Select
                          labelId={`quantity-label-${license.licenseId}`}
                          value={licenseQuantities[license.licenseId] || 1}
                          onChange={(e) =>
                            handleQuantityChange(
                              license.licenseId,
                              Number(e.target.value)
                            )
                          }
                          label="Quantité"
                        >
                          {Array.from(
                            { length: availableQuantity },
                            (_, i) => i + 1
                          ).map((num) => (
                            <MenuItem key={num} value={num}>
                              {num}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {alreadyAssigned
                            ? "Sélectionnez la quantité supplémentaire à réserver"
                            : "Sélectionnez la quantité à réserver"}
                        </FormHelperText>
                      </FormControl>
                    </Box>
                  )}
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {licenses && licenses.length > 0
                ? "Toutes les licences ont atteint leur limite d&apos;assignation ou ne correspondent pas à votre recherche"
                : "Aucune licence disponible dans le système"}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Box
          sx={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Button onClick={onClose} variant="outlined">
            {assignmentResult && assignmentResult.success
              ? "Fermer"
              : "Annuler"}
          </Button>

          {(!assignmentResult || !assignmentResult.success) && (
            <Button
              onClick={handleConfirmAssign}
              variant="contained"
              color="primary"
              disabled={selectedLicenses.length === 0 || isAssigning}
            >
              {isAssigning ? "Traitement en cours..." : "Réserver"}
              {selectedLicenses.length > 0 && !isAssigning
                ? ` (${selectedLicenses.length})`
                : ""}
            </Button>
          )}
        </Box>
      </DialogActions>

      <Box px={3} pb={2}>
        <Typography variant="caption" color="text.secondary">
          Une fois réservées, un email sera envoyé à l&apos;employé avec un lien pour
          accepter les licences. L&apos;employé devra accepter les conditions
          d&apos;utilisation pour finaliser l&apos;assignation.
        </Typography>
      </Box>
    </Dialog>
  );
};

export default AssignLicensesDialog;
