"use client";

import { useState, useEffect } from "react";
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
  SelectChangeEvent,
} from "@mui/material";
import { Trash2, Upload, Paperclip } from "lucide-react";
import {
  License,
  Category,
  Status,
  Etat,
  LicenseType,
  LicenseAttachment,
  useGetLicenseAttachmentsQuery,
  useUploadMultipleLicenseAttachmentsMutation,
  useDeleteLicenseAttachmentMutation,
  useGetEmployeesQuery,
  useGetAllLicenseTypesQuery,
  Employee,
} from "@/state/api";
import FileUploadSection from "../../(components)/fileUploads/FileUploadSection";

interface FileUploadComponentProps {
  licenseId: string;
  attachments: LicenseAttachment[];
  onUpload: () => void;
}

// File Upload Component
const FileUploadComponent = ({
  licenseId,
  attachments,
  onUpload,
}: FileUploadComponentProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMultipleAttachments, { isLoading: isUploading }] =
    useUploadMultipleLicenseAttachmentsMutation();
  const [deleteAttachment, { isLoading: isDeleting }] =
    useDeleteLicenseAttachmentMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setFiles(fileArray);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    try {
      await uploadMultipleAttachments({ licenseId, files }).unwrap();
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

interface EditLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (formData: FormData) => void;
  license: License;
  categories: Category[];
  statuses: Status[];
  etats: Etat[]; // Add etats property
  licenseTypes: LicenseType[];
}

interface FormErrorsState {
  softwareName: boolean;
  version: boolean;
  licenseTypeId: boolean;
  statusId: boolean;
  etatId: boolean; // Add etatId validation
  startDate: boolean;
  expiryDate: boolean;
}

