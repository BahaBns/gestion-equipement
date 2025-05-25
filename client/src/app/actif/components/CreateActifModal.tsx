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
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Typography,
  Divider,
  Box,
  Switch,
} from "@mui/material";
import {
  useGetEmployeesQuery,
  useGetActifTypesQuery,
  useGetMarquesByActifTypeQuery,
  useGetModelesByMarqueQuery,
  useGetFournisseursQuery,
  useGetActifBySerialNumberQuery, // Import the query hook for serial number check
  Employee,
  Status,
  ActifType,
  Etat,
  Marque,
  Modele,
  Fournisseur,
} from "@/state/api";
import FileUploadSection from "../../(components)/fileUploads/FileUploadSection";
import MultiSupplierSelection from "./MultiSupplierSelection";

// Define the structure for the category object
interface Category {
  categoryId: string;
  nom: string;
  [key: string]: any; // For any additional properties
}

// Define the SupplierAllocation type
interface SupplierAllocation {
  id: string;
  fournisseurId: string;
  quantity: number;
}

// Define the props interface for the component
interface CreateActifModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (formData: FormData) => Promise<any>;
  categories: Category[];
  statuses: Status[];
  etats: Etat[];
  actifTypes?: ActifType[];
  preSelectedCategoryId?: string;
  skipCategorySelection?: boolean;
  skipNomField?: boolean;
}

// Define interface for form errors
interface FormErrors {
  serialNumber: boolean;
  actifType: boolean;
  actifTypeId: boolean;
  marqueId: boolean;
  modeleId: boolean;
  categoryId: boolean;
  statusId: boolean;
  etatId: boolean;
  fournisseurId: boolean;
  supplierAllocations: boolean;
  warrantyEnd: boolean; // Added warrantyEnd to the form errors interface
}

