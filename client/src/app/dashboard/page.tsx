// Dashboard.tsx
"use client";

// Note: This dashboard uses the updated data structure where:
// - actif.marqueObj?.name is used instead of the removed actif.marque
// - actif.modeleObj?.name is used instead of the removed actif.modele
// - For suppliers:
//   * Display: actif.fournisseurObj?.name ?? actif.fournisseur
//   * Assignments: Use both fournisseurs[] and multipleSuppliers[] arrays
// See api.ts for the complete interface definitions

import {
  CheckCircle,
  Package,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import CardStatusEquipmentSummary from "./typeEquipement";
import CardLastAddedAssets from "./DerniereAjout";
import CardSalesSummary from "./ResumePerformance";
import StatCard from "./StatCard";
import StatsRow from "./StatRow";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CardEtatEquipmentSummary from "./ResumeAcquisitions";
import { getSelectedDatabase } from "@/utils/auth";

const Dashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [databaseName, setDatabaseName] = useState<string>("");

  useEffect(() => {
    // Check if JWT exists in localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login"); // Redirect to login if not authenticated
    } else {
      setLoading(false); // Proceed with loading the dashboard content
    }

    // Get selected database
    const selectedDb = getSelectedDatabase();
    setDatabaseName(selectedDb || "");

    // Listen for changes in database selection
    const handleStorageChange = () => {
      const updatedDb = getSelectedDatabase();
      setDatabaseName(updatedDb || "");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);

  // Get theme class based on selected database
  const getThemeClass = () => {
    return databaseName.toLowerCase() === "insight"
      ? "bg-green-50"
      : "bg-blue-50";
  };

  if (loading) {
    return <div>Chargement...</div>; // Display loading state while checking the token
  }

  return (
    <div className={`p-4 min-h-screen ${getThemeClass()}`}>
      <StatsRow />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xl:overflow-auto gap-12 pb-4 custom-grid-rows">
        <CardLastAddedAssets />
        <CardSalesSummary />
        <CardEtatEquipmentSummary />
        <CardStatusEquipmentSummary />
      </div>
    </div>
  );
};

export default Dashboard;
