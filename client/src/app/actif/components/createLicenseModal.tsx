"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  DialogActions,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  SelectChangeEvent,
} from "@mui/material";
import {
  useGetEmployeesQuery,
  useGetLicenseTypesQuery,
  useGetCategoriesQuery,
  useGetFournisseursQuery,
  Employee,
  Status,
  LicenseType,
  Category,
  Etat,
  Fournisseur,
} from "@/state/api";
import FileUploadSection from "../../(components)/fileUploads/FileUploadSection";

interface CreateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (formData: FormData) => void;
  categories: Category[];
  statuses: Status[];
  etats: Etat[];
  licenseTypes: LicenseType[] | undefined;
  preSelectedCategoryId?: string;
  skipCategorySelection?: boolean;
}

interface FormErrorsState {
  softwareName: boolean;
  version: boolean;
  licenseType: boolean;
  licenseTypeId: boolean;
  categoryId: boolean;
  statusId: boolean;
  etatId: boolean;
  expiryDate: boolean;
  startDate: boolean;
  fournisseurId: boolean;
}

const CreateLicenseModal: React.FC<CreateLicenseModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  categories,
  statuses,
  etats,
  licenseTypes,
  preSelectedCategoryId = "",
  skipCategorySelection = false,
}) => {
  // États pour le stepper
  const [activeStep, setActiveStep] = useState<number>(0);
  const steps = [
    "Informations de base",
    "Détails de licence",
    "Fichiers",
    "Assignation",
  ];

  // États de la première étape - Informations de base
  const [softwareName, setSoftwareName] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [licenseType, setLicenseType] = useState<string>("");
  const [licenseTypeId, setLicenseTypeId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>(preSelectedCategoryId);
  const [statusId, setStatusId] = useState<string>("");
  const [etatId, setEtatId] = useState<string>("");
  const [licenseQuantity, setLicenseQuantity] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");

  // États pour la deuxième étape - Détails de licence
  const [licenseKey, setLicenseKey] = useState<string>("");
  const [fournisseurId, setFournisseurId] = useState<string>("");
  const [supportContact, setSupportContact] = useState<string>("");

  // État pour la troisième étape - Fichiers
  const [files, setFiles] = useState<File[]>([]);

  // États pour la quatrième étape - Assignation
  const [assignToEmployee, setAssignToEmployee] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [newEmployeeName, setNewEmployeeName] = useState<string>("");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState<string>("");
  const [assignQuantity, setAssignQuantity] = useState<number>(1);
  const [autoReserveStatus, setAutoReserveStatus] = useState<boolean>(true);

  // States for tracking required field validation
  const [formErrors, setFormErrors] = useState<FormErrorsState>({
    softwareName: false,
    version: false,
    licenseType: false,
    licenseTypeId: false,
    categoryId: false,
    statusId: false,
    etatId: false,
    expiryDate: false,
    startDate: false,
    fournisseurId: false,
  });

  // Query pour les employés
  const { data: employees, isLoading: isLoadingEmployees } =
    useGetEmployeesQuery();

  // Query for suppliers
  const { data: fournisseurs = [], isLoading: isLoadingFournisseurs } =
    useGetFournisseursQuery();

  // Fetch licenseTypes based on selected category
  const { data: categoryLicenseTypes, isLoading: isLoadingLicenseTypes } =
    useGetLicenseTypesQuery(
      { categoryId },
      {
        skip:
          !categoryId ||
          !categories.some(
            (c) => c.categoryId === categoryId && c.nom === "Software"
          ) ||
          (licenseTypes && licenseTypes.length > 0),
      }
    );

  // Use provided licenseTypes or fetched ones
  const availableLicenseTypes =
    licenseTypes && licenseTypes.length > 0
      ? licenseTypes
      : categoryLicenseTypes;

  // Variables for category-based logic
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const isSoftwareCategory = selectedCategory?.nom === "Software";

  // When modal opens or preSelectedCategoryId changes
  useEffect(() => {
    if (isOpen) {
      // Reset other fields
      setSoftwareName("");
      setVersion("");
      setLicenseType("");
      setLicenseTypeId("");
      setStatusId("");
      setEtatId("");
      setLicenseQuantity(1);
      setStartDate("");
      setExpiryDate("");
      setLicenseKey("");
      setFournisseurId("");
      setSupportContact("");
      setFiles([]);
      setAssignToEmployee(false);
      setSelectedEmployeeId("");
      setNewEmployeeName("");
      setNewEmployeeEmail("");
      setAssignQuantity(1);
      setAutoReserveStatus(true);
      setActiveStep(0);

      // Only set categoryId if it's provided and we're skipping selection
      if (skipCategorySelection && preSelectedCategoryId) {
        setCategoryId(preSelectedCategoryId);
      } else if (!skipCategorySelection) {
        setCategoryId("");
      }

      // Reset form errors
      setFormErrors({
        softwareName: false,
        version: false,
        licenseType: false,
        licenseTypeId: false,
        categoryId: false,
        statusId: false,
        etatId: false,
        expiryDate: false,
        startDate: false,
        fournisseurId: false,
      });
    }
  }, [isOpen, preSelectedCategoryId, skipCategorySelection]);

  // Update selected category when categoryId changes
  useEffect(() => {
    if (categoryId && categories) {
      const category = categories.find((c) => c.categoryId === categoryId);
      setSelectedCategory(category || null);

      // Reset licenseType if category changes
      setLicenseType("");
      setLicenseTypeId("");
    } else {
      setSelectedCategory(null);
    }
  }, [categoryId, categories]);

  // Category selection handler - resets dependent fields
  const handleCategoryChange = (e: SelectChangeEvent) => {
    const newCategoryId = e.target.value as string;
    setCategoryId(newCategoryId);

    // Reset dependent fields
    setLicenseTypeId("");
    setLicenseType("");
  };

  // LicenseType selection handler
  const handleLicenseTypeChange = (e: SelectChangeEvent) => {
    const newLicenseTypeId = e.target.value as string;
    setLicenseTypeId(newLicenseTypeId);

    // Find the selected licenseType object to get its name
    const selectedType = availableLicenseTypes?.find(
      (lt) => lt.licenseTypeId === newLicenseTypeId
    );

    if (selectedType) {
      setLicenseType(selectedType.nom);
    }
  };

  // Etat selection handler
  const handleEtatChange = (e: SelectChangeEvent) => {
    setEtatId(e.target.value as string);
  };

  // Supplier selection handler
  const handleFournisseurChange = (e: SelectChangeEvent) => {
    setFournisseurId(e.target.value as string);
  };

  // Handle file upload
  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  // Validate form fields
  const validateStep1 = (): boolean => {
    const errors = {
      softwareName: !softwareName,
      version: !version,
      licenseType: !licenseType,
      licenseTypeId: !licenseTypeId,
      categoryId: !skipCategorySelection && !categoryId,
      statusId: !statusId,
      etatId: !etatId,
      startDate: !startDate,
      expiryDate: !expiryDate,
      fournisseurId: false, // Not required in step 1
    };

    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  // Validate step 2 fields
  const validateStep2 = (): boolean => {
    const errors = {
      ...formErrors,
      fournisseurId: !fournisseurId, // Require supplier in step 2
    };

    setFormErrors(errors);
    return !formErrors.fournisseurId;
  };

  // Function to go to next step
  const handleNext = (): void => {
    if (activeStep === 0 && !validateStep1()) {
      return;
    }
    if (activeStep === 1 && !validateStep2()) {
      return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Function to go to previous step
  const handleBack = (): void => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Reset form
  const resetForm = (): void => {
    // Reset basic info
    setSoftwareName("");
    setVersion("");
    setLicenseType("");
    setLicenseTypeId("");
    if (!skipCategorySelection) {
      setCategoryId("");
    } else {
      setCategoryId(preSelectedCategoryId);
    }
    setStatusId("");
    setEtatId("");
    setLicenseQuantity(1);
    setStartDate("");
    setExpiryDate("");

    // Reset license details
    setLicenseKey("");
    setFournisseurId("");
    setSupportContact("");

    // Reset files
    setFiles([]);

    // Reset assignment
    setAssignToEmployee(false);
    setSelectedEmployeeId("");
    setNewEmployeeName("");
    setNewEmployeeEmail("");
    setAssignQuantity(1);
    setAutoReserveStatus(true);

    // Reset step
    setActiveStep(0);

    // Reset errors
    setFormErrors({
      softwareName: false,
      version: false,
      licenseType: false,
      licenseTypeId: false,
      categoryId: false,
      statusId: false,
      etatId: false,
      expiryDate: false,
      startDate: false,
      fournisseurId: false,
    });
  };

  // Handle modal close
  const handleCloseModal = (): void => {
    resetForm();
    onClose();
  };

  // Final form submission
  const handleCreate = async (): Promise<void> => {
    // Create FormData and append all necessary fields
    const formData = new FormData();

    // Required fields
    formData.append("softwareName", softwareName);
    formData.append("version", version);
    formData.append("licenseType", licenseType);
    formData.append("licenseTypeId", licenseTypeId);
    formData.append("categoryId", categoryId);
    formData.append("etatId", etatId);

    // Handle status based on assignment
    if (assignToEmployee && autoReserveStatus) {
      // Find "Réservé" status ID
      const reservedStatus = statuses?.find(
        (status) => status.name === "Réservé"
      );
      if (reservedStatus) {
        formData.append("statusId", reservedStatus.statusId);
      } else {
        formData.append("statusId", statusId);
      }
    } else {
      formData.append("statusId", statusId);
    }

    formData.append("licenseQuantity", licenseQuantity.toString());
    formData.append("startDate", startDate);
    formData.append("expiryDate", expiryDate);

    // Add license details
    if (licenseKey) formData.append("licenseKey", licenseKey);

    // Add supplier information
    if (fournisseurId) {
      const selectedFournisseur = fournisseurs.find(
        (f) => f.fournisseurId === fournisseurId
      );
      if (selectedFournisseur) {
        formData.append("vendorName", selectedFournisseur.name);
      }
    }

    if (supportContact) formData.append("supportContact", supportContact);

    // Handle employee assignment
    if (assignToEmployee) {
      if (selectedEmployeeId) {
        // Existing employee
        formData.append("employeeId", selectedEmployeeId);
        formData.append("assignQuantity", assignQuantity.toString());
      } else if (newEmployeeName && newEmployeeEmail) {
        // New employee
        formData.append("createNewEmployee", "true");
        formData.append("newEmployeeName", newEmployeeName);
        formData.append("newEmployeeEmail", newEmployeeEmail);
        formData.append("assignQuantity", assignQuantity.toString());
      }
    }

    // IMPORTANT: Append files with proper field name
    if (files && files.length > 0) {
      files.forEach((file) => {
        if (file instanceof File) {
          formData.append("files", file);
        }
      });
    }

    console.log("Files to upload:", files.length);

    try {
      // Submit the form
      const response = await onCreate(formData);
      console.log("Success:", response);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating license:", error);
    }
  };

  const filteredStatus =
    statuses?.filter(
      (status) =>
        !status.name.toLowerCase().includes("assign") &&
        !status.name.toLowerCase().includes("réserv")
    ) || [];

  const filteredEtats =
    etats?.filter(
      (etat) =>
        !etat.name.toLowerCase().includes("en panne") &&
        !etat.name.toLowerCase().includes("en maintenance")
    ) || [];

  return (
    <Dialog open={isOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
      <DialogTitle>
        {activeStep === 0
          ? "Ajouter une nouvelle licence - Informations de base"
          : activeStep === 1
          ? "Détails de licence"
          : activeStep === 2
          ? "Fichiers attachés"
          : "Assignation"}
      </DialogTitle>

      <DialogContent>
        {/* Stepper to show progression */}
        <Stepper activeStep={activeStep} className="mb-6 mt-4">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Basic information */}
        {activeStep === 0 && (
          <div className="grid grid-cols-2 gap-4">
            {/* Category Selection - Only show if not skipping */}
            {!skipCategorySelection && (
              <FormControl
                fullWidth
                required
                error={formErrors.categoryId}
                className="col-span-2"
              >
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={categoryId}
                  onChange={handleCategoryChange}
                  label="Catégorie"
                >
                  <MenuItem value="">
                    <em>Sélectionner une catégorie</em>
                  </MenuItem>
                  {categories
                    .filter((category) => category.nom === "Software")
                    .map((category) => (
                      <MenuItem
                        key={category.categoryId}
                        value={category.categoryId}
                      >
                        {category.nom}
                      </MenuItem>
                    ))}
                </Select>
                {formErrors.categoryId && (
                  <FormHelperText>Catégorie requise</FormHelperText>
                )}
              </FormControl>
            )}

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

            {/* Etat Selection */}
            <FormControl fullWidth required error={formErrors.etatId}>
              <InputLabel>État</InputLabel>
              <Select value={etatId} onChange={handleEtatChange} label="État">
                <MenuItem value="">
                  <em>Sélectionner un état</em>
                </MenuItem>
                {filteredEtats?.map((etat) => (
                  <MenuItem key={etat.etatId} value={etat.etatId}>
                    {etat.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.etatId && (
                <FormHelperText>État requis</FormHelperText>
              )}
            </FormControl>

            {/* Software Name */}
            <TextField
              label="Nom du logiciel"
              value={softwareName}
              onChange={(e) => setSoftwareName(e.target.value)}
              required
              error={formErrors.softwareName}
              helperText={
                formErrors.softwareName ? "Nom du logiciel requis" : ""
              }
              fullWidth
            />

            {/* Version */}
            <TextField
              label="Version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              required
              error={formErrors.version}
              helperText={formErrors.version ? "Version requise" : ""}
              fullWidth
            />

            {/* LicenseType Selection with loading indicator */}
            <FormControl fullWidth required error={formErrors.licenseTypeId}>
              <InputLabel>Type de licence</InputLabel>
              <Select
                value={licenseTypeId}
                onChange={handleLicenseTypeChange}
                label="Type de licence"
                disabled={
                  !categoryId ||
                  (!availableLicenseTypes && isLoadingLicenseTypes)
                }
                startAdornment={
                  !availableLicenseTypes && isLoadingLicenseTypes ? (
                    <CircularProgress size={20} />
                  ) : null
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
              {!categoryId && !skipCategorySelection && (
                <FormHelperText>
                  Veuillez d&apos;abord sélectionner une catégorie
                </FormHelperText>
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
              required
              error={formErrors.startDate}
              helperText={formErrors.startDate ? "Date de début requise" : ""}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            {/* Expiry Date */}
            <TextField
              label="Date d'expiration"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              error={formErrors.expiryDate}
              helperText={
                formErrors.expiryDate ? "Date d'expiration requise" : ""
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </div>
        )}

        {/* Step 2: License details */}
        {activeStep === 1 && (
          <div className="grid grid-cols-2 gap-4">
            {/* License Key */}
            <TextField
              label="Clé de licence"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              fullWidth
              className="col-span-2"
            />

            {/* Supplier Selection */}
            <FormControl
              fullWidth
              required
              error={formErrors.fournisseurId}
              className="col-span-2"
            >
              <InputLabel>Fournisseur</InputLabel>
              <Select
                value={fournisseurId}
                onChange={handleFournisseurChange}
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

            {/* Display supplier email and phone if selected */}
            {fournisseurId && (
              <div className="col-span-2 mt-2 p-2 bg-gray-50 rounded-md">
                {fournisseurs.find((f) => f.fournisseurId === fournisseurId)
                  ?.email && (
                  <div className="text-sm flex items-center mb-1">
                    <span className="font-medium mr-2">Email:</span>
                    {
                      fournisseurs.find(
                        (f) => f.fournisseurId === fournisseurId
                      )?.email
                    }
                  </div>
                )}
                {fournisseurs.find((f) => f.fournisseurId === fournisseurId)
                  ?.phone && (
                  <div className="text-sm flex items-center">
                    <span className="font-medium mr-2">Téléphone:</span>
                    {
                      fournisseurs.find(
                        (f) => f.fournisseurId === fournisseurId
                      )?.phone
                    }
                  </div>
                )}
              </div>
            )}

            {/* Support Contact 
            <TextField
              label="Contact support"
              value={supportContact}
              onChange={(e) => setSupportContact(e.target.value)}
              fullWidth
              className="col-span-2"
            />*/}
          </div>
        )}

        {/* Step 3: File attachments */}
        {activeStep === 2 && (
          <div className="mt-4">
            <FileUploadSection
              files={files}
              onChange={handleFileChange}
              maxFiles={5}
              acceptedFileTypes="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
          </div>
        )}

        {/* Step 4: Employee assignment */}
        {activeStep === 3 && (
          <div className="mt-4">
            <div className="mb-4">
              <div className="flex items-center mb-4">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={assignToEmployee}
                      onChange={(e) => setAssignToEmployee(e.target.checked)}
                    />
                  }
                  label="Assigner cette licence à un employé"
                />
              </div>
            </div>

            {assignToEmployee && (
              <div className="ml-6">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoReserveStatus}
                      onChange={(e) => setAutoReserveStatus(e.target.checked)}
                    />
                  }
                  label="Changer automatiquement le statut à 'Réservé'"
                />

                <div className="mb-4 mt-4">
                  <div className="flex mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 mr-2">
                      Choisir un employé existant
                    </label>
                    {isLoadingEmployees && <CircularProgress size={16} />}
                  </div>
                  <FormControl fullWidth>
                    <Select
                      value={selectedEmployeeId}
                      onChange={(e) => {
                        setSelectedEmployeeId(e.target.value as string);
                        if (e.target.value) {
                          setNewEmployeeName("");
                          setNewEmployeeEmail("");
                        }
                      }}
                      displayEmpty
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
                </div>

                <div className="mt-6 mb-2">
                  <div className="block text-sm font-medium text-gray-700 mb-2">
                    Ou créer un nouvel employé
                  </div>

                  <TextField
                    label="Nom de l'employé"
                    value={newEmployeeName}
                    onChange={(e) => {
                      setNewEmployeeName(e.target.value);
                      if (e.target.value) setSelectedEmployeeId("");
                    }}
                    fullWidth
                    margin="normal"
                    disabled={!!selectedEmployeeId}
                  />

                  <TextField
                    label="Email de l'employé"
                    type="email"
                    value={newEmployeeEmail}
                    onChange={(e) => {
                      setNewEmployeeEmail(e.target.value);
                      if (e.target.value) setSelectedEmployeeId("");
                    }}
                    fullWidth
                    margin="normal"
                    disabled={!!selectedEmployeeId}
                  />
                </div>

                {/* Quantity to assign */}
                {licenseQuantity > 1 && (
                  <div className="mt-4">
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
                    />
                  </div>
                )}
              </div>
            )}

            {/* License summary */}
            <div className="mt-6 p-4 border border-gray-300 rounded bg-gray-50">
              <h3 className="font-medium mb-2">Résumé</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>Logiciel:</strong> {softwareName}
                </div>
                <div>
                  <strong>Version:</strong> {version}
                </div>
                <div>
                  <strong>Type de licence:</strong> {licenseType}
                </div>
                <div>
                  <strong>Quantité:</strong> {licenseQuantity}
                </div>
                <div>
                  <strong>Début:</strong>{" "}
                  {startDate ? new Date(startDate).toLocaleDateString() : ""}
                </div>
                <div>
                  <strong>Expiration:</strong>{" "}
                  {expiryDate ? new Date(expiryDate).toLocaleDateString() : ""}
                </div>
                <div>
                  <strong>Statut:</strong>{" "}
                  {assignToEmployee && autoReserveStatus
                    ? "Réservé (automatique)"
                    : statuses?.find((status) => status.statusId === statusId)
                        ?.name || ""}
                </div>
                <div>
                  <strong>État:</strong>{" "}
                  {etats?.find((etat) => etat.etatId === etatId)?.name || ""}
                </div>

                {licenseKey && (
                  <div className="col-span-2">
                    <strong>Clé de licence:</strong> {licenseKey}
                  </div>
                )}

                {fournisseurId && (
                  <div>
                    <strong>Fournisseur:</strong>{" "}
                    {fournisseurs.find((f) => f.fournisseurId === fournisseurId)
                      ?.name || ""}
                  </div>
                )}

                {files.length > 0 && (
                  <div className="col-span-2 mt-2">
                    <strong>Fichiers:</strong> {files.length} fichier(s)
                    joint(s)
                  </div>
                )}

                {assignToEmployee && (
                  <div className="col-span-2 mt-2">
                    <strong>Assigné à:</strong>{" "}
                    {selectedEmployeeId
                      ? employees?.find(
                          (e) => e.employeeId === selectedEmployeeId
                        )?.nom || "Employé sélectionné"
                      : newEmployeeName
                      ? `${newEmployeeName} (nouvel employé)`
                      : "Non assigné"}
                    {licenseQuantity > 1 && assignQuantity > 0 && (
                      <span>
                        {" "}
                        ({assignQuantity} licence{assignQuantity > 1 ? "s" : ""}
                        )
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      <DialogActions>
        {activeStep === 0 ? (
          <>
            <Button onClick={handleCloseModal}>Annuler</Button>
            <Button onClick={handleNext} color="primary" variant="contained">
              Suivant
            </Button>
          </>
        ) : activeStep === steps.length - 1 ? (
          <>
            <Button onClick={handleBack}>Retour</Button>
            <Button onClick={handleCloseModal}>Annuler</Button>
            <Button
              onClick={handleCreate}
              color="primary"
              variant="contained"
              disabled={
                assignToEmployee &&
                !selectedEmployeeId &&
                (!newEmployeeName || !newEmployeeEmail)
              }
            >
              Créer
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleBack}>Retour</Button>
            <Button onClick={handleCloseModal}>Annuler</Button>
            <Button onClick={handleNext} color="primary" variant="contained">
              Suivant
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateLicenseModal;
