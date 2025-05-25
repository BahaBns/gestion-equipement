"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Tab,
  Tabs,
} from "@mui/material";
import { X, Mail, Calendar, Tag, Clock, CheckCircle } from "lucide-react";
import {
  getIconForSubcategory,
  getIconColorForCategory,
} from "../../(components)/utils/iconUtils";
import { fr } from "date-fns/locale";
import {
  Actif,
  EmployeeActif,
  useGetCategoriesQuery,
  useGetStatusesQuery,
  useGetMarquesQuery,
  useGetModelesQuery,
  useGetActifTypesQuery,
} from "@/state/api";
import { distanceInWordsToNow } from "date-fns";

type ShowAssignedActifsDialogProps = {
  open: boolean;
  onClose: () => void;
  assignedActifs: (
    | EmployeeActif
    | (Actif & { quantity: number; assignedAt: string })
  )[];
  setActifToRemove: (actifId: string | null) => void;
  resendInvitation?: (actifId: string) => void;
  refetchData?: () => void;
};

// Helper function to determine if an actif is in a specific status
const isActifInStatus = (actif: any, statusName: string): boolean => {
  if (!actif) return false;

  // Handle different data structures
  if (actif.status?.name) {
    return actif.status.name === statusName;
  }

  if (actif.actif?.status?.name) {
    return actif.actif.status.name === statusName;
  }

  return false;
};

