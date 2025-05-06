// components/RemoveActifDialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Alert,
} from "@mui/material";
import { AlertTriangle } from "lucide-react";

type RemoveActifDialogProps = {
  open: boolean;
  onClose: () => void;
  handleRemoveActif: (reason?: string) => Promise<void>;
  isPending?: boolean; // Is the actif pending acceptance
};

const RemoveActifDialog = ({
  open,
  onClose,
  handleRemoveActif,
  isPending = false,
}: RemoveActifDialogProps) => {
  const [reason, setReason] = useState<string>("");
  const [reasonType, setReasonType] = useState<string>("returning");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset form when dialog opens/closes
  const handleClose = () => {
    setReason("");
    setReasonType("returning");
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Format the complete reason based on the reason type
      let formattedReason = "";

      if (reasonType === "returning") {
        formattedReason =
          "Retour d'équipement: " + (reason || "Retour standard");
      } else if (reasonType === "cancellation") {
        formattedReason =
          "Annulation de réservation: " + (reason || "Annulation standard");
      } else {
        formattedReason = reason;
      }

      await handleRemoveActif(formattedReason);
      handleClose();
    } catch (error) {
      console.error("Failed to remove actif:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        {isPending ? "Annuler la réservation" : "Retirer l'équipement"}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography>
            {isPending
              ? "Êtes-vous sûr de vouloir annuler cette réservation d'équipement ?"
              : "Êtes-vous sûr de vouloir retirer cet équipement de l'employé ?"}
          </Typography>

          {isPending && (
            <Alert
              severity="info"
              icon={<AlertTriangle size={18} />}
              sx={{ mt: 2 }}
            >
              L'équipement est actuellement en attente d'acceptation par
              l'employé. Annuler la réservation supprimera la demande
              d'acceptation.
            </Alert>
          )}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Raison
          </Typography>

          <RadioGroup
            value={reasonType}
            onChange={(e) => setReasonType(e.target.value)}
          >
            <FormControlLabel
              value={isPending ? "cancellation" : "returning"}
              control={<Radio />}
              label={
                isPending ? "Annulation de réservation" : "Retour d'équipement"
              }
            />
            <FormControlLabel
              value="other"
              control={<Radio />}
              label="Autre raison"
            />
          </RadioGroup>

          <TextField
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Détails complémentaires (optionnel)"
            margin="normal"
            variant="outlined"
            size="small"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="primary" disabled={isSubmitting}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} color="error" disabled={isSubmitting}>
          {isSubmitting
            ? "Traitement en cours..."
            : isPending
            ? "Confirmer l'annulation"
            : "Confirmer le retrait"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveActifDialog;
