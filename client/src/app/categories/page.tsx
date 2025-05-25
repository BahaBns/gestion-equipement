"use client";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "@/state/api";
import Header from "@/app/(components)/Header";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Button } from "@/app/(components)/Button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import { Edit, Trash, AlertTriangle } from "lucide-react"; // Ajout de l'icône d'alerte

const Categories = () => {
  const { data: categories, isError, isLoading } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [newCategoryName, setNewCategoryName] = useState("");

  // State pour les modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState("");

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setErrorMessage("Le nom de la catégorie ne peut pas être vide.");
      setIsErrorModalOpen(true);
      return;
    }
    try {
      await createCategory({ nom: newCategoryName }).unwrap();
      setNewCategoryName("");
    } catch (error) {
      setErrorMessage("Erreur lors de l'ajout de la catégorie.");
      setIsErrorModalOpen(true);
    }
  };

  const openDeleteModal = (id: string) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCategory = async () => {
    try {
      await deleteCategory(categoryToDelete).unwrap();
      setIsDeleteModalOpen(false);
    } catch (error) {
      setIsDeleteModalOpen(false);

      // Vérifier si l'erreur est liée à une contrainte de clé étrangère
      if (
        (error as any).status === 409 ||
        ((error as any).data &&
          (error as any).data.message &&
          ((error as any).data.message.includes("contrainte") ||
            (error as any).data.message.includes("foreign key") ||
            (error as any).data.message.includes("référence")))
      ) {
        setErrorMessage(
          "Impossible de supprimer cette catégorie car elle est utilisée par d'autres éléments (actifs, types d'actifs ou licences). Veuillez d'abord supprimer ou modifier ces éléments."
        );
      } else {
        setErrorMessage("Erreur lors de la suppression de la catégorie.");
      }
      setIsErrorModalOpen(true);
    }
  };

  const handleEditCategory = (id: string) => {
    // Find the category to edit
    const categoryToEdit = categories?.find((cat) => cat.categoryId === id);
    if (categoryToEdit) {
      setEditCategoryId(id);
      setEditCategoryName(categoryToEdit.nom);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editCategoryName.trim()) {
      setErrorMessage("Le nom de la catégorie ne peut pas être vide.");
      setIsErrorModalOpen(true);
      return;
    }

    try {
      await updateCategory({
        categoryId: editCategoryId,
        nom: editCategoryName,
      }).unwrap();
      setIsEditModalOpen(false);
      // Reset the edit state
      setEditCategoryId("");
      setEditCategoryName("");
    } catch (error) {
      setErrorMessage("Erreur lors de la modification de la catégorie.");
      setIsErrorModalOpen(true);
    }
  };

  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsErrorModalOpen(false);
  };

  if (isLoading) {
    return <p>Chargement...</p>;
  }
  if (isError || !categories) {
    return <p className="text-red-500">Échec de récupération des catégories</p>;
  }

  const columns: GridColDef[] = [
    {
      field: "nom",
      headerName: "Nom de catégorie",
      flex: 1,
      renderHeader: (params) => (
        <strong style={{ fontWeight: "bold" }}>
          {params.colDef.headerName}
        </strong>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150, // Réduit la largeur puisque nous n'avons plus qu'un seul bouton
      renderHeader: (params) => (
        <strong style={{ fontWeight: "bold" }}>
          {params.colDef.headerName}
        </strong>
      ),
      renderCell: (params) => (
        <div className="flex">
          <button
            onClick={() => handleEditCategory(params.row.categoryId)}
            className="flex-1 py-2 px-3 text-blue-600 hover:bg-blue-50 transition duration-150 flex items-center justify-center rounded"
          >
            <Edit className="w-4 h-4 mr-1" />
            Modifier
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-5">
      <Header name="Gestion des Catégories" />
      <div className="flex gap-3 my-4">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nom de catégorie"
          className="border border-gray-300 rounded-lg px-3 py-2 w-full max-w-sm"
        />
        <Button
          onClick={handleAddCategory}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-150 flex items-center justify-center"
        >
          Ajouter Catégorie
        </Button>
      </div>
      {categories.length === 0 ? (
        <p className="text-gray-500">Aucune catégorie disponible</p>
      ) : (
        <div className="bg-white shadow rounded-lg border border-gray-200 mt-5">
          <DataGrid
            rows={categories}
            columns={columns}
            getRowId={(row) => row.categoryId}
            checkboxSelection={false}
            className="!text-gray-700"
          />
        </div>
      )}

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onClose={handleCloseModals}>
        <DialogTitle>Modifier la catégorie</DialogTitle>
        <DialogContent className="sm:max-w-md">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right col-span-1">
                Nom
              </label>
              <input
                id="name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                className="col-span-3 border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseModals}
            className="text-gray-600 hover:bg-gray-50 px-4 py-2 rounded transition duration-150"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSaveEdit}
            className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded transition duration-150"
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onClose={handleCloseModals}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action
            est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseModals}
            className="text-gray-600 hover:bg-gray-50 px-4 py-2 rounded transition duration-150"
          >
            Annuler
          </Button>
          <Button
            onClick={handleDeleteCategory}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-150"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={isErrorModalOpen} onClose={handleCloseModals}>
        <DialogTitle className="flex items-center text-red-600">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Erreur
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{errorMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseModals}
            className="text-gray-600 hover:bg-gray-50 px-4 py-2 rounded transition duration-150"
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Categories;
