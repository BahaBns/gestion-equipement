// components/LicenseStatusBadge.tsx
import React from "react";
import { Chip, Tooltip, Box, Typography } from "@mui/material";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  HelpCircle,
  Key,
} from "lucide-react";

type LicenseStatusBadgeProps = {
  status: string;
  pendingCount?: number;
  acceptedCount?: number;
  totalCount?: number;
  showCounts?: boolean;
  size?: "small" | "medium";
  variant?: "outlined" | "filled";
  expiringCount?: number;
};

const LicenseStatusBadge: React.FC<LicenseStatusBadgeProps> = ({
  status,
  pendingCount = 0,
  acceptedCount = 0,
  totalCount = 0,
  showCounts = true,
  size = "medium",
  variant = "outlined",
  expiringCount = 0,
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
      tooltipText = "Licences réservées en attente d'acceptation par l'employé";
      break;

    case "assigné":
    case "assigned":
    case "accepted":
      icon = <CheckCircle size={size === "small" ? 14 : 16} />;
      color = "success";
      label = "Accepté";
      tooltipText = "Licences acceptées par l'employé";
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

    case "expiring":
      icon = <AlertTriangle size={size === "small" ? 14 : 16} />;
      color = "warning";
      label = "Expirant";
      tooltipText = `${expiringCount} licences expirent dans moins de 30 jours`;
      break;

    case "mixed":
      // Special case for mixed status (when there are both pending and accepted licenses)
      icon = (
        <Box sx={{ display: "flex" }}>
          <Clock size={size === "small" ? 12 : 14} style={{ marginRight: 2 }} />
          <CheckCircle size={size === "small" ? 12 : 14} />
        </Box>
      );
      color = "info";
      label = "Mixte";
      tooltipText = `${pendingCount} en attente, ${acceptedCount} acceptées`;
      break;

    default:
      icon = <Key size={size === "small" ? 14 : 16} />;
      color = "secondary";
      label = status;
      tooltipText =
        totalCount > 0 ? `${totalCount} licences assignées` : "Licences";
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

export default LicenseStatusBadge;