const CreateActifModal: React.FC<CreateActifModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  categories,
  statuses,
  etats,
  actifTypes,
  preSelectedCategoryId = "",
  skipCategorySelection = false,
  skipNomField = false,
}) => {
  // États pour le stepper
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Informations de base", "Fichiers", "Finalisation"];

  // États de la première étape - Informations de base
  const [serialNumber, setSerialNumber] = useState("");
  // New state variables for serial number validation
  const [isCheckingSerial, setIsCheckingSerial] = useState(false);
  const [serialExists, setSerialExists] = useState(false);
  const [serialTouched, setSerialTouched] = useState(false);

  const [actifType, setActifType] = useState("");
  const [actifTypeId, setActifTypeId] = useState("");
  const [categoryId, setCategoryId] = useState(preSelectedCategoryId);
  const [statusId, setStatusId] = useState("");
  const [etatId, setEtatId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [warrantyEnd, setWarrantyEnd] = useState("");
  const [warrantyTouched, setWarrantyTouched] = useState(false); // Track if warranty field was touched

  // Multi-supplier support
  const [useMultipleSuppliers, setUseMultipleSuppliers] = useState(false);
  const [supplierAllocations, setSupplierAllocations] = useState<
    SupplierAllocation[]
  >([]);
  const [supplierAllocationsValid, setSupplierAllocationsValid] =
    useState(false);

  // Relational data fields - single supplier mode
  const [marqueId, setMarqueId] = useState("");
  const [modeleId, setModeleId] = useState("");
  const [fournisseurId, setFournisseurId] = useState("");

  // État pour la deuxième étape - Fichiers
  const [files, setFiles] = useState<File[]>([]);

  // États pour la troisième étape - Assignation
  const [assignToEmployee, setAssignToEmployee] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [assignQuantity, setAssignQuantity] = useState(1);
  const [autoReserveStatus, setAutoReserveStatus] = useState(true);
  const [autoUpdateEtat, setAutoUpdateEtat] = useState(true);

  // States for tracking required field validation
  const [formErrors, setFormErrors] = useState<FormErrors>({
    serialNumber: false,
    actifType: false,
    actifTypeId: false,
    marqueId: false,
    modeleId: false,
    categoryId: false,
    statusId: false,
    etatId: false,
    fournisseurId: false,
    supplierAllocations: false,
    warrantyEnd: false, // Initialize warranty validation error as false
  });

  // Query pour les employés
  const { data: employees, isLoading: isLoadingEmployees } =
    useGetEmployeesQuery();

  // Set up the query hook for checking serial number uniqueness
  const { data: existingActif, isLoading: isSerialCheckLoading } =
    useGetActifBySerialNumberQuery(serialNumber, {
      skip: !serialNumber || !isCheckingSerial,
      // This will only run the query when we explicitly want to check
    });

  // Create a debounced version of the serial check function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCheckSerialNumber = useCallback(
    debounce((serial: string) => {
      if (serial.trim()) {
        setIsCheckingSerial(true);
      }
    }, 500), // 500ms debounce to avoid excessive API calls
    []
  );

  // Fetch actifTypes based on selected category if not provided
  const { data: categoryActifTypes, isLoading: isLoadingActifTypes } =
    useGetActifTypesQuery(categoryId, {
      skip: !categoryId || (actifTypes && actifTypes.length > 0),
    });

  // Use provided actifTypes or fetched ones
  const availableActifTypes = actifTypes || categoryActifTypes;

  // Fetch brands, models, and suppliers
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

  // Variables for category-based logic
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const isSoftwareCategory = selectedCategory?.nom === "Logiciels";

  // Check for serial number uniqueness when the serial number changes
  useEffect(() => {
    if (serialNumber.trim()) {
      debouncedCheckSerialNumber(serialNumber);
    } else {
      setSerialExists(false);
      setIsCheckingSerial(false);
    }
  }, [serialNumber, debouncedCheckSerialNumber]);

  // Update serialExists state when the query completes
  useEffect(() => {
    if (isCheckingSerial && !isSerialCheckLoading) {
      setSerialExists(!!existingActif);
      setIsCheckingSerial(false);
    }
  }, [existingActif, isSerialCheckLoading, isCheckingSerial]);

  // Update selected category when categoryId changes
  useEffect(() => {
    if (categoryId && categories) {
      const category = categories.find((c) => c.categoryId === categoryId);
      setSelectedCategory(category || null);

      // Reset actifType if category changes
      setActifType("");
      setActifTypeId("");

      // Reset relational fields
      setMarqueId("");
      setModeleId("");
      setFournisseurId("");
      setUseMultipleSuppliers(false);
      setSupplierAllocations([]);
    } else {
      setSelectedCategory(null);
    }
  }, [categoryId, categories]);

  // Set default etat based on status or category
  useEffect(() => {
    if (statusId && etats?.length > 0) {
      // If status is "Disponible", set etat to "En stock" by default
      const selectedStatus = statuses?.find((s) => s.statusId === statusId);
      if (selectedStatus?.name === "Disponible") {
        const stockEtat = etats.find((e) => e.name === "En stock");
        if (stockEtat) {
          setEtatId(stockEtat.etatId);
        }
      }
      // If status is "Réservé" or "Attribué", set etat to "En service" by default
      else if (
        selectedStatus?.name === "Réservé" ||
        selectedStatus?.name === "Attribué"
      ) {
        const serviceEtat = etats.find((e) => e.name === "En service");
        if (serviceEtat) {
          setEtatId(serviceEtat.etatId);
        }
      }
    }
  }, [statusId, etats, statuses]);

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

  // Handle warranty end date change with validation
  const handleWarrantyEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWarrantyEnd(value);
    setWarrantyTouched(true);

    // Update form errors
    setFormErrors((prev) => ({
      ...prev,
      warrantyEnd: !value.trim(),
    }));
  };

  // ActifType selection handler - updates actifType and resets related fields
  const handleActifTypeChange = (e: any) => {
    const newActifTypeId = e.target.value;
    setActifTypeId(newActifTypeId);

    // Find the selected actifType object to get its name
    const selectedType = availableActifTypes?.find(
      (at) => at.actifTypeId === newActifTypeId
    );

    if (selectedType) {
      setActifType(selectedType.nom);
    }

    // Reset the related fields
    setMarqueId("");
    setModeleId("");
  };

  // Handle marque selection
  const handleMarqueChange = (e: any) => {
    const newMarqueId = e.target.value;
    setMarqueId(newMarqueId);

    // Reset modele when marque changes
    setModeleId("");
  };

  // Handle fournisseur selection
  const handleFournisseurChange = (e: any) => {
    const newFournisseurId = e.target.value;
    setFournisseurId(newFournisseurId);
  };

  // Handle supplier allocations change
  const handleSupplierAllocationsChange = (
    allocations: SupplierAllocation[]
  ) => {
    setSupplierAllocations(allocations);

    // Check if allocations are valid (sum equals total quantity and all suppliers selected)
    const isValid =
      allocations.length > 0 &&
      allocations.every((a) => a.fournisseurId) &&
      allocations.reduce((sum, a) => sum + a.quantity, 0) === quantity;

    setSupplierAllocationsValid(isValid);

    // Update form errors
    setFormErrors({
      ...formErrors,
      supplierAllocations: !isValid,
    });
  };

  // Handle toggle for multi-supplier mode
  const handleToggleMultiSupplier = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const useMultiple = event.target.checked;
    setUseMultipleSuppliers(useMultiple);

    if (!useMultiple) {
      // Reset to single supplier mode
      setSupplierAllocations([]);
      setFormErrors({
        ...formErrors,
        supplierAllocations: false,
        fournisseurId: !fournisseurId,
      });
    } else {
      // Switch to multi-supplier mode
      setFormErrors({
        ...formErrors,
        fournisseurId: false,
        supplierAllocations: true,
      });
    }
  };

  // Handle file upload
  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  // Validate form fields including serial number uniqueness and warranty date
  const validateStep1 = (): boolean => {
    const errors = {
      serialNumber: !serialNumber.trim() || serialExists,
      actifType: !actifType,
      actifTypeId: !actifTypeId,
      marqueId: !marqueId,
      modeleId: !modeleId,
      categoryId: !categoryId,
      statusId: !statusId,
      etatId: !etatId,
      fournisseurId: !useMultipleSuppliers && !fournisseurId,
      supplierAllocations: useMultipleSuppliers && !supplierAllocationsValid,
      warrantyEnd: !warrantyEnd.trim(), // Validate warranty end date is not empty
    };

    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  // Fonction pour passer à l&apos;étape suivante
  const handleNext = () => {
    if (activeStep === 0 && !validateStep1()) {
      return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Fonction pour revenir à l&apos;étape précédente
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    // Reset basic info
    setSerialNumber("");
    setActifType("");
    setActifTypeId("");
    if (!skipCategorySelection) {
      setCategoryId("");
    }
    setStatusId("");
    setEtatId("");
    setQuantity(1);
    setWarrantyEnd("");

    // Reset serial number validation state
    setSerialExists(false);
    setIsCheckingSerial(false);
    setSerialTouched(false);
    setWarrantyTouched(false); // Reset warranty touched state

    // Reset supplier mode
    setUseMultipleSuppliers(false);
    setSupplierAllocations([]);
    setSupplierAllocationsValid(false);

    // Reset relation fields
    setMarqueId("");
    setModeleId("");
    setFournisseurId("");

    // Reset files
    setFiles([]);

    // Reset assignment
    setAssignToEmployee(false);
    setSelectedEmployeeId("");
    setNewEmployeeName("");
    setNewEmployeeEmail("");
    setAssignQuantity(1);
    setAutoReserveStatus(true);
    setAutoUpdateEtat(true);

    // Reset step
    setActiveStep(0);

    // Reset errors
    setFormErrors({
      serialNumber: false,
      actifType: false,
      actifTypeId: false,
      marqueId: false,
      modeleId: false,
      categoryId: false,
      statusId: false,
      etatId: false,
      fournisseurId: false,
      supplierAllocations: false,
      warrantyEnd: false, // Reset warranty error state
    });
  };

  // Gérer la fermeture du modal
  const handleCloseModal = () => {
    resetForm();
    onClose();
  };

  // Generate a name for the actif based on actifType, marque, and modele
  const generateActifName = (): string => {
    if (actifType) {
      const selectedMarque = marques.find((m) => m.marqueId === marqueId);
      const selectedModele = modeles.find((m) => m.modeleId === modeleId);

      if (selectedMarque && selectedModele) {
        return `${actifType} ${selectedMarque.name} ${selectedModele.name}`;
      }
    }
    return "";
  };

  // Soumission finale du formulaire
  const handleCreate = async () => {
    // Create FormData and append all necessary fields
    const formData = new FormData();

    // Generate name if nom field is skipped
    if (skipNomField) {
      const generatedName = generateActifName();
      formData.append("nom", generatedName);
    }

    // Required fields
    formData.append("serialNumber", serialNumber);
    formData.append("actifType", actifType);
    formData.append("actifTypeId", actifTypeId);
    formData.append("categoryId", categoryId);
    formData.append("etatId", etatId);

    // Relation IDs for single supplier
    formData.append("marqueId", marqueId);
    formData.append("modeleId", modeleId);

    // Handle supplier information based on selected mode
    if (useMultipleSuppliers) {
      // Append an array of supplier allocations
      formData.append("useMultipleSuppliers", "true");
      formData.append(
        "supplierAllocations",
        JSON.stringify(supplierAllocations)
      );
    } else {
      // Single supplier
      formData.append("fournisseurId", fournisseurId);
    }

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

    // Handle etat based on assignment
    if (assignToEmployee && autoUpdateEtat) {
      // Find "En service" etat ID
      const enServiceEtat = etats?.find((etat) => etat.name === "En service");
      if (enServiceEtat) {
        formData.append("etatId", enServiceEtat.etatId);
      } else {
        formData.append("etatId", etatId);
      }
    } else {
      formData.append("etatId", JSON.stringify([etatId]));
    }

    formData.append("quantity", quantity.toString());

    // Always include warranty end date (now required)
    formData.append("warrantyEnd", warrantyEnd);

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

    // Append files with proper field name
    if (files && files.length > 0) {
      files.forEach((file) => {
        if (file instanceof File) {
          formData.append("files", file);
        }
      });
    }

    try {
      const response = await onCreate(formData);
      console.log("Success:", response);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating actif:", error);
    }
  };

  const filteredStatus =
    statuses?.filter(
      (status) =>
        !status.name.toLowerCase().includes("assign") &&
        !status.name.toLowerCase().includes("réserv")
    ) || [];

  // Filter etats to exclude "Expiré" with case-insensitive matching
  const filteredEtats =
    etats?.filter((etat) => !etat.name.toLowerCase().includes("expir")) || [];

  return (
    <Dialog open={isOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
      <DialogTitle>
        {activeStep === 0
          ? "Ajouter un nouvel equipement - Informations de base"
          : activeStep === 1
          ? "Fichiers attachés"
          : "Assignation"}
      </DialogTitle>

      <DialogContent>
        {/* Stepper pour montrer la progression */}
        <Stepper activeStep={activeStep} className="mb-6 mt-4">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Étape 1: Informations de base */}
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
                  onChange={(e) => setCategoryId(e.target.value)}
                  label="Catégorie"
                >
                  <MenuItem value="">
                    <em>Sélectionner une catégorie</em>
                  </MenuItem>
                  {categories.map((category) => (
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
                onChange={(e) => setStatusId(e.target.value)}
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
              <Select
                value={etatId}
                onChange={(e) => setEtatId(e.target.value)}
                label="État"
              >
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

            {/* Serial Number with uniqueness validation */}
            <TextField
              label="Numéro de série"
              value={serialNumber}
              onChange={handleSerialNumberChange}
              required
              error={formErrors.serialNumber || (serialTouched && serialExists)}
              helperText={
                formErrors.serialNumber && !serialExists
                  ? "Numéro de série requis"
                  : serialExists
                  ? "Ce numéro de série existe déjà"
                  : ""
              }
              fullWidth
              InputProps={{
                endAdornment: isCheckingSerial ? (
                  <CircularProgress size={20} color="inherit" />
                ) : serialTouched && serialNumber.trim() && !serialExists ? (
                  <span className="text-green-500">✓</span>
                ) : null,
              }}
            />

            {/* ActifType Selection with loading indicator */}
            <FormControl fullWidth required error={formErrors.actifTypeId}>
              <InputLabel>Type d&apos;équipement</InputLabel>
              <Select
                value={actifTypeId}
                onChange={handleActifTypeChange}
                label="Type d'équipement"
                disabled={
                  !categoryId || (!availableActifTypes && isLoadingActifTypes)
                }
                startAdornment={
                  !availableActifTypes && isLoadingActifTypes ? (
                    <CircularProgress size={20} />
                  ) : null
                }
              >
                <MenuItem value="">
                  <em>Sélectionner un type</em>
                </MenuItem>
                {availableActifTypes?.map((type) => (
                  <MenuItem key={type.actifTypeId} value={type.actifTypeId}>
                    {type.nom}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.actifTypeId && (
                <FormHelperText>Type d&apos;équipement requis</FormHelperText>
              )}
              {!categoryId && !skipCategorySelection && (
                <FormHelperText>
                  Veuillez d&apos;abord sélectionner une catégorie
                </FormHelperText>
              )}
            </FormControl>

            {/* Brand (Marque) */}
            <FormControl fullWidth required error={formErrors.marqueId}>
              <InputLabel>Marque</InputLabel>
              <Select
                value={marqueId}
                onChange={handleMarqueChange}
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
                  Veuillez d&apos;abord sélectionner un type d&apos;équipement
                </FormHelperText>
              )}
            </FormControl>

            {/* Model (Modele) */}
            <FormControl fullWidth required error={formErrors.modeleId}>
              <InputLabel>Modèle</InputLabel>
              <Select
                value={modeleId}
                onChange={(e) => setModeleId(e.target.value)}
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
                  Veuillez d&apos;abord sélectionner une marque
                </FormHelperText>
              )}
            </FormControl>

            {/* Quantity */}
            <TextField
              label="Quantité"
              type="number"
              value={quantity}
              onChange={(e) => {
                const newValue = Math.max(1, parseInt(e.target.value) || 1);
                setQuantity(newValue);

                // Adjust assign quantity if needed
                if (assignQuantity > newValue) {
                  setAssignQuantity(newValue);
                }

                // Reset supplier allocations when quantity changes
                if (useMultipleSuppliers) {
                  setSupplierAllocations([]);
                  setSupplierAllocationsValid(false);
                }
              }}
              fullWidth
              inputProps={{ min: 1 }}
            />

            {/* Warranty End Date - Now required */}
            <TextField
              label={
                isSoftwareCategory
                  ? "Date d&apos;expiration"
                  : "Fin de garantie"
              }
              type="date"
              value={warrantyEnd}
              onChange={handleWarrantyEndChange}
              fullWidth
              required
              error={formErrors.warrantyEnd}
              helperText={
                formErrors.warrantyEnd
                  ? isSoftwareCategory
                    ? "Date d'expiration requise"
                    : "Date de fin de garantie requise"
                  : isSoftwareCategory
                  ? "Date d'expiration de la licence"
                  : "Date de fin de garantie"
              }
              InputLabelProps={{ shrink: true }}
            />

            {/* Divider for supplier section */}
            <Divider className="col-span-2 my-2" />

            {/* Toggle for single/multiple supplier mode */}
            <div className="col-span-2 flex items-center justify-between mb-4">
              <Typography variant="subtitle1">
                Mode d&apos;approvisionnement
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={useMultipleSuppliers}
                    onChange={handleToggleMultiSupplier}
                    color="primary"
                  />
                }
                label={
                  useMultipleSuppliers
                    ? "Fournisseurs multiples"
                    : "Fournisseur unique"
                }
              />
            </div>

            {/* Single supplier selection */}
            {!useMultipleSuppliers && (
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
                    isLoadingFournisseurs ? (
                      <CircularProgress size={20} />
                    ) : null
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
            )}

            {/* Display the supplier email and phone if a supplier is selected */}
            {!useMultipleSuppliers && fournisseurId && (
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

            {/* Multiple supplier selection */}
            {useMultipleSuppliers && (
              <div className="col-span-2">
                <MultiSupplierSelection
                  suppliers={fournisseurs as Fournisseur[]}
                  isLoading={isLoadingFournisseurs}
                  totalQuantity={quantity}
                  onSuppliersChange={handleSupplierAllocationsChange}
                />

                {formErrors.supplierAllocations && (
                  <FormHelperText error className="mt-2">
                    Veuillez répartir correctement la quantité entre les
                    fournisseurs
                  </FormHelperText>
                )}
              </div>
            )}
          </div>
        )}

        {/* Étape 2: Fichiers attachés */}
        {activeStep === 1 && (
          <div className="mt-4">
            <FileUploadSection
              files={files}
              onChange={handleFileChange}
              maxFiles={5}
              acceptedFileTypes="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
          </div>
        )}

        {/* Étape 3: Assignation d&apos;employé */}
        {activeStep === 2 && (
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
                  label="Assigner cet actif à un employé"
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
                  label="Changer le statut à 'Réservé'"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoUpdateEtat}
                      onChange={(e) => setAutoUpdateEtat(e.target.checked)}
                    />
                  }
                  label="Changer l'état à 'En service'"
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
                        setSelectedEmployeeId(e.target.value);
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
                {quantity > 1 && (
                  <div className="mt-4">
                    <TextField
                      label="Quantité à assigner"
                      type="number"
                      value={assignQuantity}
                      onChange={(e) =>
                        setAssignQuantity(
                          Math.max(
                            1,
                            Math.min(quantity, parseInt(e.target.value) || 1)
                          )
                        )
                      }
                      fullWidth
                      inputProps={{ min: 1, max: quantity }}
                      helperText={`Maximum: ${quantity}`}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Résumé de l&apos;actif */}
            <div className="mt-6 p-4 border border-gray-300 rounded bg-gray-50">
              <h3 className="font-medium mb-2">Résumé</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>Nom:</strong>{" "}
                  {skipNomField ? generateActifName() : "Personnalisé"}
                </div>
                <div>
                  <strong>Type:</strong> {actifType}
                </div>
                <div>
                  <strong>Marque:</strong>{" "}
                  {marques.find((m) => m.marqueId === marqueId)?.name || ""}
                </div>
                <div>
                  <strong>Modèle:</strong>{" "}
                  {modeles.find((m) => m.modeleId === modeleId)?.name || ""}
                </div>
                <div>
                  <strong>N° Série:</strong> {serialNumber}
                </div>
                <div>
                  <strong>Quantité:</strong> {quantity}
                </div>
                <div className="col-span-2">
                  <strong>Fournisseur(s):</strong>{" "}
                  {useMultipleSuppliers ? (
                    <ul className="list-disc ml-5 mt-1">
                      {supplierAllocations.map((allocation) => {
                        const supplier = fournisseurs.find(
                          (f) => f.fournisseurId === allocation.fournisseurId
                        );
                        return supplier ? (
                          <li key={allocation.id}>
                            {supplier.name} - {allocation.quantity} unité(s)
                          </li>
                        ) : null;
                      })}
                    </ul>
                  ) : (
                    fournisseurs.find((f) => f.fournisseurId === fournisseurId)
                      ?.name || ""
                  )}
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
                  {assignToEmployee && autoUpdateEtat
                    ? "En service (automatique)"
                    : etats?.find((etat) => etat.etatId === etatId)?.name || ""}
                </div>
                {warrantyEnd && (
                  <div>
                    <strong>
                      {isSoftwareCategory
                        ? "Expiration:"
                        : "Garantie jusqu&apos;au:"}
                    </strong>{" "}
                    {new Date(warrantyEnd).toLocaleDateString()}
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
                    {quantity > 1 && assignQuantity > 0 && (
                      <span>
                        {" "}
                        ({assignQuantity} unité{assignQuantity > 1 ? "s" : ""})
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
            <Button
              onClick={handleNext}
              color="primary"
              variant="contained"
              disabled={isCheckingSerial} // Disable Next button while checking serial
            >
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

export default CreateActifModal;