const ShowAssignedActifsDialog = ({
  open,
  onClose,
  assignedActifs,
  setActifToRemove,
  resendInvitation,
  refetchData,
}: ShowAssignedActifsDialogProps) => {
  // Instead of useEffect, use a React.useEffect or state tracking
  const [hasOpened, setHasOpened] = React.useState(false);

  // Check if we need to refresh on render
  if (open && refetchData && !hasOpened) {
    refetchData();
    setHasOpened(true);
  }

  // Reset when closed
  if (!open && hasOpened) {
    setHasOpened(false);
  }

  const [tabValue, setTabValue] = React.useState(0);

  // Fetch categories and statuses for data supplementation
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: statuses = [] } = useGetStatusesQuery();

  // Create a map of statusId -> status data for quick lookups
  const statusMap = React.useMemo(() => {
    const map = new Map();
    statuses.forEach((status) => {
      map.set(status.statusId, status);
    });
    return map;
  }, [statuses]);

  const { data: marques = [] } = useGetMarquesQuery();
  const { data: modeles = [] } = useGetModelesQuery();

  // Then update your helper functions to look up the names by ID
  const getMarqueName = (actif: any): string => {
    if (actif?.marqueObj?.name) {
      return actif.marqueObj.name;
    }
    if (actif?.actif?.marqueObj?.name) {
      return actif.actif.marqueObj.name;
    }

    // Look up in marques array if we only have ID
    const marqueId = actif?.marqueId || actif?.actif?.marqueId;
    if (marqueId) {
      const marque = marques.find((m) => m.marqueId === marqueId);
      if (marque) return marque.name;
    }

    return "Non spécifié";
  };

  const getModeleName = (actif: any): string => {
    if (actif?.modeleObj?.name) {
      return actif.modeleObj.name;
    }
    if (actif?.actif?.modeleObj?.name) {
      return actif.actif.modeleObj.name;
    }

    // Look up in modeles array if we only have ID
    const modeleId = actif?.modeleId || actif?.actif?.modeleId;
    if (modeleId) {
      const modele = modeles.find((m) => m.modeleId === modeleId);
      if (modele) return modele.name;
    }

    return "Non spécifié";
  };

  const getActifTypeName = (actif: any): string => {
    if (actif?.actiftype?.nom) {
      return actif.actiftype.nom;
    }
    if (actif?.actif?.actiftype?.nom) {
      return actif.actif.actiftype.nom;
    }
    return actif?.actifType || actif?.actif?.actifType || "";
  };

  // Helper function to get status name
  const getStatusName = (actif: any) => {
    // Try direct path first
    if (actif.status?.name) {
      return actif.status.name;
    }

    // For nested actif object
    if (actif.actif?.status?.name) {
      return actif.actif.status.name;
    }

    // Look up by statusId if it exists
    if (actif.statusId && statusMap.has(actif.statusId)) {
      return statusMap.get(actif.statusId).name;
    }

    // For nested actif object
    if (actif.actif?.statusId && statusMap.has(actif.actif.statusId)) {
      return statusMap.get(actif.actif.statusId).name;
    }

    return "Statut inconnu";
  };

  // Render the icon for an actif based on its type
  const renderActifIcon = (actif: any) => {
    const actifData = actif.actif || actif;
    // Utilisation d&apos;une valeur par défaut pour le rendu de l&apos;icône
    const actifType = actifData.actiftype?.nom || actifData.actifType || "";
    const defaultCategory = "Équipement"; // Catégorie par défaut

    const IconComponent = getIconForSubcategory(actifType, defaultCategory);
    const iconColor = getIconColorForCategory(defaultCategory);

    return React.createElement(IconComponent, {
      size: 24,
      color: iconColor,
    });
  };

  // Format the assignment date
  const formatAssignmentDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return distanceInWordsToNow(date, {
        addSuffix: true,
        locale: fr,
      } as any); // Type assertion
    } catch (error) {
      return "Date inconnue";
    }
  };

  // Get actif data regardless of where it&apos;s located in the props structure
  const getActifData = (item: any) => {
    if (item.actif) {
      return {
        ...item.actif,
        quantity: item.quantity,
        assignedAt: item.assignedAt,
      };
    }
    return item;
  };

  // Filter actifs based on tab selection
  const filteredActifs = React.useMemo(() => {
    if (tabValue === 0) {
      // All
      return assignedActifs;
    } else if (tabValue === 1) {
      // Reserved (Pending)
      return assignedActifs.filter((actif) =>
        isActifInStatus(actif, "Réservé")
      );
    } else {
      // Assigned (Accepted)
      return assignedActifs.filter((actif) =>
        isActifInStatus(actif, "Assigné")
      );
    }
  }, [assignedActifs, tabValue]);

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Typography variant="h6">Équipements assignés</Typography>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          aria-label="equipment tabs"
        >
          <Tab label="Tous" />
        </Tabs>
      </Box>

      <DialogContent sx={{ minHeight: "400px", pt: 2 }}>
        {filteredActifs.length > 0 ? (
          <List>
            {filteredActifs.map((item) => {
              const actif = getActifData(item);
              const statusName = getStatusName(actif);
              const isPending = statusName === "Réservé";
              const isAccepted = statusName === "Assigné";

              return (
                <React.Fragment key={actif.actifId}>
                  <ListItem
                    sx={{
                      py: 2,
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "flex-start", sm: "center" },
                    }}
                    secondaryAction={
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Retirer l'équipement">
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => setActifToRemove(actif.actifId)}
                          >
                            <X size={18} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <Box className="flex items-start w-full pr-16">
                      <div className="mr-3 flex items-center justify-center mt-1">
                        {renderActifIcon(actif)}
                      </div>
                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 500 }}
                          >
                            {getActifTypeName(actif)} : {getMarqueName(actif)}{" "}
                            {getModeleName(actif)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            S/N: {actif.serialNumber}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Chip
                            size="small"
                            icon={<Tag size={14} />}
                            label={statusName}
                            variant="outlined"
                            color={
                              isAccepted
                                ? "success"
                                : isPending
                                ? "warning"
                                : "default"
                            }
                          />
                          <Chip
                            size="small"
                            icon={<Calendar size={14} />}
                            label={formatAssignmentDate(actif.assignedAt)}
                            variant="outlined"
                          />
                          {actif.quantity > 1 && (
                            <Chip
                              size="small"
                              label={`Quantité: ${actif.quantity}`}
                              variant="outlined"
                            />
                          )}
                        </Box>

                        {isPending && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              color: "warning.main",
                              fontStyle: "italic",
                            }}
                          >
                            En attente d&apos;acceptation par l&apos;employé
                          </Typography>
                        )}

                        {isAccepted && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              color: "success.main",
                              fontStyle: "italic",
                            }}
                          >
                            Accepté par l&apos;employé
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              );
            })}
          </List>
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {tabValue === 0
                ? "Aucun équipement assigné à cet employé"
                : tabValue === 1
                ? "Aucun équipement en attente d&apos;acceptation"
                : "Aucun équipement accepté"}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShowAssignedActifsDialog;
function useEffect(arg0: () => void, arg1: any[]) {
  throw new Error("Function not implemented.");
}
