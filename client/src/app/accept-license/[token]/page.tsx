// app/accept-license/[token]/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  useValidateLicenseTokenQuery,
  useAcceptLicenseAssignmentMutation,
  useRejectLicenseAssignmentMutation,
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
} from "@mui/material";
import {
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Key,
} from "lucide-react";

// Format date for display
const formatDate = (dateString: string | Date): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return "Date invalide";
  }
};

// License Assignment Acceptance Page
export default function AcceptLicense({
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

  // Fetch license assignment details from the token
  const { data, error, isLoading } = useValidateLicenseTokenQuery(token);

  // Mutations for accepting/rejecting
  const [acceptAssignment, { isLoading: isAccepting }] =
    useAcceptLicenseAssignmentMutation();
  const [rejectAssignment, { isLoading: isRejecting }] =
    useRejectLicenseAssignmentMutation();

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
            Vérification du lien d&apos;assignation de licences...
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
              Licences acceptées
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={2}>
              Vous avez accepté l&apos;assignation des licences. Un email de
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
              Licences refusées
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={2}>
              Vous avez refusé l&apos;assignation des licences. Les licences ont été
              remises à disposition.
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
          Assignation de licences logicielles
        </Typography>

        <Typography variant="body1" paragraph>
          Des licences logicielles ont été réservées pour vous. Veuillez les
          vérifier et les accepter si vous êtes d&apos;accord.
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
          Licences à accepter
        </Typography>

        <List>
          {data?.licenses?.map((license) => (
            <ListItem key={license.licenseId} disablePadding sx={{ py: 1 }}>
              <ListItemIcon>
                <Key />
              </ListItemIcon>
              <ListItemText
                primary={`${license.softwareName} ${license.version}`}
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      Type: {license.licenseType}
                    </Typography>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ display: "block" }}
                    >
                      Clé: {license.licenseKey}
                    </Typography>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ display: "block" }}
                    >
                      Expiration: {formatDate(license.expiryDate)}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ my: 4 }}>
          <Typography variant="h6" gutterBottom>
            Conditions d&apos;utilisation des licences
          </Typography>

          <Paper
            variant="outlined"
            sx={{ p: 2, mb: 3, maxHeight: "200px", overflow: "auto" }}
          >
            <Typography variant="body2">
              <strong>1. Utilisation autorisée</strong> L&apos;employé est autorisé à
              utiliser les licences logicielles uniquement dans le cadre de ses
              fonctions professionnelles et conformément aux conditions du
              fournisseur.
            </Typography>
            <Typography variant="body2" mt={2}>
              <strong>2. Non-transfert</strong> L&apos;employé ne doit pas
              transférer, prêter, louer ou céder les licences à un tiers.
            </Typography>
            <Typography variant="body2" mt={2}>
              <strong>3. Installation</strong> L&apos;employé peut installer le
              logiciel uniquement sur les appareils fournis ou autorisés par
              l&apos;entreprise.
            </Typography>
            <Typography variant="body2" mt={2}>
              <strong>4. Restitution</strong> L&apos;employé s&apos;engage à cesser toute
              utilisation des licences à la fin de son contrat ou à la demande
              de l&apos;entreprise.
            </Typography>
            <Typography variant="body2" mt={2}>
              <strong>5. Respect du droit d&apos;auteur</strong> L&apos;employé s&apos;engage à
              respecter les droits d&apos;auteur et les conditions de licence du
              fournisseur du logiciel.
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
            label="J&apos;accepte les conditions d&apos;utilisation et confirme l&apos;assignation de ces licences."
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
                  "Accepter les licences"
                )}
              </Button>
            </>
          ) : (
            <Box width="100%">
              <Typography variant="h6" gutterBottom>
                Motif du refus
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Veuillez indiquer pourquoi vous refusez ces licences (optionnel)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                margin="normal"
              />
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
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
          )}
        </Box>
      </Paper>
    </Container>
  );
}
