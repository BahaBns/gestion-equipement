"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { Plus } from "lucide-react";
import CreateActifModal from "./CreateActifModal";
import CreateLicenseModal from "./createLicenseModal";
import {
  useCreateActifMutation,
  useCreateLicenseMutation,
  useGetCategoriesQuery,
  useGetStatusesQuery,
  useGetEtatsQuery,
  useGetActifTypesQuery,
  useGetLicenseTypesQuery,
  Etat,
} from "@/state/api";

interface AssetCreationWrapperProps {
  onSuccess: () => void;
}

// Define interfaces for your data types to ensure consistent typing
interface Category {
  categoryId: string;
  nom: string;
  [key: string]: any;
}



const AssetCreationWrapper = ({
  onSuccess,
}: AssetCreationWrapperProps) => {
  // State for selection dialog
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

  // State for modal visibility
  const [isActifModalOpen, setIsActifModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  // Fetch categories, statuses, and etats
  const { data: categories, isLoading: isCategoriesLoading } =
    useGetCategoriesQuery();
  const { data: statuses, isLoading: isStatusesLoading } =
    useGetStatusesQuery();
  const { data: etats, isLoading: isEtatsLoading } = useGetEtatsQuery();

  // Conditionally fetch appropriate types
  const { data: actifTypes } = useGetActifTypesQuery(selectedCategoryId, {
    skip: !selectedCategoryId || selectedCategoryName !== "hardware",
  });

  const { data: licenseTypes } = useGetLicenseTypesQuery(
    { categoryId: selectedCategoryId },
    { skip: !selectedCategoryId || selectedCategoryName !== "software" }
  );

  // Mutations for creating assets
  const [createActif] = useCreateActifMutation();
  const [createLicense] = useCreateLicenseMutation();

  // Open the category selection dialog
  const handleOpenCategoryDialog = () => {
    setIsCategoryDialogOpen(true);
    setSelectedCategoryId("");
    setSelectedCategoryName("");
  };

  // Close the category selection dialog
  const handleCloseCategoryDialog = () => {
    setIsCategoryDialogOpen(false);
  };

  // Handle category selection change
  const handleCategoryChange = (event: SelectChangeEvent) => {
    const categoryId = event.target.value;
    setSelectedCategoryId(categoryId);

    // Find the selected category to get its name
    const selectedCategory = categories?.find(
      (cat) => cat.categoryId === categoryId
    );
    if (selectedCategory) {
      setSelectedCategoryName(selectedCategory.nom.toLowerCase());
      console.log("Selected category:", selectedCategory.nom);
    }
  };

  // Continue to appropriate creation modal based on category selection
  const handleContinue = () => {
    if (!selectedCategoryId) return;

    // Close category dialog
    setIsCategoryDialogOpen(false);

    // Open appropriate modal based on category name
    if (selectedCategoryName === "hardware") {
      setIsActifModalOpen(true);
    } else if (selectedCategoryName === "software") {
      setIsLicenseModalOpen(true);
    }
  };

  // Handle creation of hardware asset
  const handleCreateActif = async (formData: FormData) => {
    try {
      if (!formData.has("categoryId")) {
        formData.append("categoryId", selectedCategoryId);
      }

      await createActif(formData).unwrap();
      setIsActifModalOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating hardware asset:", error);
    }
  };

  // Handle creation of software license
  const handleCreateLicense = async (formData: FormData) => {
    try {
      if (!formData.has("categoryId")) {
        formData.append("categoryId", selectedCategoryId);
      }

      await createLicense(formData).unwrap();
      setIsLicenseModalOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating software license:", error);
    }
  };

  // Loading state - now includes etats loading
  if (isCategoriesLoading || isStatusesLoading || isEtatsLoading) {
    return (
      <Button
        variant="contained"
        color="primary"
        disabled
        className="flex items-center"
      >
        <Plus className="w-5 h-5 mr-2" />
        Chargement...
      </Button>
    );
  }

  return (
    <>
      {/* Main "Add Asset" button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpenCategoryDialog}
        className="flex items-center bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded transition duration-150"
      >
        <Plus className="w-5 h-5 mr-2" />
        Ajouter un équipement
      </Button>

      {/* Category Selection Dialog */}
      <Dialog
        open={isCategoryDialogOpen}
        onClose={handleCloseCategoryDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sélection de la catégorie</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="category-label">Catégorie</InputLabel>
            <Select
              labelId="category-label"
              value={selectedCategoryId}
              onChange={handleCategoryChange}
              label="Catégorie"
            >
              <MenuItem value="">
                <em>Sélectionner une catégorie</em>
              </MenuItem>
              {categories?.map((category) => (
                <MenuItem key={category.categoryId} value={category.categoryId}>
                  {category.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog}>Annuler</Button>
          <Button
            onClick={handleContinue}
            color="primary"
            variant="contained"
            disabled={!selectedCategoryId}
          >
            Continuer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hardware Asset Creation Modal */}
      {isActifModalOpen && (
        <CreateActifModal
          isOpen={isActifModalOpen}
          onClose={() => setIsActifModalOpen(false)}
          onCreate={handleCreateActif}
          categories={categories || []}
          statuses={statuses || []}
          etats={etats || []}
          actifTypes={actifTypes || []}
          preSelectedCategoryId={selectedCategoryId}
          skipCategorySelection={true}
          skipNomField={true}
        />
      )}

      {/* Software License Creation Modal */}
      {isLicenseModalOpen && (
        <CreateLicenseModal
          isOpen={isLicenseModalOpen}
          onClose={() => setIsLicenseModalOpen(false)}
          onCreate={handleCreateLicense}
          categories={categories || []}
          statuses={statuses || []}
          etats={etats || []}
          licenseTypes={licenseTypes || []}
          preSelectedCategoryId={selectedCategoryId}
          skipCategorySelection={true}
        />
      )}
    </>
  );
};

export default AssetCreationWrapper;
