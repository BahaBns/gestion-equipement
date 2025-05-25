"use client";

import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash"; // Import debounce from lodash
import {
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Typography,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import { Trash2, Upload, Paperclip } from "lucide-react";
import {
  Actif,
  Category,
  Status,
  Etat,
  ActifType,
  Attachment,
  Marque,
  Modele,
  Fournisseur,
  useGetActifAttachmentsQuery,
  useUploadMultipleAttachmentsMutation,
  useDeleteAttachmentMutation,
  useGetAllActifTypesQuery,
  useGetMarquesByActifTypeQuery,
  useGetModelesByMarqueQuery,
  useGetFournisseursQuery,
  useGetActifBySerialNumberQuery, // Import the query hook for serial number check
} from "@/state/api";

interface FileUploadComponentProps {
  actifId: string;
  attachments: Attachment[];
  onUpload: () => void;
}

// File Upload Component
const FileUploadComponent = ({
  actifId,
  attachments,
  onUpload,
}: FileUploadComponentProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMultipleAttachments, { isLoading: isUploading }] =
    useUploadMultipleAttachmentsMutation();
  const [deleteAttachment, { isLoading: isDeleting }] =
    useDeleteAttachmentMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setFiles(fileArray);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    try {
      await uploadMultipleAttachments({ actifId, files }).unwrap();
      setFiles([]);
      onUpload();
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId).unwrap();
      onUpload();
    } catch (error) {
      console.error("Error deleting attachment:", error);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Fichiers attachés
      </Typography>

      {/* Existing Attachments */}
      {attachments.length > 0 && (
        <List dense>
          {attachments.map((attachment) => (
            <ListItem key={attachment.attachmentId}>
              <Paperclip size={18} style={{ marginRight: 8 }} />
              <ListItemText
                primary={attachment.fileName}
                secondary={attachment.fileType}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDelete(attachment.attachmentId)}
                  disabled={isDeleting}
                >
                  <Trash2 size={18} />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Upload New Files */}
      <Box sx={{ mt: 2, mb: 2 }}>
        <input
          accept="*/*"
          style={{ display: "none" }}
          id="contained-button-file"
          multiple
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="contained-button-file">
          <Button
            variant="outlined"
            component="span"
            startIcon={<Upload size={18} />}
          >
            Sélectionner des fichiers
          </Button>
        </label>

        {files.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2">
              {files.length} fichier(s) sélectionné(s)
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={isUploading}
              size="small"
              sx={{ mt: 1 }}
            >
              {isUploading ? <CircularProgress size={24} /> : "Télécharger"}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

interface EditActifModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (formData: FormData) => void;
  actif: Actif;
  categories: Category[];
  statuses: Status[];
  etats: Etat[];
  actifTypes: ActifType[];
}

const EditActifModal = ({
  isOpen,
  onClose,
  onUpdate,
  actif,
  categories,
  statuses,
  etats,
  actifTypes,
}: EditActifModalProps) => {
  // Form state
  const [serialNumber, setSerialNumber] = useState(actif?.serialNumber || "");
  const [originalSerialNumber, setOriginalSerialNumber] = useState(
    actif?.serialNumber || ""
  );
  const [actifTypeId, setActifTypeId] = useState(actif?.actifTypeId || "");
  const [actifType, setActifType] = useState(actif?.actifType || "");
  const [statusId, setStatusId] = useState(actif?.statusId || "");
  const [etatId, setEtatId] = useState(actif?.etatId || "");
  const [quantity, setQuantity] = useState(actif?.quantity || 1);
  const [warrantyEnd, setWarrantyEnd] = useState<string>("");

  // New fields for relational data
  const [marqueId, setMarqueId] = useState(actif?.marqueId || "");
  const [modeleId, setModeleId] = useState(actif?.modeleId || "");
  const [fournisseurId, setFournisseurId] = useState("");

  // Serial number validation states
  const [isCheckingSerial, setIsCheckingSerial] = useState(false);
  const [serialExists, setSerialExists] = useState(false);
  const [serialTouched, setSerialTouched] = useState(false);

  // State for specifications
  const [showSpecifications, setShowSpecifications] = useState(
    !!actif?.specification
  );
  const [specIncrements, setSpecIncrements] = useState({
    ram: "",
    cpu: "",
    stockage: "",
    graphique: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Get attachments
  const { data: attachments = [], refetch: refetchAttachments } =
    useGetActifAttachmentsQuery(actif?.actifId || "", {
      skip: !actif?.actifId,
    });

  // Get actif types, brands, models, and suppliers
  const { data: allActifTypes = [] } = useGetAllActifTypesQuery();
  const { data: marques = [], isLoading: isLoadingMarques } =
    useGetMarquesByActifTypeQuery(actifTypeId, {
      skip: !actifTypeId,
    });
  const { data: modeles = [], isLoading: isLoadingModeles } =
    useGetModelesByMarqueQuery(marqueId, {
      skip: !marqueId,
    });
  const { data: fournisseurs = [], isLoading: isLoadingFournisseurs } =
    useGetFournisseursQuery();

  // Set up the query hook for checking serial number uniqueness
  const { data: existingActif, isLoading: isSerialCheckLoading } =
    useGetActifBySerialNumberQuery(serialNumber, {
      skip:
        !serialNumber ||
        !isCheckingSerial ||
        serialNumber === originalSerialNumber,
      // This will only run the query when we explicitly want to check
      // and when the serial number has changed from original
    });

  // Create a debounced version of the serial check function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCheckSerialNumber = useCallback(
    debounce((serial: string) => {
      if (serial.trim() && serial !== originalSerialNumber) {
        setIsCheckingSerial(true);
      }
    }, 500), // 500ms debounce to avoid excessive API calls
    [originalSerialNumber]
  );

  // Filter etats to exclude "Expiré" with case-insensitive matching
  const filteredEtats =
    etats?.filter((etat) => !etat.name.toLowerCase().includes("expir")) || [];

  const filteredStatus = statuses;

  // Initialize form with actif data
  useEffect(() => {
    if (actif) {
      setSerialNumber(actif.serialNumber || "");
      setOriginalSerialNumber(actif.serialNumber || "");
      setActifTypeId(actif.actifTypeId || "");
      setActifType(actif.actifType || "");
      setStatusId(actif.statusId || "");
      setEtatId(actif.etatId || "");
      setQuantity(actif.quantity || 1);

      // *** IMPROVED SUPPLIER INITIALIZATION ***
      // Try to get fournisseurId from different possible sources
      let supplierID = "";

      if (actif.fournisseurId) {
        // Direct ID is available
        supplierID = actif.fournisseurId;
      } else if (actif.fournisseurObj?.fournisseurId) {
        // ID from fournisseurObj
        supplierID = actif.fournisseurObj.fournisseurId;
      } else if (actif.fournisseurs && actif.fournisseurs.length > 0) {
        // ID from first item in fournisseurs array (single supplier case)
        supplierID = actif.fournisseurs[0].fournisseurId;
      }

      setFournisseurId(supplierID);

      // Set other relational IDs
      setMarqueId(actif.marqueId || "");
      setModeleId(actif.modeleId || "");

      // Format warranty date
      if (actif.warrantyEnd) {
        const warrantyEndDate = new Date(actif.warrantyEnd);
        setWarrantyEnd(warrantyEndDate.toISOString().split("T")[0]);
      }

      // Set specifications if they exist
      if (actif.specification) {
        setShowSpecifications(true);
        setSpecIncrements({
          ram: actif.specification.ram || "",
          cpu: actif.specification.cpu || "",
          stockage: actif.specification.stockage || "",
          graphique: actif.specification.graphique || "",
        });
      } else {
        setShowSpecifications(false);
        setSpecIncrements({
          ram: "",
          cpu: "",
          stockage: "",
          graphique: "",
        });
      }

      // Reset serial check states
      setSerialTouched(false);
      setSerialExists(false);
      setIsCheckingSerial(false);
    }
  }, [actif]);

  // Check for serial number uniqueness when the serial number changes
  useEffect(() => {
    if (serialNumber.trim() && serialTouched) {
      debouncedCheckSerialNumber(serialNumber);
    } else {
      setSerialExists(false);
      setIsCheckingSerial(false);
    }
  }, [serialNumber, debouncedCheckSerialNumber, serialTouched]);

  // Update serialExists state when the query completes
  useEffect(() => {
    if (isCheckingSerial && !isSerialCheckLoading) {
      const isDuplicate =
        !!existingActif && existingActif.actifId !== actif.actifId;
      setSerialExists(isDuplicate);
      setIsCheckingSerial(false);
    }
  }, [existingActif, isSerialCheckLoading, isCheckingSerial, actif]);

  // Handle actif type selection
  const handleActifTypeChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const typeId = e.target.value as string;
    setActifTypeId(typeId);

    // Find the type name
    const selectedType = actifTypes?.find(
      (type) => type.actifTypeId === typeId
    );
    if (selectedType) {
      setActifType(selectedType.nom);
    }

    // Reset marque and modele when actifType changes
    setMarqueId("");
    setModeleId("");
  };

  // Handle serial number change with validation
  const handleSerialNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSerialNumber(value);
    setSerialTouched(true);

    // Update form errors
    setFormErrors((prev) => ({
      ...prev,
      serialNumber: !value.trim(),
    }));
  };

  // Handle marque selection
  const handleMarqueChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const newMarqueId = e.target.value as string;
    setMarqueId(newMarqueId);

    // Reset modele when marque changes
    setModeleId("");
  };

  // Handle fournisseur selection
  const handleFournisseurChange = (
    e: React.ChangeEvent<{ value: unknown }>
  ) => {
    const newFournisseurId = e.target.value as string;
    setFournisseurId(newFournisseurId);
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, boolean> = {
      serialNumber: !serialNumber || serialExists,
      actifTypeId: !actifTypeId,
      statusId: !statusId,
      etatId: !etatId,
      marqueId: !marqueId,
      modeleId: !modeleId,
      fournisseurId: !fournisseurId,
    };

    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  // Default label for warranty end
  const warrantyEndLabel = "Fin de garantie";

  // Handle update submission
  const handleUpdate = () => {
    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    formData.append("actifId", actif.actifId);
    formData.append("serialNumber", serialNumber);
    formData.append("actifTypeId", actifTypeId);
    formData.append("actifType", actifType);
    formData.append("statusId", statusId);
    formData.append("etatId", etatId);
    formData.append("quantity", quantity.toString());

    // Add relation IDs
    formData.append("marqueId", marqueId);
    formData.append("modeleId", modeleId);
    formData.append("fournisseurId", fournisseurId);

    if (warrantyEnd) {
      formData.append("warrantyEnd", warrantyEnd);
    }

    // Add specifications if enabled
    if (showSpecifications) {
      const specs: Record<string, string> = {};

      // Simply use whatever is entered in the specification fields
      if (specIncrements.ram) specs.ram = specIncrements.ram;
      if (specIncrements.cpu) specs.cpu = specIncrements.cpu;
      if (specIncrements.stockage) specs.stockage = specIncrements.stockage;
      if (specIncrements.graphique) specs.graphique = specIncrements.graphique;

      if (Object.keys(specs).length > 0) {
        formData.append("specifications", JSON.stringify(specs));
      }
    }

    onUpdate(formData);
  };

  // Get supplier name by ID
  const getSupplierName = (id: string): string => {
    const supplier = fournisseurs.find((f) => f.fournisseurId === id);
    return supplier ? supplier.name : "Non spécifié";
  };

  // Function to get current supplier name for display
  const getCurrentSupplierName = (): string => {
    if (actif.fournisseur) {
      if (typeof actif.fournisseur === "string") {
        return actif.fournisseur;
      } else if (
        typeof actif.fournisseur === "object" &&
        "name" in (actif.fournisseur as any)
      ) {
        return (actif.fournisseur as any).name;
      }
    }

    if (actif.fournisseurObj?.name) {
      return actif.fournisseurObj.name;
    }

    if (
      actif.fournisseurs &&
      actif.fournisseurs.length > 0 &&
      actif.fournisseurs[0].fournisseur?.name
    ) {
      return actif.fournisseurs[0].fournisseur.name;
    }

    return "Non spécifié";
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Modifier l'équipement</DialogTitle>
      <DialogContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Status Selection */}
          <FormControl fullWidth required error={formErrors.statusId}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusId}
              onChange={(e) => setStatusId(e.target.value as string)}
              label="Statut"
            >
              <MenuItem value="">
                <em>Sélectionner un statut</em>
              </MenuItem>
              {filteredStatus?.map((status) => (
                <MenuItem key={status.statusId} value={status.statusId}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
            {formErrors.statusId && (
              <FormHelperText>Statut requis</FormHelperText>
            )}
          </FormControl>

          {/* État Selection */}
          <FormControl fullWidth required error={formErrors.etatId}>
            <InputLabel>État</InputLabel>
            <Select
              value={etatId}
              onChange={(e) => setEtatId(e.target.value as string)}
              label="État"
            >
              <MenuItem value="">
                <em>Sélectionner un état</em>
              </MenuItem>
              {filteredEtats.map((etat) => (
                <MenuItem key={etat.etatId} value={etat.etatId}>
                  {etat.name}
                </MenuItem>
              ))}
            </Select>
            {formErrors.etatId && <FormHelperText>État requis</FormHelperText>}
            {(!etats || etats.length === 0) && (
              <FormHelperText>Aucun état disponible</FormHelperText>
            )}
          </FormControl>

          {/* Serial Number with uniqueness validation */}
          <TextField
            label="Numéro de série"
            value={serialNumber}
            onChange={handleSerialNumberChange}
            fullWidth
            required
            error={formErrors.serialNumber || (serialTouched && serialExists)}
            helperText={
              formErrors.serialNumber && !serialExists
                ? "Numéro de série requis"
                : serialExists
                ? "Ce numéro de série existe déjà"
                : ""
            }
            InputProps={{
              endAdornment: isCheckingSerial ? (
                <CircularProgress size={20} color="inherit" />
              ) : serialTouched && serialNumber.trim() && !serialExists ? (
                <span className="text-green-500">✓</span>
              ) : null,
            }}
          />

          {/* ActifType Selection */}
          <FormControl fullWidth required error={formErrors.actifTypeId}>
            <InputLabel>Type d'équipement</InputLabel>
            <Select
              value={actifTypeId}
              onChange={(e) =>
                handleActifTypeChange(
                  e as React.ChangeEvent<{ value: unknown }>
                )
              }
              label="Type d'équipement"
            >
              <MenuItem value="">
                <em>Sélectionner un type</em>
              </MenuItem>
              {(allActifTypes.length > 0
                ? allActifTypes
                : actifTypes || []
              ).map((type) => (
                <MenuItem key={type.actifTypeId} value={type.actifTypeId}>
                  {type.nom}
                </MenuItem>
              ))}
            </Select>
            {formErrors.actifTypeId && (
              <FormHelperText>Type d'équipement requis</FormHelperText>
            )}
          </FormControl>

          {/* Brand (Marque) */}
          <FormControl fullWidth required error={formErrors.marqueId}>
            <InputLabel>Marque</InputLabel>
            <Select
              value={marqueId}
              onChange={(e) =>
                handleMarqueChange(e as React.ChangeEvent<{ value: unknown }>)
              }
              label="Marque"
              disabled={!actifTypeId || isLoadingMarques}
              startAdornment={
                isLoadingMarques ? <CircularProgress size={20} /> : null
              }
            >
              <MenuItem value="">
                <em>Sélectionner une marque</em>
              </MenuItem>
              {marques.map((marque) => (
                <MenuItem key={marque.marqueId} value={marque.marqueId}>
                  {marque.name}
                </MenuItem>
              ))}
            </Select>
            {formErrors.marqueId && (
              <FormHelperText>Marque requise</FormHelperText>
            )}
            {!actifTypeId && (
              <FormHelperText>
                Veuillez d'abord sélectionner un type d'équipement
              </FormHelperText>
            )}
          </FormControl>

          {/* Model (Modele) */}
          <FormControl fullWidth required error={formErrors.modeleId}>
            <InputLabel>Modèle</InputLabel>
            <Select
              value={modeleId}
              onChange={(e) => setModeleId(e.target.value as string)}
              label="Modèle"
              disabled={!marqueId || isLoadingModeles}
              startAdornment={
                isLoadingModeles ? <CircularProgress size={20} /> : null
              }
            >
              <MenuItem value="">
                <em>Sélectionner un modèle</em>
              </MenuItem>
              {modeles.map((modele) => (
                <MenuItem key={modele.modeleId} value={modele.modeleId}>
                  {modele.name}
                </MenuItem>
              ))}
            </Select>
            {formErrors.modeleId && (
              <FormHelperText>Modèle requis</FormHelperText>
            )}
            {!marqueId && (
              <FormHelperText>
                Veuillez d'abord sélectionner une marque
              </FormHelperText>
            )}
          </FormControl>

          {/* Fournisseur (Supplier) */}
          <FormControl fullWidth required error={formErrors.fournisseurId}>
            <InputLabel>Fournisseur</InputLabel>
            <Select
              value={fournisseurId}
              onChange={(e) =>
                handleFournisseurChange(
                  e as React.ChangeEvent<{ value: unknown }>
                )
              }
              label="Fournisseur"
              disabled={isLoadingFournisseurs}
              startAdornment={
                isLoadingFournisseurs ? <CircularProgress size={20} /> : null
              }
            >
              <MenuItem value="">
                <em>Sélectionner un fournisseur</em>
              </MenuItem>
              {fournisseurs.map((fournisseur) => (
                <MenuItem
                  key={fournisseur.fournisseurId}
                  value={fournisseur.fournisseurId}
                >
                  {fournisseur.name}
                  {fournisseur.email && ` - ${fournisseur.email}`}
                </MenuItem>
              ))}
            </Select>
            {formErrors.fournisseurId && (
              <FormHelperText>Fournisseur requis</FormHelperText>
            )}
          </FormControl>

          {/* Display the supplier email and phone if a supplier is selected */}
          {fournisseurId && (
            <div className="col-span-2 mt-2 p-2 bg-gray-50 rounded-md">
              {fournisseurs.find((f) => f.fournisseurId === fournisseurId)
                ?.email && (
                <div className="text-sm flex items-center mb-1">
                  <span className="font-medium mr-2">Email:</span>
                  {
                    fournisseurs.find((f) => f.fournisseurId === fournisseurId)
                      ?.email
                  }
                </div>
              )}
              {fournisseurs.find((f) => f.fournisseurId === fournisseurId)
                ?.phone && (
                <div className="text-sm flex items-center">
                  <span className="font-medium mr-2">Téléphone:</span>
                  {
                    fournisseurs.find((f) => f.fournisseurId === fournisseurId)
                      ?.phone
                  }
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <TextField
            label="Quantité"
            type="number"
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
            fullWidth
            inputProps={{ min: 1 }}
          />

          {/* Warranty End Date */}
          <TextField
            label={warrantyEndLabel}
            type="date"
            value={warrantyEnd}
            onChange={(e) => setWarrantyEnd(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {/* Toggle Specifications */}
          <div className="col-span-2 mt-2">
            <FormControlLabel
              control={
                <Checkbox
                  checked={showSpecifications}
                  onChange={(e) => setShowSpecifications(e.target.checked)}
                />
              }
              label="Modifications de spécifications"
            />
          </div>

          {/* Specifications Section */}
          {showSpecifications && (
            <div className="col-span-2 space-y-4">
              <Typography variant="subtitle2" className="text-gray-700 mb-2">
                Améliorations de l'équipement
              </Typography>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RAM */}
                <TextField
                  label="Ajout de RAM"
                  value={specIncrements.ram}
                  onChange={(e) =>
                    setSpecIncrements((prev) => ({
                      ...prev,
                      ram: e.target.value,
                    }))
                  }
                  fullWidth
                  placeholder="Ex: +4GB DDR4"
                  helperText="RAM supplémentaire ajoutée"
                />

                {/* CPU */}
                <TextField
                  label="Nouveau processeur"
                  value={specIncrements.cpu}
                  onChange={(e) =>
                    setSpecIncrements((prev) => ({
                      ...prev,
                      cpu: e.target.value,
                    }))
                  }
                  fullWidth
                  placeholder="Ex: Intel Core i9"
                  helperText="Processeur de remplacement"
                />

                {/* Storage */}
                <TextField
                  label="Ajout de stockage"
                  value={specIncrements.stockage}
                  onChange={(e) =>
                    setSpecIncrements((prev) => ({
                      ...prev,
                      stockage: e.target.value,
                    }))
                  }
                  fullWidth
                  placeholder="Ex: +1TB SSD"
                  helperText="Stockage supplémentaire ajouté"
                />

                {/* Graphics Card */}
                <TextField
                  label="Nouvelle carte graphique"
                  value={specIncrements.graphique}
                  onChange={(e) =>
                    setSpecIncrements((prev) => ({
                      ...prev,
                      graphique: e.target.value,
                    }))
                  }
                  fullWidth
                  placeholder="Ex: NVIDIA RTX 3060"
                  helperText="Carte graphique de remplacement"
                />
              </div>
            </div>
          )}

          {/* File Upload Component - Only show when actifId is available */}
          {actif?.actifId && (
            <div className="col-span-2 mt-4 border border-gray-200 rounded-md p-4">
              <FileUploadComponent
                actifId={actif.actifId}
                attachments={attachments}
                onUpload={refetchAttachments}
              />
            </div>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Annuler
        </Button>
        <Button
          onClick={handleUpdate}
          color="primary"
          variant="contained"
          disabled={isCheckingSerial} // Disable update button while checking serial
        >
          Mettre à jour
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditActifModal;
