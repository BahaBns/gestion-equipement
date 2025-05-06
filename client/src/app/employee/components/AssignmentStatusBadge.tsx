// components/AssignmentStatusBadge.tsx
import React from "react";
import { Chip, Tooltip, Box, Typography } from "@mui/material";
import { CheckCircle, Clock, AlertTriangle, HelpCircle } from "lucide-react";

type AssignmentStatusBadgeProps = {
  status: string;
  pendingCount?: number;
  acceptedCount?: number;
  totalCount?: number;
  showCounts?: boolean;
  size?: "small" | "medium";
  variant?: "outlined" | "filled";
};

const AssignmentStatusBadge: React.FC<AssignmentStatusBadgeProps> = ({
  status,
  pendingCount = 0,
  acceptedCount = 0,
  totalCount = 0,
  showCounts = true,
  size = "medium",
  variant = "outlined",
}) => {
  let icon;
  let color:
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning";
  let label = status;
  let tooltipText = "";

  // Configure badge based on status
  switch (status.toLowerCase()) {
    case "réservé":
    case "reserved":
    case "pending":
      icon = <Clock size={size === "small" ? 14 : 16} />;
      color = "warning";
      label = "En attente";
      tooltipText =
        "Équipements réservés en attente d'acceptation par l'employé";
      break;

    case "assigné":
    case "assigned":
    case "accepted":
      icon = <CheckCircle size={size === "small" ? 14 : 16} />;
      color = "success";
      label = "Accepté";
      tooltipText = "Équipements acceptés par l'employé";
      break;

    case "expiré":
    case "expired":
      icon = <AlertTriangle size={size === "small" ? 14 : 16} />;
      color = "error";
      label = "Expiré";
      tooltipText = "La demande d'acceptation a expiré";
      break;

    case "refusé":
    case "rejected":
      icon = <AlertTriangle size={size === "small" ? 14 : 16} />;
      color = "error";
      label = "Refusé";
      tooltipText = "L'employé a refusé l'assignation";
      break;

    case "mixed":
      // Special case for mixed status (when there are both pending and accepted actifs)
      icon = (
        <Box sx={{ display: "flex" }}>
          <Clock size={size === "small" ? 12 : 14} style={{ marginRight: 2 }} />
          <CheckCircle size={size === "small" ? 12 : 14} />
        </Box>
      );
      color = "info";
      label = "Mixte";
      tooltipText = `${pendingCount} en attente, ${acceptedCount} acceptés`;
      break;

    default:
      icon = <HelpCircle size={size === "small" ? 14 : 16} />;
      color = "default";
      label = status;
      tooltipText = "Statut inconnu";
  }

  // Prepare label with counts if needed
  const displayLabel =
    showCounts && totalCount > 0 ? `${label} (${totalCount})` : label;

  return (
    <Tooltip title={tooltipText}>
      <Chip
        icon={icon}
        label={displayLabel}
        color={color}
        size={size}
        variant={variant}
      />
    </Tooltip>
  );
};

export default AssignmentStatusBadge;
