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
} from "@mui/material";
import { Edit, Trash } from "lucide-react"; // Import icons like in ActifsGridView

const Categories = () => {
  const { data: categories, isError, isLoading } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [newCategoryName, setNewCategoryName] = useState("");

  // State for the edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Le nom de la catégorie ne peut pas être vide.");
      return;
    }
    try {
      await createCategory({ nom: newCategoryName }).unwrap();
      setNewCategoryName("");
    } catch (error) {
      alert("Erreur lors de l'ajout de la catégorie.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id).unwrap();
    } catch (error) {
      alert("Erreur lors de la suppression de la catégorie.");
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
      alert("Le nom de la catégorie ne peut pas être vide.");
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
      alert("Erreur lors de la modification de la catégorie.");
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
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
      width: 200,
      renderHeader: (params) => (
        <strong style={{ fontWeight: "bold" }}>
          {params.colDef.headerName}
        </strong>
      ),
      renderCell: (params) => (
        <div className="flex">
          <button
            onClick={() => handleEditCategory(params.row.categoryId)}
            className="flex-1 py-2 px-3 text-blue-600 hover:bg-blue-50 transition duration-150 flex items-center justify-center rounded-l"
          >
            <Edit className="w-4 h-4 mr-1" />
            Modifier
          </button>
          <div className="border-r border-gray-200 h-8 my-auto"></div>
          <button
            onClick={() => handleDeleteCategory(params.row.categoryId)}
            className="flex-1 py-2 px-3 text-red-600 hover:bg-red-50 transition duration-150 flex items-center justify-center rounded-r"
          >
            <Trash className="w-4 h-4 mr-1" />
            Supprimer
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
      <Dialog open={isEditModalOpen} onClose={handleCloseModal}>
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
            onClick={handleCloseModal}
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
    </div>
  );
};

export default Categories;