const EditLicenseModal = ({
  isOpen,
  onClose,
  onUpdate,
  license,
  categories,
  statuses,
  etats, // Destructure etats from props
  licenseTypes,
}: EditLicenseModalProps) => {
  // États pour le stepper
  const [activeStep, setActiveStep] = useState<number>(0);
  const steps = [
    "Informations de base",
    "Détails de licence",
    "Fichiers",
    "Assignation",
  ];

  // États de la première étape - Informations de base
  const [softwareName, setSoftwareName] = useState<string>(
    license?.softwareName || ""
  );
  const [version, setVersion] = useState<string>(license?.version || "");
  const [licenseTypeId, setLicenseTypeId] = useState<string>(
    license?.licenseTypeId || ""
  );
  const [statusId, setStatusId] = useState<string>(license?.statusId || "");
  const [etatId, setEtatId] = useState<string>(license?.etatId || ""); // Add etatId state
  const [licenseQuantity, setLicenseQuantity] = useState<number>(
    license?.licenseQuantity || 1
  );
  const [startDate, setStartDate] = useState<string>(
    license?.startDate
      ? new Date(license.startDate).toISOString().split("T")[0]
      : ""
  );
  const [expiryDate, setExpiryDate] = useState<string>(
    license?.expiryDate
      ? new Date(license.expiryDate).toISOString().split("T")[0]
      : ""
  );

  // États pour la deuxième étape - Détails de licence
  const [licenseKey, setLicenseKey] = useState<string>(
    license?.licenseKey || ""
  );
  const [vendorName, setVendorName] = useState<string>(
    license?.vendorName || ""
  );
  const [vendorContact, setVendorContact] = useState<string>(
    license?.vendorContact || ""
  );
  const [supportContact, setSupportContact] = useState<string>(
    license?.supportContact || ""
  );

  // État pour la troisième étape - Fichiers
  const [files, setFiles] = useState<File[]>([]);

  // États pour la quatrième étape - Assignation
  const [assignToEmployee, setAssignToEmployee] = useState<boolean>(
    license?.employees?.length > 0
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    license?.employees && license.employees.length > 0
      ? license.employees[0].employeeId
      : ""
  );
  const [newEmployeeName, setNewEmployeeName] = useState<string>("");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState<string>("");
  const [assignQuantity, setAssignQuantity] = useState<number>(
    license?.employees && license.employees.length > 0
      ? license.employees[0].quantity
      : 1
  );

  // Form errors state
  const [formErrors, setFormErrors] = useState<FormErrorsState>({
    softwareName: false,
    version: false,
    licenseTypeId: false,
    statusId: false,
    etatId: false, // Add etatId validation
    startDate: false,
    expiryDate: false,
  });

  // Get attachments using the API hook
  const { data: attachments = [], refetch: refetchAttachments } =
    useGetLicenseAttachmentsQuery(license?.licenseId || "", {
      skip: !license?.licenseId,
    });

  // Query for employees
  const { data: employees, isLoading: isLoadingEmployees } =
    useGetEmployeesQuery();

  // Query for all license types if the provided list is empty
  const { data: fetchedLicenseTypes, isLoading: isLoadingLicenseTypes } =
    useGetAllLicenseTypesQuery(undefined, {
      skip: licenseTypes && licenseTypes.length > 0,
    });

  // Use provided licenseTypes or fetched ones
  const availableLicenseTypes =
    licenseTypes && licenseTypes.length > 0
      ? licenseTypes
      : fetchedLicenseTypes || [];

  // Debug license types
  useEffect(() => {
    console.log("License Types:", licenseTypes);
    console.log("Fetched License Types:", fetchedLicenseTypes);
    console.log("Available License Types:", availableLicenseTypes);
  }, [licenseTypes, fetchedLicenseTypes, availableLicenseTypes]);

  // Debug etats
  useEffect(() => {
    console.log("Etats:", etats);
  }, [etats]);

  // Filter etats to show only "Expiré" and "Opérationnel" with case-insensitive matching
  // If filtered results are empty, show all etats as fallback
  const filteredEtats =
    etats?.filter(
      (etat) =>
        etat.name.toLowerCase() === "expiré" ||
        etat.name.toLowerCase() === "opérationnel" ||
        etat.name.toLowerCase() === "expire" ||
        etat.name.toLowerCase() === "operationnel"
    ) || [];

  // Initialize form with license data
  useEffect(() => {
    if (license) {
      setSoftwareName(license.softwareName || "");
      setVersion(license.version || "");
      setLicenseTypeId(license.licenseTypeId || "");
      setStatusId(license.statusId || "");
      setEtatId(license.etatId || ""); // Set etatId
      setLicenseQuantity(license.licenseQuantity || 1);

      // Format dates
      if (license.startDate) {
        const startDateObj = new Date(license.startDate);
        setStartDate(startDateObj.toISOString().split("T")[0]);
      }

      if (license.expiryDate) {
        const expiryDateObj = new Date(license.expiryDate);
        setExpiryDate(expiryDateObj.toISOString().split("T")[0]);
      }

      setLicenseKey(license.licenseKey || "");
      setVendorName(license.vendorName || "");
      setVendorContact(license.vendorContact || "");
      setSupportContact(license.supportContact || "");

      // Set employee assignment
      setAssignToEmployee(license.employees?.length > 0);
      if (license.employees && license.employees.length > 0) {
        setSelectedEmployeeId(license.employees[0].employeeId);
        setAssignQuantity(license.employees[0].quantity);
      }
    }
  }, [license]);

  // Handle file upload
  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrorsState = {
      softwareName: !softwareName,
      version: !version,
      licenseTypeId: !licenseTypeId,
      statusId: !statusId,
      etatId: !etatId, // Validate etatId
      startDate: !startDate,
      expiryDate: !expiryDate,
    };

    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  // Handle update submission
  const handleUpdate = () => {
    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    formData.append("licenseId", license.licenseId);
    formData.append("softwareName", softwareName);
    formData.append("version", version);
    formData.append("licenseTypeId", licenseTypeId);
    formData.append("statusId", statusId);
    formData.append("etatId", etatId); // Add etatId to formData
    formData.append("licenseQuantity", licenseQuantity.toString());
    formData.append("startDate", startDate);
    formData.append("expiryDate", expiryDate);


    if (licenseKey) {
      formData.append("licenseKey", licenseKey);
    }

    if (vendorName) {
      formData.append("vendorName", vendorName);
    }

    if (vendorContact) {
      formData.append("vendorContact", vendorContact);
    }

    if (supportContact) {
      formData.append("supportContact", supportContact);
    }

    // Handle employee assignment
    if (assignToEmployee && selectedEmployeeId) {
      formData.append("employeeId", selectedEmployeeId);
      formData.append("assignQuantity", assignQuantity.toString());
    }

    // Handle file uploads
    if (files && files.length > 0) {
      files.forEach((file) => {
        if (file instanceof File) {
          formData.append("files", file);
        }
      });
    }

    onUpdate(formData);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Modifier la licence</DialogTitle>
      <DialogContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Software Name */}
          <TextField
            label="Nom du logiciel"
            value={softwareName}
            onChange={(e) => setSoftwareName(e.target.value)}
            fullWidth
            required
            error={formErrors.softwareName}
            helperText={formErrors.softwareName ? "Nom du logiciel requis" : ""}
          />

          {/* Version */}
          <TextField
            label="Version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            fullWidth
            required
            error={formErrors.version}
            helperText={formErrors.version ? "Version requise" : ""}
          />

          {/* License Type Selection */}
          <FormControl fullWidth required error={formErrors.licenseTypeId}>
            <InputLabel>Type de licence</InputLabel>
            <Select
              value={licenseTypeId}
              onChange={(e) => setLicenseTypeId(e.target.value as string)}
              label="Type de licence"
              startAdornment={
                isLoadingLicenseTypes ? <CircularProgress size={20} /> : null
              }
            >
              <MenuItem value="">
                <em>Sélectionner un type</em>
              </MenuItem>
              {availableLicenseTypes?.map((type) => (
                <MenuItem key={type.licenseTypeId} value={type.licenseTypeId}>
                  {type.nom}
                </MenuItem>
              ))}
            </Select>
            {formErrors.licenseTypeId && (
              <FormHelperText>Type de licence requis</FormHelperText>
            )}
            {availableLicenseTypes?.length === 0 && !isLoadingLicenseTypes && (
              <FormHelperText>Aucun type de licence disponible</FormHelperText>
            )}
          </FormControl>

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
              {statuses?.map((status) => (
                <MenuItem key={status.statusId} value={status.statusId}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
            {formErrors.statusId && (
              <FormHelperText>Statut requis</FormHelperText>
            )}
          </FormControl>

          {/* État Selection - Show "Expiré" and "Opérationnel" with fallback to all états */}
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
              {/* If filtered etats is empty, show all etats */}
              {(filteredEtats.length > 0 ? filteredEtats : etats)?.map(
                (etat) => (
                  <MenuItem key={etat.etatId} value={etat.etatId}>
                    {etat.name}
                  </MenuItem>
                )
              )}
            </Select>
            {formErrors.etatId && <FormHelperText>État requis</FormHelperText>}
            {(!etats || etats.length === 0) && (
              <FormHelperText>Aucun état disponible</FormHelperText>
            )}
          </FormControl>

          {/* License Quantity */}
          <TextField
            label="Nombre de licences"
            type="number"
            value={licenseQuantity}
            onChange={(e) =>
              setLicenseQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
            fullWidth
            inputProps={{ min: 1 }}
          />

          {/* Start Date */}
          <TextField
            label="Date de début"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            required
            error={formErrors.startDate}
            helperText={formErrors.startDate ? "Date de début requise" : ""}
            InputLabelProps={{ shrink: true }}
          />

          {/* Expiry Date */}
          <TextField
            label="Date d'expiration"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            fullWidth
            required
            error={formErrors.expiryDate}
            helperText={
              formErrors.expiryDate ? "Date d'expiration requise" : ""
            }
            InputLabelProps={{ shrink: true }}
          />



          {/* License Key */}
          <TextField
            label="Clé de licence"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            fullWidth
            className="col-span-2"
          />

          {/* Vendor Name */}
          <TextField
            label="Fournisseur"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            fullWidth
          />

          {/* Vendor Contact */}
          <TextField
            label="Contact fournisseur"
            value={vendorContact}
            onChange={(e) => setVendorContact(e.target.value)}
            fullWidth
          />

          {/* Support Contact */}
          <TextField
            label="Contact support"
            value={supportContact}
            onChange={(e) => setSupportContact(e.target.value)}
            fullWidth
            className="col-span-2"
          />

          {/* Employee Assignment */}
          <div className="col-span-2 mt-4">
            <FormControlLabel
              control={
                <Checkbox
                  checked={assignToEmployee}
                  onChange={(e) => setAssignToEmployee(e.target.checked)}
                />
              }
              label="Assigner cette licence à un employé"
            />

            {assignToEmployee && (
              <div className="ml-6 mt-2">
                <FormControl fullWidth>
                  <InputLabel>Employé</InputLabel>
                  <Select
                    value={selectedEmployeeId}
                    onChange={(e) =>
                      setSelectedEmployeeId(e.target.value as string)
                    }
                    label="Employé"
                    startAdornment={
                      isLoadingEmployees ? <CircularProgress size={20} /> : null
                    }
                  >
                    <MenuItem value="">
                      <em>Sélectionner un employé</em>
                    </MenuItem>
                    {employees?.map((employee) => (
                      <MenuItem
                        key={employee.employeeId}
                        value={employee.employeeId}
                      >
                        {employee.nom} ({employee.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {licenseQuantity > 1 && (
                  <TextField
                    label="Quantité à assigner"
                    type="number"
                    value={assignQuantity}
                    onChange={(e) =>
                      setAssignQuantity(
                        Math.max(
                          1,
                          Math.min(
                            licenseQuantity,
                            parseInt(e.target.value) || 1
                          )
                        )
                      )
                    }
                    fullWidth
                    inputProps={{ min: 1, max: licenseQuantity }}
                    helperText={`Maximum: ${licenseQuantity}`}
                    margin="normal"
                  />
                )}
              </div>
            )}
          </div>

          {/* File Upload Component - Only show when licenseId is available */}
          {license?.licenseId && (
            <div className="col-span-2 mt-4 border border-gray-200 rounded-md p-4">
              <FileUploadComponent
                licenseId={license.licenseId}
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
        <Button onClick={handleUpdate} color="primary" variant="contained">
          Mettre à jour
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditLicenseModal;
