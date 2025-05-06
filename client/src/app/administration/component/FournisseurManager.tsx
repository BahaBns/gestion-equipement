"use client";

import React, { useState } from "react";
import {
  useGetFournisseursQuery,
  useCreateFournisseurMutation,
  useUpdateFournisseurMutation,
  useDeleteFournisseurMutation,
  useCreateHashtagMutation,
  Fournisseur,
} from "@/state/api";

const FournisseurManager = () => {
  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;

  // État pour le formulaire
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFournisseur, setCurrentFournisseur] = useState<
    Partial<Fournisseur>
  >({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Récupérer les données
  const {
    data: fournisseurs,
    isLoading,
    refetch,
  } = useGetFournisseursQuery(search);

  // Mutations
  const [createFournisseur] = useCreateFournisseurMutation();
  const [updateFournisseur] = useUpdateFournisseurMutation();
  const [deleteFournisseur] = useDeleteFournisseurMutation();
  const [createHashtag] = useCreateHashtagMutation();

  // Logique de pagination
  const filteredFournisseurs =
    fournisseurs?.filter(
      (fournisseur) =>
        search === "" ||
        fournisseur.name.toLowerCase().includes(search.toLowerCase()) ||
        (fournisseur.email &&
          fournisseur.email.toLowerCase().includes(search.toLowerCase())) ||
        (fournisseur.phone && fournisseur.phone.includes(search))
    ) || [];
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedFournisseurs = filteredFournisseurs.slice(
    startIndex,
    endIndex
  );
  const totalPages = Math.ceil(filteredFournisseurs.length / pageSize);

  // Ouvrir le modal d'ajout
  const handleAddNew = () => {
    setCurrentFournisseur({});
    setFormErrors({});
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Ouvrir le modal d'édition
  const handleEdit = (fournisseur: Fournisseur) => {
    setCurrentFournisseur(fournisseur);
    setFormErrors({});
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!currentFournisseur.name || currentFournisseur.name.trim() === "") {
      errors.name = "Le nom est obligatoire";
    }

    if (
      currentFournisseur.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentFournisseur.email)
    ) {
      errors.email = "Format d'email invalide";
    }

    if (
      currentFournisseur.phone &&
      !/^[0-9+\-\s()]*$/.test(currentFournisseur.phone)
    ) {
      errors.phone = "Format de téléphone invalide";
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
      if (isEditing && currentFournisseur.fournisseurId) {
        await updateFournisseur({
          fournisseurId: currentFournisseur.fournisseurId,
          name: currentFournisseur.name || "",
          email: currentFournisseur.email,
          phone: currentFournisseur.phone,
        }).unwrap();
      } else {
        const result = await createFournisseur({
          name: currentFournisseur.name || "",
          email: currentFournisseur.email,
          phone: currentFournisseur.phone,
        }).unwrap();

        // Créer un hashtag pour le nouveau fournisseur
        await createHashtag({
          name: `fournisseur_${result.name.replace(/\s+/g, "_").toLowerCase()}`,
          description: `Fournisseur: ${result.name}`,
        }).unwrap();
      }

      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Échec de l'enregistrement du fournisseur:", error);
      alert("Une erreur s'est produite lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer avec confirmation
  const handleDelete = async (fournisseurId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur?")) {
      try {
        await deleteFournisseur(fournisseurId).unwrap();
        refetch();
      } catch (error) {
        console.error("Échec de la suppression du fournisseur:", error);
        alert(
          "Une erreur s'est produite lors de la suppression. Si des actifs sont associés à ce fournisseur, il ne peut pas être supprimé."
        );
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
        <h2 className="text-2xl font-bold mb-2 sm:mb-0">
          Gestion des Fournisseurs
        </h2>
        <button
          onClick={handleAddNew}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto"
        >
          Ajouter un Fournisseur
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un fournisseur par nom, email ou téléphone..."
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
                  <th className="py-2 px-4 border-b text-center">Email</th>
                  <th className="py-2 px-4 border-b text-center">Téléphone</th>
                  <th className="py-2 px-4 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFournisseurs.map((fournisseur) => (
                  <tr
                    key={fournisseur.fournisseurId}
                    className="hover:bg-gray-50"
                  >
                    <td className="py-2 px-4 border-b text-center">
                      {fournisseur.name}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      {fournisseur.email || "-"}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      {fournisseur.phone || "-"}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      <button
                        onClick={() => handleEdit(fournisseur)}
                        className="text-blue-500 hover:text-blue-700 mr-2"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(fournisseur.fournisseurId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedFournisseurs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center">
                      Aucun fournisseur trouvé
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
              {isEditing ? "Modifier le Fournisseur" : "Ajouter un Fournisseur"}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Nom *</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                value={currentFournisseur.name || ""}
                onChange={(e) =>
                  setCurrentFournisseur({
                    ...currentFournisseur,
                    name: e.target.value,
                  })
                }
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className={`w-full px-3 py-2 border ${
                  formErrors.email ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                value={currentFournisseur.email || ""}
                onChange={(e) =>
                  setCurrentFournisseur({
                    ...currentFournisseur,
                    email: e.target.value,
                  })
                }
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                className={`w-full px-3 py-2 border ${
                  formErrors.phone ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                value={currentFournisseur.phone || ""}
                onChange={(e) =>
                  setCurrentFournisseur({
                    ...currentFournisseur,
                    phone: e.target.value,
                  })
                }
                placeholder="Ex: +33 1 23 45 67 89"
              />
              {formErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
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

export default FournisseurManager;
