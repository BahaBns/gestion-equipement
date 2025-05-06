// components/AssignActifsDialog.tsx
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
import {
  Actif,
  Status,
  Employee,
  useGetMarquesQuery,
  useGetModelesQuery,
} from "@/state/api";

// Define the type for the assignment result
interface AssignmentResult {
  emailSent?: boolean;
  [key: string]: any;
}

type AssignActifsDialogProps = {
  open: boolean;
  onClose: () => void;
  actifs: Actif[];
  selectedActifs: string[];
  setSelectedActifs: (actifs: string[]) => void;
  handleAssignActifs: (
    quantities?: Record<string, number>
  ) => Promise<AssignmentResult | void>;
  actifAssignmentCounts: Record<string, number>;
  employeeAssignedActifs: string[];
  statuses: Status[];
  employeeId: string | null;
  employees?: Employee[];
};

const AssignActifsDialog = ({
  open,
  onClose,
  actifs,
  selectedActifs,
  setSelectedActifs,
  handleAssignActifs,
  actifAssignmentCounts,
  employeeAssignedActifs,
  statuses,
  employeeId,
  employees = [],
}: AssignActifsDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredActifs, setFilteredActifs] = useState<Actif[]>([]);
  const [actifQuantities, setActifQuantities] = useState<
    Record<string, number>
  >({});
  const [reservedStatusId, setReservedStatusId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<{
    success: boolean;
    message: string;
    emailSent: boolean;
  } | null>(null);

  // Fetch marques and modeles for lookups
  const { data: marques } = useGetMarquesQuery();
  const { data: modeles } = useGetModelesQuery();

  // Create lookup maps for quick access
  const marqueMap = new Map(marques?.map((m) => [m.marqueId, m.name]) || []);
  const modeleMap = new Map(modeles?.map((m) => [m.modeleId, m.name]) || []);

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

  // Helper function to get marque name from actif
  const getMarqueName = (actif: Actif): string => {
    if (actif.marqueObj?.name) {
      return actif.marqueObj.name;
    }
    // Lookup from marque map if we only have ID
    if (actif.marqueId) {
      return marqueMap.get(actif.marqueId) || actif.marqueId;
    }
    return "";
  };

  // Helper function to get modele name from actif
  const getModeleName = (actif: Actif): string => {
    if (actif.modeleObj?.name) {
      return actif.modeleObj.name;
    }
    // Lookup from modele map if we only have ID
    if (actif.modeleId) {
      return modeleMap.get(actif.modeleId) || actif.modeleId;
    }
    return "";
  };

  // Filter actifs based on search term, availability, and handle already assigned actifs differently
  useEffect(() => {
    const filtered = actifs
      .filter((actif) => {
        const currentAssignments = actifAssignmentCounts[actif.actifId] || 0;
        const maxQuantity = actif.quantity || 0;

        // Only show items that still have available quantity
        return maxQuantity > currentAssignments;
      })
      .filter(
        (actif) =>
          actif.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getMarqueName(actif)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          getModeleName(actif).toLowerCase().includes(searchTerm.toLowerCase())
      );

    setFilteredActifs(filtered || []);

    // Initialize quantities
    const initialQuantities: Record<string, number> = {};
    filtered.forEach((actif) => {
      initialQuantities[actif.actifId] = 1;
    });

    setActifQuantities((prevQuantities) => ({
      ...prevQuantities,
      ...initialQuantities,
    }));
  }, [
    searchTerm,
    actifs,
    actifAssignmentCounts,
    employeeAssignedActifs,
    employeeId,
    employees,
    marques,
    modeles,
  ]);

  const handleSelectAll = () => {
    if (filteredActifs.length === selectedActifs.length) {
      setSelectedActifs([]);
    } else {
      setSelectedActifs(filteredActifs.map((actif) => actif.actifId));
    }
  };

  const handleQuantityChange = (actifId: string, value: number) => {
    setActifQuantities({
      ...actifQuantities,
      [actifId]: value,
    });
  };

  const handleConfirmAssign = async () => {
    if (selectedActifs.length === 0) return;

    setIsAssigning(true);
    setAssignmentResult(null);

    try {
      const result = await handleAssignActifs(actifQuantities);

      // This assumes your API returns something like { emailSent: boolean, message: string }
      setAssignmentResult({
        success: true,
        message:
          "Équipements réservés avec succès. Un email a été envoyé à l&apos;employé pour acceptation.",
        emailSent: result?.emailSent || false,
      });

      // Keep the dialog open to show the result, user will close it manually
    } catch (error: any) {
      setAssignmentResult({
        success: false,
        message:
          error.message || "Erreur lors de l&apos;assignation des équipements",
        emailSent: false,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const isAllSelected =
    filteredActifs.length > 0 &&
    filteredActifs.length === selectedActifs.length;

  const getEmployeeAssignedQuantity = (actif: Actif) => {
    // Find the current employee
    const currentEmployee = employees.find(
      (emp) => emp.employeeId === employeeId
    );

    // Find how much of this actif the employee already has
    const employeeActif = currentEmployee?.actifs?.find(
      (a) =>
        typeof a === "object" && "actifId" in a && a.actifId === actif.actifId
    );

    // Get the quantity this employee has (default to 0 if not found)
    return employeeActif && "quantity" in employeeActif
      ? employeeActif.quantity
      : 0;
  };

  const getAvailableQuantity = (actif: Actif) => {
    // Get total assignments across all employees
    const totalAssignments = actifAssignmentCounts[actif.actifId] || 0;

    // Available is simply total minus what&apos;s assigned to everyone (including this employee)
    return actif.quantity - totalAssignments;
  };

  // Find the current employee
  const currentEmployee = employeeId
    ? employees.find((emp) => emp.employeeId === employeeId)
    : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h6">
          Réserver des équipements pour{" "}
          {currentEmployee ? currentEmployee.nom : "l&apos;employé"}
        </Typography>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par numéro de série, marque, modèle..."
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
            {filteredActifs?.length || 0} actifs disponibles
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
                Note: L&apos;email de notification n&apos;a pas pu être envoyé.
                L&apos;employé devra être notifié manuellement.
              </Typography>
            )}
          </Alert>
        </Box>
      )}

      <DialogContent sx={{ height: "350px", pt: 1 }}>
        {filteredActifs && filteredActifs.length > 0 ? (
          <List sx={{ pt: 0 }}>
            {filteredActifs.map((actif) => {
              const availableQuantity = getAvailableQuantity(actif);
              const alreadyAssigned = employeeAssignedActifs.includes(
                actif.actifId
              );

              return (
                <ListItem
                  key={actif.actifId}
                  sx={{
                    py: 1,
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <Box display="flex" width="100%" alignItems="center">
                    <Checkbox
                      checked={selectedActifs.includes(actif.actifId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedActifs([...selectedActifs, actif.actifId]);
                        } else {
                          setSelectedActifs(
                            selectedActifs.filter((id) => id !== actif.actifId)
                          );
                        }
                      }}
                      edge="start"
                    />
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          <Typography fontWeight={500}>
                            {getMarqueName(actif)} {getModeleName(actif)} -{" "}
                            {actif.serialNumber}
                          </Typography>
                          <Tooltip
                            title={`${availableQuantity} sur ${actif.quantity} disponibles`}
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
                                ({availableQuantity}/{actif.quantity})
                              </Typography>
                              {alreadyAssigned && (
                                <Typography
                                  variant="caption"
                                  color="primary"
                                  sx={{ ml: 1 }}
                                >
                                  [Vous avez déjà{" "}
                                  {getEmployeeAssignedQuantity(actif)}]
                                </Typography>
                              )}
                            </Box>
                          </Tooltip>
                        </Box>
                      }
                    />
                  </Box>

                  {selectedActifs.includes(actif.actifId) && (
                    <Box mt={1} ml={4} width="60%">
                      <FormControl fullWidth size="small">
                        <InputLabel id={`quantity-label-${actif.actifId}`}>
                          Quantité
                        </InputLabel>
                        <Select
                          labelId={`quantity-label-${actif.actifId}`}
                          value={actifQuantities[actif.actifId] || 1}
                          onChange={(e) =>
                            handleQuantityChange(
                              actif.actifId,
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
              {actifs && actifs.length > 0
                ? "Tous les équipements ont atteint leur limite d&apos;assignation ou ne correspondent pas à votre recherche"
                : "Aucun actif disponible dans le système"}
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
              disabled={selectedActifs.length === 0 || isAssigning}
            >
              {isAssigning ? "Traitement en cours..." : "Réserver"}
              {selectedActifs.length > 0 && !isAssigning
                ? ` (${selectedActifs.length})`
                : ""}
            </Button>
          )}
        </Box>
      </DialogActions>

      <Box px={3} pb={2}>
        <Typography variant="caption" color="text.secondary">
          Une fois réservés, un email sera envoyé à l&apos;employé avec un lien
          pour accepter les équipements. L&apos;employé devra accepter les
          conditions d&apos;utilisation pour finaliser l&apos;assignation.
        </Typography>
      </Box>
    </Dialog>
  );
};

export default AssignActifsDialog;
