"use client";

import React, { useState, useEffect } from "react";
import {
  useGetModelesQuery,
  useGetMarquesQuery,
  useGetAllActifTypesQuery,
  useCreateModeleMutation,
  useUpdateModeleMutation,
  useDeleteModeleMutation,
  useCreateHashtagMutation,
  Modele,
  Marque,
} from "@/state/api";

const ModeleManager = () => {
  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;

  // État pour le formulaire
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentModele, setCurrentModele] = useState<Partial<Modele>>({});
  const [selectedMarqueId, setSelectedMarqueId] = useState("");
  const [selectedActifTypeId, setSelectedActifTypeId] = useState("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Récupérer les données
  const { data: modeles, isLoading, refetch } = useGetModelesQuery(search);

  // Récupérer les marques pour le formulaire
  const { data: marques } = useGetMarquesQuery();

  // Récupérer les types d'actifs
  const { data: actifTypes } = useGetAllActifTypesQuery();

  // Mutations
  const [createModele] = useCreateModeleMutation();
  const [updateModele] = useUpdateModeleMutation();
  const [deleteModele] = useDeleteModeleMutation();
  const [createHashtag] = useCreateHashtagMutation();

  // Logique de pagination
  const filteredModeles =
    modeles?.filter(
      (modele) =>
        search === "" ||
        modele.name.toLowerCase().includes(search.toLowerCase())
    ) || [];
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedModeles = filteredModeles.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredModeles.length / pageSize);

  // Ouvrir le modal d'ajout
  const handleAddNew = () => {
    setCurrentModele({});
    setSelectedMarqueId("");
    setSelectedActifTypeId("");
    setFormErrors({});
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Ouvrir le modal d'édition
  const handleEdit = (modele: Modele) => {
    setCurrentModele(modele);
    setSelectedMarqueId(modele.marqueId);
    if (modele.marque?.actifTypeId) {
      setSelectedActifTypeId(modele.marque.actifTypeId);
    }
    setFormErrors({});
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Filtrer les marques par type d'actif sélectionné
  const filteredMarques = selectedActifTypeId
    ? marques?.filter((marque) => marque.actifTypeId === selectedActifTypeId)
    : marques;

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!currentModele.name || currentModele.name.trim() === "") {
      errors.name = "Le nom est obligatoire";
    }

    if (!selectedMarqueId) {
      errors.marqueId = "La marque est obligatoire";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Enregistrer (création ou mise à jour)
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && currentModele.modeleId) {
        await updateModele({
          modeleId: currentModele.modeleId,
          name: currentModele.name || "",
          marqueId: selectedMarqueId,
        }).unwrap();
      } else {
        if (!selectedMarqueId) {
          throw new Error("Marque ID is required");
        }

        const result = await createModele({
          marqueId: selectedMarqueId,
          name: currentModele.name || "",
        }).unwrap();

        // Créer un hashtag pour le nouveau modèle
        await createHashtag({
          name: `modele_${result.name.replace(/\s+/g, "_").toLowerCase()}`,
          description: `Modèle: ${result.name}`,
        }).unwrap();
      }

      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Échec de l'enregistrement du modèle:", error);
      alert("Une erreur s'est produite lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer avec confirmation
  const handleDelete = async (modeleId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce modèle?")) {
      try {
        await deleteModele(modeleId).unwrap();
        refetch();
      } catch (error) {
        console.error("Échec de la suppression du modèle:", error);
        alert(
          "Une erreur s'est produite lors de la suppression. Si des actifs sont associés à ce modèle, il ne peut pas être supprimé."
        );
      }
    }
  };

  // Recherche
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Effet pour rafraîchir les données au montage
  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-2 sm:mb-0">Gestion des Modèles</h2>
        <button
          onClick={handleAddNew}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto"
        >
          Ajouter un Modèle
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un modèle..."
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
                  <th className="py-2 px-4 border-b text-center">Nom</th>
                  <th className="py-2 px-4 border-b text-center">Marque</th>
                  <th className="py-2 px-4 border-b text-center">Actifs</th>
                  <th className="py-2 px-4 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedModeles.map((modele) => (
                  <tr key={modele.modeleId} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-center">
                      {modele.name}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      {modele.marque?.name || modele.marqueId}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      {modele._count?.actifs || 0}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      <button
                        onClick={() => handleEdit(modele)}
                        className="text-blue-500 hover:text-blue-700 mr-2"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(modele.modeleId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedModeles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center">
                      Aucun modèle trouvé
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
              {isEditing ? "Modifier le Modèle" : "Ajouter un Modèle"}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Nom *</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                value={currentModele.name || ""}
                onChange={(e) =>
                  setCurrentModele({
                    ...currentModele,
                    name: e.target.value,
                  })
                }
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Type d'Actif *
              </label>
              <select
                className={`w-full px-3 py-2 border border-gray-300 rounded-md`}
                value={selectedActifTypeId}
                onChange={(e) => {
                  setSelectedActifTypeId(e.target.value);
                  setSelectedMarqueId(""); // Reset marque when actif type changes
                }}
              >
                <option value="">Sélectionner un type d'actif</option>
                {actifTypes?.map((type) => (
                  <option key={type.actifTypeId} value={type.actifTypeId}>
                    {type.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Marque *</label>
              <select
                className={`w-full px-3 py-2 border ${
                  formErrors.marqueId ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                value={selectedMarqueId}
                onChange={(e) => setSelectedMarqueId(e.target.value)}
                disabled={!selectedActifTypeId}
              >
                <option value="">Sélectionner une marque</option>
                {filteredMarques?.map((marque) => (
                  <option key={marque.marqueId} value={marque.marqueId}>
                    {marque.name}
                  </option>
                ))}
              </select>
              {formErrors.marqueId && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.marqueId}
                </p>
              )}
              {!selectedActifTypeId && (
                <p className="text-gray-500 text-xs mt-1">
                  Veuillez d'abord sélectionner un type d'actif
                </p>
              )}
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

export default ModeleManager;
