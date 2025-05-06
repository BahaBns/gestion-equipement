"use client";

import React, { useEffect } from "react";
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
import {
  X,
  Mail,
  Calendar,
  Tag,
  Clock,
  CheckCircle,
  Package,
} from "lucide-react";
import {  differenceInDays, distanceInWordsToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  License,
  EmployeeLicense,
  useGetCategoriesQuery,
  useGetStatusesQuery,
  useGetLicenseTypesQuery,
} from "@/state/api";

type ShowAssignedLicensesDialogProps = {
  open: boolean;
  onClose: () => void;
  assignedLicenses: any[]; // Accept any type to handle various data structures
  setLicenseToRemove: (licenseId: string | null) => void;
  resendInvitation?: (licenseId: string) => void;
};

// Helper function to determine if a license is in a specific status
const isLicenseInStatus = (license: any, statusName: string): boolean => {
  if (!license) return false;

  // Handle different data structures
  if (license.status?.name) {
    return license.status.name === statusName;
  }

  if (license.license?.status?.name) {
    return license.license.status.name === statusName;
  }

  return false;
};

const ShowAssignedLicensesDialog = ({
  open,
  onClose,
  assignedLicenses,
  setLicenseToRemove,
  resendInvitation,
}: ShowAssignedLicensesDialogProps) => {
  const [tabValue, setTabValue] = React.useState(0);

  // Fetch statuses for data supplementation
  const { data: statuses = [] } = useGetStatusesQuery();

  // Log the incoming data for debugging
  useEffect(() => {
    if (open) {
      console.log(
        "ShowAssignedLicensesDialog - assigned licenses:",
        assignedLicenses
      );
    }
  }, [open, assignedLicenses]);

  // Create a map of statusId -> status data for quick lookups
  const statusMap = React.useMemo(() => {
    const map = new Map();
    statuses.forEach((status) => {
      map.set(status.statusId, status);
    });
    return map;
  }, [statuses]);

  // Helper function to get status name
  const getStatusName = (license: any) => {
    // Try direct path first
    if (license.status?.name) {
      return license.status.name;
    }

    // For nested license object
    if (license.license?.status?.name) {
      return license.license.status.name;
    }

    // Look up by statusId if it exists
    if (license.statusId && statusMap.has(license.statusId)) {
      return statusMap.get(license.statusId).name;
    }

    // For nested license object
    if (license.license?.statusId && statusMap.has(license.license.statusId)) {
      return statusMap.get(license.license.statusId).name;
    }

    return "Statut inconnu";
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

  // Format the expiry date
  const formatExpiryDate = (dateString?: string | Date) => {
    try {
      if (!dateString) return "Date inconnue";
      const date = new Date(dateString);

      // Calculate days until/since expiry
      const today = new Date();
      const daysUntilExpiry = differenceInDays(date, today);

      let colorClass = "";
      if (daysUntilExpiry < 0) {
        colorClass = "error.main"; // Expired
      } else if (daysUntilExpiry < 30) {
        colorClass = "warning.main"; // Expiring soon
      }

      return (
        <Typography component="span" color={colorClass}>
          {distanceInWordsToNow(date, { addSuffix: true, locale: fr }as any)}
        </Typography>
      );
    } catch (error) {
      return "Date inconnue";
    }
  };

  // Get license data regardless of where it's located in the props structure
  const getLicenseData = (item: any) => {
    if (!item) return null;

    if (item.license) {
      return {
        ...item.license,
        quantity: item.quantity || 1,
        assignedAt: item.assignedAt || new Date().toISOString(),
      };
    }
    return item;
  };

  // Filter licenses based on tab selection
  const filteredLicenses = React.useMemo(() => {
    if (tabValue === 0) {
      // All
      return assignedLicenses;
    } else if (tabValue === 1) {
      // Reserved (Pending)
      return assignedLicenses.filter((license) =>
        isLicenseInStatus(license, "Réservé")
      );
    } else {
      // Assigned (Accepted)
      return assignedLicenses.filter((license) =>
        isLicenseInStatus(license, "Assigné")
      );
    }
  }, [assignedLicenses, tabValue]);

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Typography variant="h6">Licences assignées</Typography>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          aria-label="license tabs"
        >
          <Tab label="Toutes" />
          <Tab
            label={
              <Box display="flex" alignItems="center">
                <Clock size={16} className="mr-1" /> En attente
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center">
                <CheckCircle size={16} className="mr-1" /> Acceptées
              </Box>
            }
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ minHeight: "400px", pt: 2 }}>
        {filteredLicenses && filteredLicenses.length > 0 ? (
          <List>
            {filteredLicenses
              .map((item, index) => {
                const license = getLicenseData(item);
                if (!license || !license.licenseId) {
                  console.warn("Invalid license item:", item);
                  return null;
                }

                const statusName = getStatusName(license);
                const isPending = statusName === "Réservé";
                const isAccepted = statusName === "Assigné";

                return (
                  <React.Fragment key={license.licenseId || `license-${index}`}>
                    <ListItem
                      sx={{
                        py: 2,
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "center" },
                      }}
                      secondaryAction={
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Retirer la licence">
                            <IconButton
                              edge="end"
                              color="error"
                              onClick={() =>
                                setLicenseToRemove(license.licenseId)
                              }
                            >
                              <X size={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <Box className="flex items-start w-full pr-16">
                        <div className="mr-3 flex items-center justify-center mt-1">
                          <Package size={24} color="#9c27b0" />
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
                              {license.softwareName || "Nom inconnu"}{" "}
                              {license.version || ""}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Type: {license.licenseType || "Standard"} - Clé:{" "}
                              {license.licenseKey || "N/A"}
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
                              label={`Assigné: ${formatAssignmentDate(
                                license.assignedAt
                              )}`}
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              icon={<Calendar size={14} />}
                              label={
                                <Typography component="span">
                                  Expiration:{" "}
                                  {formatExpiryDate(license.expiryDate)}
                                </Typography>
                              }
                              variant="outlined"
                            />
                            {license.quantity && license.quantity > 1 && (
                              <Chip
                                size="small"
                                label={`Quantité: ${license.quantity}`}
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
              })
              .filter(Boolean)}
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
                ? "Aucune licence assignée à cet employé"
                : tabValue === 1
                ? "Aucune licence en attente d'acceptation"
                : "Aucune licence acceptée"}
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

export default ShowAssignedLicensesDialog;
