// components/HashtagManagementModal.tsx
import React, { useState, useEffect } from "react";
import {
  useGetHashtagsQuery,
  useCreateHashtagMutation,
  useSearchHashtagsQuery,
  useAssociateHashtagToActifMutation,
  useAssociateHashtagToLicenseMutation,
  useDissociateHashtagFromActifMutation,
  useDissociateHashtagFromLicenseMutation,
  Hashtag,
  Actif,
  License,
} from "@/state/api";
import HashtagBadge from "./HashtagBadge";
import { PlusCircle, Search } from "lucide-react";

interface HashtagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Actif | License;
  onSuccess: () => void;
}

const HashtagManagementModal: React.FC<HashtagManagementModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [newHashtagName, setNewHashtagName] = useState("");
  const [itemHashtags, setItemHashtags] = useState<Hashtag[]>([]);

  const { data: allHashtags, isLoading: isLoadingHashtags } =
    useGetHashtagsQuery();
  const { data: searchResults } = useSearchHashtagsQuery(searchTerm, {
    skip: !searchTerm,
  });

  const [createHashtag] = useCreateHashtagMutation();

  const [associateToActif] = useAssociateHashtagToActifMutation();
  const [dissociateFromActif] = useDissociateHashtagFromActifMutation();

  const [associateToLicense] = useAssociateHashtagToLicenseMutation();
  const [dissociateFromLicense] = useDissociateHashtagFromLicenseMutation();

  const isActif = "actifId" in item;
  const itemId = isActif ? item.actifId : item.licenseId;

  // Initialize the current hashtags
  useEffect(() => {
    if (item.hashtags) {
      const hashtags = item.hashtags.map((h) =>
        isActif ? (h as any).hashtag : (h as any).hashtag
      );
      setItemHashtags(hashtags);
    }
  }, [item, isActif]);

  const handleCreateHashtag = async () => {
    if (!newHashtagName.trim()) return;

    try {
      const response = await createHashtag({
        name: newHashtagName.trim(),
        description: "",
      }).unwrap();

      await handleAddHashtag(response);
      setNewHashtagName("");
    } catch (error) {
      console.error("Error creating hashtag:", error);
      alert("Failed to create hashtag");
    }
  };

  const handleAddHashtag = async (hashtag: Hashtag) => {
    try {
      if (isActif) {
        await associateToActif({
          actifId: itemId,
          hashtagId: hashtag.hashtagId,
        }).unwrap();
      } else {
        await associateToLicense({
          licenseId: itemId,
          hashtagId: hashtag.hashtagId,
        }).unwrap();
      }

      setItemHashtags([...itemHashtags, hashtag]);
      onSuccess();
    } catch (error) {
      console.error("Error adding hashtag:", error);
      alert("Failed to add hashtag");
    }
  };

  const handleRemoveHashtag = async (hashtagId: string) => {
    try {
      if (isActif) {
        await dissociateFromActif({
          actifId: itemId,
          hashtagId: hashtagId,
        }).unwrap();
      } else {
        await dissociateFromLicense({
          licenseId: itemId,
          hashtagId: hashtagId,
        }).unwrap();
      }

      setItemHashtags(itemHashtags.filter((h) => h.hashtagId !== hashtagId));
      onSuccess();
    } catch (error) {
      console.error("Error removing hashtag:", error);
      alert("Failed to remove hashtag");
    }
  };

  // Filter out hashtags that are already associated with the item
  const availableHashtags =
    (searchTerm ? searchResults : allHashtags)?.filter(
      (hashtag) => !itemHashtags.some((h) => h.hashtagId === hashtag.hashtagId)
    ) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Gérer les hashtags</h2>

        {/* Current hashtags */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Hashtags actuels</h3>
          <div className="flex flex-wrap">
            {itemHashtags.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun hashtag</p>
            ) : (
              itemHashtags.map((hashtag) => (
                <HashtagBadge
                  key={hashtag.hashtagId}
                  name={hashtag.name}
                  onRemove={() => handleRemoveHashtag(hashtag.hashtagId)}
                />
              ))
            )}
          </div>
        </div>

        {/* Create new hashtag */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Créer un hashtag</h3>
          <div className="flex">
            <input
              type="text"
              value={newHashtagName}
              onChange={(e) => setNewHashtagName(e.target.value)}
              placeholder="Nouveau hashtag"
              className="flex-1 border border-gray-300 rounded-l-md px-3 py-2"
            />
            <button
              onClick={handleCreateHashtag}
              disabled={!newHashtagName.trim()}
              className="bg-blue-600 text-white px-3 py-2 rounded-r-md disabled:bg-gray-400"
            >
              <PlusCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search existing hashtags */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Rechercher des hashtags</h3>
          <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 mb-4">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="flex-1 outline-none"
            />
          </div>

          {/* Available hashtags */}
          <div className="max-h-40 overflow-y-auto">
            {isLoadingHashtags ? (
              <p className="text-gray-500 text-sm">Chargement...</p>
            ) : availableHashtags.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun hashtag disponible</p>
            ) : (
              availableHashtags.map((hashtag) => (
                <div
                  key={hashtag.hashtagId}
                  onClick={() => handleAddHashtag(hashtag)}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded-md flex items-center"
                >
                  <span className="text-blue-600 mr-2">#</span>
                  {hashtag.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default HashtagManagementModal;
