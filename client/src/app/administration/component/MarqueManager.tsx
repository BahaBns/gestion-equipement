"use client";

import React, { useState } from "react";
import {
  useGetMarquesQuery,
  useCreateMarqueMutation,
  useUpdateMarqueMutation,
  useDeleteMarqueMutation,
  useGetAllActifTypesQuery,
  useCreateHashtagMutation,
  Marque,
} from "@/state/api";

const MarqueManager = () => {
  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;

  // État pour le formulaire
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMarque, setCurrentMarque] = useState<Partial<Marque>>({});
  const [selectedActifTypeId, setSelectedActifTypeId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Récupérer les données
  const { data: marques, isLoading, refetch } = useGetMarquesQuery(search);
  const { data: actifTypes } = useGetAllActifTypesQuery();

  // Mutations
  const [createMarque] = useCreateMarqueMutation();
  const [updateMarque] = useUpdateMarqueMutation();
  const [deleteMarque] = useDeleteMarqueMutation();
  const [createHashtag] = useCreateHashtagMutation();

  // Logique de pagination
  const filteredMarques =
    marques?.filter(
      (marque) =>
        search === "" ||
        marque.name.toLowerCase().includes(search.toLowerCase())
    ) || [];
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMarques = filteredMarques.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredMarques.length / pageSize);

  // Ouvrir le modal d'ajout
  const handleAddNew = () => {
    setCurrentMarque({});
    setSelectedActifTypeId("");
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Ouvrir le modal d'édition
  const handleEdit = (marque: Marque) => {
    setCurrentMarque(marque);
    setSelectedActifTypeId(marque.actifTypeId);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Enregistrer (création ou mise à jour)
  const handleSave = async () => {
    if (!currentMarque.name || !selectedActifTypeId) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && currentMarque.marqueId) {
        await updateMarque({
          marqueId: currentMarque.marqueId,
          name: currentMarque.name,
          actifTypeId: selectedActifTypeId,
        }).unwrap();
      } else {
        const result = await createMarque({
          name: currentMarque.name || "",
          actifTypeId: selectedActifTypeId,
        }).unwrap();

        // Créer un hashtag pour la nouvelle marque
        await createHashtag({
          name: `marque_${result.name.replace(/\s+/g, "_").toLowerCase()}`,
          description: `Marque: ${result.name}`,
        }).unwrap();
      }

      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Échec de l'enregistrement de la marque:", error);
      alert("Une erreur s'est produite lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer avec confirmation
  const handleDelete = async (marqueId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette marque?")) {
      try {
        await deleteMarque(marqueId).unwrap();
        refetch();
      } catch (error) {
        console.error("Échec de la suppression de la marque:", error);
        alert("Une erreur s'est produite lors de la suppression");
      }
    }
  };

  // Recherche
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-2 sm:mb-0">Gestion des Marques</h2>
        <button
          onClick={handleAddNew}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto"
        >
          Ajouter une Marque
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher une marque..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          value={search}
          onChange={handleSearch}
        />
      </div>

      {/* État de chargement */}
      {isLoading && <p className="text-center py-4">Chargement...</p>}

      {/* Tableau */}
      {!isLoading && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b">Nom</th>
                  <th className="py-2 px-4 border-b">Type d'Actif</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMarques.map((marque) => (
                  <tr key={marque.marqueId} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-center">
                      {marque.name}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      {marque.actifType?.nom || marque.actifTypeId}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      <button
                        onClick={() => handleEdit(marque)}
                        className="text-blue-500 hover:text-blue-700 mr-2"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(marque.marqueId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedMarques.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center">
                      Aucune marque trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`mx-1 px-3 py-1 rounded ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-500"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Précédent
              </button>
              <span className="mx-2 px-3 py-1">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className={`mx-1 px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-500"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal pour Ajouter/Modifier */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {isEditing ? "Modifier la Marque" : "Ajouter une Marque"}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Nom *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={currentMarque.name || ""}
                onChange={(e) =>
                  setCurrentMarque({ ...currentMarque, name: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Type d'Actif *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedActifTypeId}
                onChange={(e) => setSelectedActifTypeId(e.target.value)}
              >
                <option value="">Sélectionner un type d'actif</option>
                {actifTypes?.map((type) => (
                  <option key={type.actifTypeId} value={type.actifTypeId}>
                    {type.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                disabled={isSaving}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span>Enregistrement...</span>
                ) : (
                  <span>{isEditing ? "Mettre à jour" : "Ajouter"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarqueManager;
