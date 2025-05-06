// components/ContractDialog.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { Download, File } from "lucide-react";

interface ContractDialogProps {
  open: boolean;
  onClose: () => void;
  handleDownload: () => void;
  isDownloading: boolean;
}

const ContractDialog: React.FC<ContractDialogProps> = ({
  open,
  onClose,
  handleDownload,
  isDownloading,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Contrat d&apos;assignation</Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 2,
          }}
        >
          <File size={64} color="#d32f2f" />
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Contrat prêt à générer
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary">
            Un contrat d&apos;assignation peut être généré pour
            l&apos;équipement assigné. Cliquez sur le bouton pour ouvrir le
            contrat dans un nouvel onglet où vous pourrez l&apos;imprimer ou
            l&apos;enregistrer en PDF.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleDownload}
          variant="contained"
          color="primary"
          disabled={isDownloading}
          startIcon={
            isDownloading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Download size={20} />
            )
          }
        >
          {isDownloading ? "Génération..." : "Générer le contrat"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractDialog;
