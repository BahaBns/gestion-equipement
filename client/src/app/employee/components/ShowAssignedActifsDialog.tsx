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
  Card,
  CardContent,
  Avatar,
  Grid,
  Alert,
  Collapse,
} from "@mui/material";
import { 
  X, 
  Mail, 
  Calendar, 
  Tag, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Package,
  User,
  Hash,
  Truck,
  Info,
  Expand,
  Shrink
} from "lucide-react";
import {
  getIconForSubcategory,
  getIconColorForCategory,
} from "../../(components)/utils/iconUtils";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { fr } from "date-fns/locale/fr";
import {
  Actif,
  EmployeeActif,
  useGetCategoriesQuery,
  useGetStatusesQuery,
  useGetMarquesQuery,
  useGetModelesQuery,
} from "@/state/api";

type AssignedActifItem = EmployeeActif | (Actif & { 
  quantity: number; 
  assignedAt: string;
  assignmentStatus?: { statusId: string; name: string };
  assignmentStatusId?: string;
  statusId?: string; // This might be assignment-level status ID
  status?: { statusId: string; name: string }; // This could be assignment-level or global
});

type ShowAssignedActifsDialogProps = {
  open: boolean;
  onClose: () => void;
  assignedActifs: AssignedActifItem[];
  setActifToRemove: (actifId: string | null) => void;
  resendInvitation?: (actifId: string) => void;
  refetchData?: () => void;
};

// Helper to extract assignment-level status (prioritizing assignment status over global actif status)
const getAssignmentStatus = (item: any): { statusName: string; statusId: string | null; isAssignmentLevel: boolean } => {
  console.log('🔍 Analyzing item structure:', item);

  // PRIORITY 1: Direct assignment status (NEW structure)
  if (item.assignmentStatus?.name) {
    console.log('✅ Found assignmentStatus:', item.assignmentStatus.name);
    return {
      statusName: item.assignmentStatus.name,
      statusId: item.assignmentStatus.statusId || item.assignmentStatusId || null,
      isAssignmentLevel: true
    };
  }

  // PRIORITY 2: Assignment status ID mapping
  if (item.assignmentStatusId) {
    console.log('✅ Found assignmentStatusId:', item.assignmentStatusId);
    // Map common status IDs to names
    let statusName = "Réservé"; // Default
    if (item.assignmentStatusId.includes("ASSIGNED") || item.assignmentStatusId === "STA-2") {
      statusName = "Assigné";
    } else if (item.assignmentStatusId.includes("RESERVED") || item.assignmentStatusId === "STA-1") {
      statusName = "Réservé";
    }
    
    return {
      statusName,
      statusId: item.assignmentStatusId,
      isAssignmentLevel: true
    };
  }

  // PRIORITY 3: Direct status when it's likely assignment-level (no nested actif structure)
  if (item.status?.name && !item.actif) {
    console.log('✅ Found direct assignment status:', item.status.name);
    return {
      statusName: item.status.name,
      statusId: item.status.statusId || item.statusId || null,
      isAssignmentLevel: true
    };
  }

  // PRIORITY 4: Status in EmployeeActif structure (assignment-level)
  if (item.status?.name && item.actif) {
    console.log('✅ Found EmployeeActif assignment status:', item.status.name);
    return {
      statusName: item.status.name,
      statusId: item.status.statusId || null,
      isAssignmentLevel: true
    };
  }

  // FALLBACK: Try to find any status but mark as uncertain
  if (item.actif?.status?.name) {
    console.log('⚠️ Fallback to nested actif status (might be global):', item.actif.status.name);
    return {
      statusName: item.actif.status.name,
      statusId: item.actif.status.statusId || null,
      isAssignmentLevel: false
    };
  }

  console.log('❌ No status found, defaulting to Réservé');
  return {
    statusName: "Réservé",
    statusId: null,
    isAssignmentLevel: false
  };
};

// Helper to extract actif data from different structures
const getActifData = (item: any) => {
  if (item.actif) {
    return {
      ...item.actif,
      quantity: item.quantity || 1,
      assignedAt: item.assignedAt,
      // Include assignment-level data
      assignmentStatus: item.assignmentStatus,
      assignmentStatusId: item.assignmentStatusId,
      assignmentQuantity: item.quantity
    };
  }
  return item;
};

// Helper to get status color
const getStatusColor = (statusName: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  const normalized = statusName.toLowerCase();
  if (normalized.includes('réservé') || normalized.includes('pending') || normalized.includes('attente')) {
    return 'warning';
  }
  if (normalized.includes('assigné') || normalized.includes('accepted') || normalized.includes('accepté')) {
    return 'success';
  }
  if (normalized.includes('rejeté') || normalized.includes('refused') || normalized.includes('rejected')) {
    return 'error';
  }
  return 'default';
};

