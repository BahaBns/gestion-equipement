"use client";

import { useState, useEffect } from "react";
import {
  useValidateAssignmentTokenQuery,
  useAcceptAssignmentMutation,
  useRejectAssignmentMutation,
  Actif,
} from "@/state/api";
import {
  Box,
  Typography,
  Button,
  Paper,
  Checkbox,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Container,
  TextField,
  Chip,
} from "@mui/material";
import {
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

// Assignment Acceptance Page
export default function AcceptAssignment({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "accepted" | "rejected"
  >("loading");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch assignment details from the token
  const { data, error, isLoading } = useValidateAssignmentTokenQuery(token);

  // Mutations for accepting/rejecting
  const [acceptAssignment, { isLoading: isAccepting }] =
    useAcceptAssignmentMutation();
  const [rejectAssignment, { isLoading: isRejecting }] =
    useRejectAssignmentMutation();

  // When data is loaded, update status
  useEffect(() => {
    if (isLoading) {
      setStatus("loading");
    } else if (error) {
      setStatus("error");
      setErrorMessage("Ce lien d&apos;assignation n&apos;est pas valide ou a expiré.");
    } else if (data) {
      if (data.valid) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(
          data.message || "Erreur de validation du lien d&apos;assignation."
        );
      }
    }
  }, [data, error, isLoading]);

  // Helper function to get device display name
  const getDeviceDisplayName = (actif: Actif) => {
    // Try to build a name from marque and model
    if (actif.marqueObj?.name && actif.modeleObj?.name) {
      return `${actif.marqueObj.name} ${actif.modeleObj.name}`;
    }

    // If marque exists but not model
    if (actif.marqueObj?.name) {
      return `${actif.marqueObj.name} ${actif.serialNumber}`;
    }

    // If we have actifType and actiftype.nom, use that with serial number
    if (actif.actifType || (actif.actiftype && actif.actiftype.nom)) {
      const typeName = actif.actiftype?.nom || actif.actifType;
      return `${typeName} - ${actif.serialNumber}`;
    }

    // Last fallback - just show the serial number
    return `Équipement ${actif.serialNumber}`;
  };

  // Handle acceptance
  const handleAccept = async () => {
    if (!acceptTerms) {
      return;
    }

    try {
      const result = await acceptAssignment({ token, acceptTerms }).unwrap();
      if (result.success) {
        setStatus("accepted");
      } else {
        setStatus("error");
        setErrorMessage(result.message || "Erreur lors de l&apos;acceptation.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(
        err.data?.message || "Une erreur s&apos;est produite lors de l&apos;acceptation."
      );
    }
  };

  // Handle rejection
  const handleReject = async () => {
    try {
      const result = await rejectAssignment({
        token,
        reason: rejectionReason,
      }).unwrap();
      if (result.success) {
        setStatus("rejected");
      } else {
        setStatus("error");
        setErrorMessage(result.message || "Erreur lors du refus.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(
        err.data?.message || "Une erreur s&apos;est produite lors du refus."
      );
    }
  };

  // Render loading state
  if (status === "loading") {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" mt={4}>
            Vérification du lien d&apos;assignation...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Render error state
  if (status === "error") {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
          >
            <AlertTriangle size={64} color="#f44336" />
            <Typography variant="h5" mt={3}>
              Lien d&apos;assignation invalide
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={2}>
              {errorMessage}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 4 }}
              onClick={() => (window.location.href = "/")}
            >
              Retour à l&apos;accueil
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Render accepted state
  if (status === "accepted") {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
          >
            <CheckCircle size={64} color="#4caf50" />
            <Typography variant="h5" mt={3}>
              Assignation acceptée
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={2}>
              Vous avez accepté l&apos;assignation des équipements. Un email de
              confirmation vous a été envoyé.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 4 }}
              onClick={() => (window.location.href = "/")}
            >
              Retour à l&apos;accueil
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Render rejected state
  if (status === "rejected") {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
          >
            <XCircle size={64} color="#f44336" />
            <Typography variant="h5" mt={3}>
              Assignation refusée
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={2}>
              Vous avez refusé l&apos;assignation des équipements. Les équipements
              ont été remis en stock.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 4 }}
              onClick={() => (window.location.href = "/")}
            >
              Retour à l&apos;accueil
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Render the assignment details for acceptance
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Assignation d&apos;équipements
        </Typography>

        <Typography variant="body1" paragraph>
          Des équipements ont été réservés pour vous. Veuillez les vérifier et
          les accepter si vous êtes d&apos;accord.
        </Typography>

        <Box mt={4} mb={4}>
          <Typography variant="h6" gutterBottom>
            Informations de l&apos;employé
          </Typography>
          <Typography variant="body1">
            <strong>Nom:</strong> {data?.employee?.nom}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {data?.employee?.email}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Équipements à accepter
        </Typography>

        {data?.actifs?.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            Aucun équipement à afficher
          </Alert>
        ) : (
          <List>
            {data?.actifs?.map((actif) => (
              <Paper
                key={actif.actifId}
                variant="outlined"
                sx={{ mb: 2, p: 2, borderRadius: 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <ListItemIcon>
                    <Package />
                  </ListItemIcon>
                  <Typography variant="h6">
                    {getDeviceDisplayName(actif)}
                  </Typography>
                </Box>

                <Box sx={{ pl: 6, mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>N° de série:</strong> {actif.serialNumber}
                  </Typography>

                  {actif.actiftype?.nom && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Type:</strong> {actif.actiftype.nom}
                    </Typography>
                  )}

                  {actif.status?.name && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Statut:</strong> {actif.status.name}
                    </Typography>
                  )}

                  {actif.etat?.name && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>État:</strong> {actif.etat.name}
                    </Typography>
                  )}

                  {actif.quantity > 1 && (
                    <Chip
                      label={`Quantité: ${actif.quantity}`}
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </Paper>
            ))}
          </List>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ my: 4 }}>
          <Typography variant="h6" gutterBottom>
            Conditions d&apos;utilisation
          </Typography>

          <Paper
            variant="outlined"
            sx={{ p: 2, mb: 3, maxHeight: "200px", overflow: "auto" }}
          >
            <Typography variant="body2">
              <strong>1. Responsabilité</strong> L&apos;employé est responsable des
              équipements mis à sa disposition et s&apos;engage à les utiliser avec
              soin et uniquement dans le cadre de ses fonctions
              professionnelles.
            </Typography>
            <Typography variant="body2" mt={2}>
              <strong>2. Maintenance</strong> L&apos;employé doit signaler
              immédiatement tout dysfonctionnement ou dommage constaté sur les
              équipements.
            </Typography>
            <Typography variant="body2" mt={2}>
              <strong>3. Restitution</strong> L&apos;employé s&apos;engage à restituer les
              équipements à la fin de son contrat ou à la demande de
              l&apos;entreprise.
            </Typography>
            <Typography variant="body2" mt={2}>
              <strong>4. Utilisation</strong> L&apos;employé s&apos;engage à ne pas
              installer de logiciels non autorisés sur les équipements.
            </Typography>
            <Typography variant="body2" mt={2}>
              <strong>5. Confidentialité</strong> L&apos;employé s&apos;engage à protéger
              les données confidentielles présentes sur les équipements.
            </Typography>
          </Paper>

          <FormControlLabel
            control={
              <Checkbox
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                color="primary"
              />
            }
            label="J&apos;accepte les conditions d&apos;utilisation et confirme l&apos;assignation de ces équipements."
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          {!showRejectionForm ? (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setShowRejectionForm(true)}
              >
                Refuser
              </Button>

              <Button
                variant="contained"
                color="primary"
                disabled={!acceptTerms || isAccepting}
                onClick={handleAccept}
              >
                {isAccepting ? (
                  <CircularProgress size={24} />
                ) : (
                  "Accepter l'assignation"
                )}
              </Button>
            </>
          ) : (
            <>
              <Box sx={{ width: "100%" }}>
                <TextField
                  label="Motif du refus (optionnel)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={3}
                  margin="normal"
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => setShowRejectionForm(false)}
                  >
                    Retour
                  </Button>

                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleReject}
                    disabled={isRejecting}
                  >
                    {isRejecting ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Confirmer le refus"
                    )}
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