const ShowAssignedActifsDialog = ({
  open,
  onClose,
  assignedActifs,
  setActifToRemove,
  resendInvitation,
  refetchData,
}: ShowAssignedActifsDialogProps) => {
  const [hasOpened, setHasOpened] = React.useState(false);
  const [tabValue, setTabValue] = React.useState(0);
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  // Refresh data when dialog opens
  React.useEffect(() => {
    if (open && refetchData && !hasOpened) {
      refetchData();
      setHasOpened(true);
    }
    if (!open && hasOpened) {
      setHasOpened(false);
    }
  }, [open, refetchData, hasOpened]);

  // Fetch reference data
  const { data: marques = [] } = useGetMarquesQuery();
  const { data: modeles = [] } = useGetModelesQuery();

  // Helper functions for data extraction
  const getMarqueName = (actif: any): string => {
    if (actif?.marqueObj?.name) return actif.marqueObj.name;
    if (actif?.actif?.marqueObj?.name) return actif.actif.marqueObj.name;
    
    const marqueId = actif?.marqueId || actif?.actif?.marqueId;
    if (marqueId) {
      const marque = marques.find((m) => m.marqueId === marqueId);
      if (marque) return marque.name;
    }
    return "Non spécifié";
  };

  const getModeleName = (actif: any): string => {
    if (actif?.modeleObj?.name) return actif.modeleObj.name;
    if (actif?.actif?.modeleObj?.name) return actif.actif.modeleObj.name;
    
    const modeleId = actif?.modeleId || actif?.actif?.modeleId;
    if (modeleId) {
      const modele = modeles.find((m) => m.modeleId === modeleId);
      if (modele) return modele.name;
    }
    return "Non spécifié";
  };

  const getActifTypeName = (actif: any): string => {
    if (actif?.actiftype?.nom) return actif.actiftype.nom;
    if (actif?.actif?.actiftype?.nom) return actif.actif.actiftype.nom;
    return actif?.actifType || actif?.actif?.actifType || "Type inconnu";
  };

  const getCategoryName = (actif: any): string => {
    if (actif?.actiftype?.category?.nom) return actif.actiftype.category.nom;
    if (actif?.actif?.actiftype?.category?.nom) return actif.actif.actiftype.category.nom;
    return "Équipement";
  };

  // Render actif icon
  const renderActifIcon = (actif: any) => {
    const actifData = actif.actif || actif;
    const actifType = getActifTypeName(actifData);
    const category = getCategoryName(actifData);

    const IconComponent = getIconForSubcategory(actifType, category);
    const iconColor = getIconColorForCategory(category);

    return React.createElement(IconComponent, {
      size: 24,
      color: iconColor,
    });
  };

  // Format dates
  const formatAssignmentDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: fr,
      });
    } catch (error) {
      return "Date inconnue";
    }
  };

  const formatFullDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Date inconnue";
    }
  };

  // Count actifs by status for tabs
  const statusCounts = React.useMemo(() => {
    const counts = { all: 0, pending: 0, accepted: 0, other: 0 };
    
    assignedActifs.forEach((item) => {
      counts.all++;
      const { statusName } = getAssignmentStatus(item);
      const normalized = statusName.toLowerCase();
      
      if (normalized.includes('réservé') || normalized.includes('pending') || normalized.includes('attente')) {
        counts.pending++;
      } else if (normalized.includes('assigné') || normalized.includes('accepted') || normalized.includes('accepté')) {
        counts.accepted++;
      } else {
        counts.other++;
      }
    });
    
    return counts;
  }, [assignedActifs]);

  // Filter actifs based on tab selection
  const filteredActifs = React.useMemo(() => {
    if (tabValue === 0) return assignedActifs; // All
    
    return assignedActifs.filter((item) => {
      const { statusName } = getAssignmentStatus(item);
      const normalized = statusName.toLowerCase();
      
      if (tabValue === 1) { // Pending
        return normalized.includes('réservé') || normalized.includes('pending') || normalized.includes('attente');
      } else if (tabValue === 2) { // Accepted
        return normalized.includes('assigné') || normalized.includes('accepted') || normalized.includes('accepté');
      }
      
      return true;
    });
  }, [assignedActifs, tabValue]);

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleExpanded = (actifId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(actifId)) {
      newExpanded.delete(actifId);
    } else {
      newExpanded.add(actifId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Package size={24} color="#1976d2" />
          <Typography variant="h6" component="h2">
            Équipements assignés
          </Typography>
          <Chip 
            label={`${statusCounts.all} équipement${statusCounts.all > 1 ? 's' : ''}`}
            size="small"
            variant="outlined"
          />
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          aria-label="equipment status tabs"
        >
          <Tab 
            label={`Tous (${statusCounts.all})`}
            icon={<Package size={16} />}
            iconPosition="start"
          />
          <Tab 
            label={`En attente (${statusCounts.pending})`}
            icon={<Clock size={16} />}
            iconPosition="start"
          />
          <Tab 
            label={`Acceptés (${statusCounts.accepted})`}
            icon={<CheckCircle size={16} />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ minHeight: "500px", pt: 2, px: 2 }}>
        {filteredActifs.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredActifs.map((item) => {
              const actif = getActifData(item);
              const { statusName, statusId, isAssignmentLevel } = getAssignmentStatus(item);
              const isExpanded = expandedItems.has(actif.actifId);
              
              return (
                <Card 
                  key={actif.actifId} 
                  variant="outlined"
                  sx={{ 
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { 
                      boxShadow: 2,
                      borderColor: 'primary.main' 
                    }
                  }}
                >
                  <CardContent sx={{ pb: 2 }}>
                    <Grid container spacing={2} alignItems="flex-start">
                      {/* Icon and Basic Info */}
                      <Grid item xs={12} sm={8}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'background.paper', 
                              border: '2px solid',
                              borderColor: 'divider',
                              width: 48,
                              height: 48
                            }}
                          >
                            {renderActifIcon(actif)}
                          </Avatar>
                          
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                mb: 0.5,
                                wordBreak: 'break-word'
                              }}
                            >
                              {getActifTypeName(actif)}
                            </Typography>
                            
                            <Typography 
                              variant="body1" 
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              {getMarqueName(actif)} • {getModeleName(actif)}
                            </Typography>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                              <Chip
                                size="small"
                                icon={<Tag size={14} />}
                                label={statusName}
                                color={getStatusColor(statusName)}
                                variant="filled"
                              />
                              
                              {!isAssignmentLevel && (
                                <Chip
                                  size="small"
                                  icon={<AlertCircle size={14} />}
                                  label="Statut global"
                                  color="warning"
                                  variant="outlined"
                                />
                              )}
                              
                              <Chip
                                size="small"
                                icon={<Calendar size={14} />}
                                label={formatAssignmentDate(actif.assignedAt)}
                                variant="outlined"
                              />
                              
                              {actif.quantity > 1 && (
                                <Chip
                                  size="small"
                                  icon={<Hash size={14} />}
                                  label={`Qté: ${actif.quantity}`}
                                  variant="outlined"
                                  color="primary"
                                />
                              )}
                            </Box>

                            {/* Status explanation */}
                            {statusName === "Réservé" && (
                              <Alert 
                                severity="warning" 
                                variant="outlined" 
                                sx={{ mb: 1 }}
                                icon={<Clock size={16} />}
                              >
                                <Typography variant="caption">
                                  En attente d'acceptation par l'employé. 
                                  {resendInvitation && (
                                    <Button 
                                      size="small" 
                                      sx={{ ml: 1 }}
                                      onClick={() => resendInvitation(actif.actifId)}
                                    >
                                      Renvoyer l'invitation
                                    </Button>
                                  )}
                                </Typography>
                              </Alert>
                            )}

                            {statusName === "Assigné" && (
                              <Alert 
                                severity="success" 
                                variant="outlined" 
                                sx={{ mb: 1 }}
                                icon={<CheckCircle size={16} />}
                              >
                                <Typography variant="caption">
                                  Accepté et confirmé par l'employé
                                </Typography>
                              </Alert>
                            )}
                          </Box>
                        </Box>
                      </Grid>

                      {/* Actions */}
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'row', sm: 'column' },
                          gap: 1,
                          alignItems: { xs: 'center', sm: 'flex-end' },
                          justifyContent: { xs: 'flex-end', sm: 'flex-start' }
                        }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={isExpanded ? <Shrink size={16} /> : <Expand size={16} />}
                            onClick={() => toggleExpanded(actif.actifId)}
                            sx={{ minWidth: 120 }}
                          >
                            {isExpanded ? 'Moins' : 'Détails'}
                          </Button>
                          
                          <Tooltip title="Retirer cet équipement">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => setActifToRemove(actif.actifId)}
                              sx={{ 
                                border: '1px solid',
                                borderColor: 'error.main',
                                '&:hover': { 
                                  backgroundColor: 'error.main',
                                  color: 'white'
                                }
                              }}
                            >
                              <X size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Expanded Details */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Divider sx={{ my: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Informations de l'équipement
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Numéro de série:</strong> {actif.serialNumber || 'Non spécifié'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Catégorie:</strong> {getCategoryName(actif)}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>ID Équipement:</strong> <code>{actif.actifId}</code>
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Détails de l'assignation
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Date d'assignation:</strong> {formatFullDate(actif.assignedAt)}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Statut d'assignation:</strong> {statusName}
                              {isAssignmentLevel && (
                                <Chip size="small" label="✓ Niveau assignation" color="success" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                            {statusId && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>ID Statut:</strong> <code>{statusId}</code>
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Collapse>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "300px",
              textAlign: "center",
              gap: 2
            }}
          >
            <Package size={48} color="#ccc" />
            <Typography variant="h6" color="text.secondary">
              {tabValue === 0
                ? "Aucun équipement assigné"
                : tabValue === 1
                ? "Aucun équipement en attente"
                : "Aucun équipement accepté"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 0
                ? "Cet employé n'a pas encore d'équipements assignés."
                : tabValue === 1
                ? "Tous les équipements ont été acceptés ou il n'y a pas d'assignations en attente."
                : "L'employé n'a pas encore accepté d'équipements."}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Affichage des statuts au niveau assignation (priorité sur les statuts globaux)
          </Typography>
        </Box>
        <Button onClick={onClose} variant="contained" color="primary">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShowAssignedActifsDialog;