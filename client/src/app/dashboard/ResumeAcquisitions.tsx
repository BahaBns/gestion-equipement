import { TrendingUp } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  useGetActifsQuery,
  useGetLicensesQuery,
  useGetEtatsQuery,
} from "@/state/api";
import { getSelectedDatabase } from "@/utils/auth";

// Define TypeScript interfaces
interface EtatCount {
  actifs: number;
  licenses: number;
  total: number;
  assigned: number;
  available: number;
}

interface EtatData {
  name: string;
  value: number;
  actifs: number;
  licenses: number;
  assigned: number;
  available: number;
  percentage: string;
}

// Define an interface for etatColors with string index signature
interface EtatColorMap {
  [key: string]: string;
  Neuf: string;
  "Bon état": string;
  "État moyen": string;
  "Mauvais état": string;
  Obsolète: string;
  "En réparation": string;
  "En service": string;
  "En stock": string;
  Autre: string;
}

const CardEtatEquipmentSummary = () => {
  // State to track the selected database
  const [databaseName, setDatabaseName] = useState<string>("");

  // Get selected database on component mount
  useEffect(() => {
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
  }, []);

  // Determine primary color based on database
  const primaryColor =
    databaseName.toLowerCase() === "insight" ? "#16a34a" : "#3182ce"; // Green vs Blue

  // Etat colors - adjusted based on selected database
  const etatColors: EtatColorMap = {
    Neuf: databaseName.toLowerCase() === "insight" ? "#15803d" : "#00C49F", // Green for new equipment
    "Bon état":
      databaseName.toLowerCase() === "insight" ? "#22c55e" : "#0088FE", // Blue for good condition
    "État moyen": "#FFBB28", // Yellow for average condition - keep this color
    "Mauvais état": "#FF8042", // Orange for bad condition - keep this color
    Obsolète: "#FF0000", // Red for obsolete - keep this color
    "En réparation":
      databaseName.toLowerCase() === "insight" ? "#166534" : "#8884D8", // Purple/Green for in repair
    "En service": "#00C49F", // Green for in-service
    "En stock": "#0088FE", // Blue for in-stock
    Autre: "#A0A0A0", // Gray for other conditions - keep this color
  };

  // Use existing API hooks to fetch data
  const { data: actifs, isLoading: actifLoading } = useGetActifsQuery();
  const { data: licenses, isLoading: licenseLoading } = useGetLicensesQuery();
  const { data: etats } = useGetEtatsQuery();

  // Function to calculate assigned quantity for an actif
  const calculateAssignedQuantity = (actif: any): number => {
    if (!actif.employees || actif.employees.length === 0) return 0;
    return actif.employees.reduce(
      (total: number, emp: any) => total + (emp.quantity || 0),
      0
    );
  };

  // Function to calculate available quantity for an actif
  const calculateLibreQuantity = (actif: any): number => {
    const totalQuantity = actif.quantity || 0;
    const assignedQuantity = calculateAssignedQuantity(actif);
    return Math.max(0, totalQuantity - assignedQuantity);
  };

  // Calculate equipment by etat
  const calculateEquipmentByEtat = (): EtatData[] => {
    if (!actifs || !licenses || !etats) return [];

    // Initialize an object to store counts by etat
    const etatCounts: Record<string, EtatCount> = {};

    // Group equipment by etat and count
    actifs.forEach((actif) => {
      const etatName = actif.etat?.name || "Non défini";
      if (!etatCounts[etatName]) {
        etatCounts[etatName] = {
          actifs: 0,
          licenses: 0,
          total: 0,
          assigned: 0,
          available: 0,
        };
      }

      // Calculate assigned and available quantities
      const assignedQuantity = calculateAssignedQuantity(actif);
      const availableQuantity = calculateLibreQuantity(actif);

      // Update etat counts
      etatCounts[etatName].actifs += actif.quantity;
      etatCounts[etatName].total += actif.quantity;
      etatCounts[etatName].assigned += assignedQuantity;
      etatCounts[etatName].available += availableQuantity;
    });

    // Group licenses by etat and count
    licenses.forEach((license) => {
      const etatName = license.etat?.name || "Non défini";
      if (!etatCounts[etatName]) {
        etatCounts[etatName] = {
          actifs: 0,
          licenses: 0,
          total: 0,
          assigned: 0,
          available: 0,
        };
      }
      // Use licenseQuantity field for licenses
      etatCounts[etatName].licenses += license.licenseQuantity;
      etatCounts[etatName].total += license.licenseQuantity;

      // For licenses, we consider them all as "assigned" if they have employees
      // or "available" if they don't
      if (license.employees && license.employees.length > 0) {
        const assignedLicenseQuantity = license.employees.reduce(
          (sum: number, emp: any) => sum + (emp.quantity || 0),
          0
        );
        etatCounts[etatName].assigned += assignedLicenseQuantity;
        etatCounts[etatName].available +=
          license.licenseQuantity - assignedLicenseQuantity;
      } else {
        etatCounts[etatName].available += license.licenseQuantity;
      }
    });

    // Convert the object to array for Recharts
    const etatArray = Object.entries(etatCounts).map(([name, counts]) => ({
      name,
      value: counts.total,
      actifs: counts.actifs,
      licenses: counts.licenses,
      assigned: counts.assigned,
      available: counts.available,
      percentage: "0", // Will be calculated below
    }));

    // Sort by value (count) in descending order
    etatArray.sort((a, b) => Number(b.value) - Number(a.value));

    // Calculate total equipment count
    const totalCount = etatArray.reduce((sum, item) => sum + item.value, 0);

    // Calculate percentages for etats
    return etatArray.map((etat) => ({
      ...etat,
      percentage: ((Number(etat.value) / totalCount) * 100).toFixed(1),
    }));
  };

  const equipmentEtats = calculateEquipmentByEtat();

  // Calculate total equipment count
  const totalActifs = actifs
    ? actifs.reduce((sum, actif) => sum + actif.quantity, 0)
    : 0;

  const totalLicenses = licenses
    ? licenses.reduce((sum, license) => sum + license.licenseQuantity, 0)
    : 0;

  const totalEquipmentCount = totalActifs + totalLicenses;

  // Get color for etat - dynamically map colors based on available etats
  const getEtatColor = (etatName: string): string => {
    // If we have a predefined color, use it
    if (etatName in etatColors) {
      return etatColors[etatName];
    }

    // Otherwise, generate a color based on the index of the etat
    if (etats) {
      const etatIndex = etats.findIndex((e) => e.name === etatName);
      if (etatIndex >= 0) {
        const colorKeys = Object.keys(etatColors);
        const fallbackKey = colorKeys[etatIndex % colorKeys.length];
        return etatColors[fallbackKey] || "#A0A0A0";
      }
    }

    // Default fallback
    return "#A0A0A0";
  };

  // Format etat display text
  const getEtatDisplayText = (etat: EtatData): string => {
    // If there's a mix of assigned and available, show the breakdown
    if (etat.assigned > 0 && etat.available > 0) {
      const assignedEtat = "En service"; // Default état for assigned items
      const availableEtat = "En stock"; // Default état for available items

      return `${etat.assigned} ${assignedEtat}, ${etat.available} ${availableEtat}`;
    }

    // If all quantities have the same état
    return `${etat.value} ${etat.name}`;
  };

  return (
    <div className="row-span-3 bg-white shadow-md rounded-2xl flex flex-col justify-between">
      {actifLoading || licenseLoading ? (
        <div className="m-5">Chargement...</div>
      ) : (
        <>
          {/* HEADER */}
          <div>
            <h2 className="text-lg font-semibold mb-2 px-7 pt-5">
              État des Équipements
            </h2>
            <hr />
          </div>
          {/* BODY */}
          <div className="xl:flex justify-between pr-7">
            {/* CHART */}
            <div className="relative basis-3/5">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={equipmentEtats}
                    innerRadius={50}
                    outerRadius={60}
                    fill={primaryColor}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                  >
                    {equipmentEtats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getEtatColor(entry.name)}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center basis-2/5">
                <span className="font-bold text-xl">{totalEquipmentCount}</span>
              </div>
            </div>
            {/* LABELS */}
            <ul className="flex flex-col justify-around items-center xl:items-start py-5 gap-3">
              {equipmentEtats.map((entry, index) => (
                <li
                  key={`legend-${index}`}
                  className="flex items-center text-xs"
                >
                  <span
                    className="mr-2 w-3 h-3 rounded-full"
                    style={{ backgroundColor: getEtatColor(entry.name) }}
                  ></span>
                  {entry.name}: {entry.percentage}% ({getEtatDisplayText(entry)}
                  )
                  <span className="ml-1 text-gray-500">
                    (Équip: {entry.actifs}, Lic: {entry.licenses})
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {/* FOOTER */}
          <div>
            <div className="mt-3 flex justify-between items-center px-7 mb-4">
              <div className="pt-2">
                <p className="text-sm">Distribution par état</p>
              </div>
              <span className="flex items-center mt-2">
                <TrendingUp className="mr-2" color={primaryColor} />
                <span className="text-sm">
                  {totalActifs} équipements, {totalLicenses} licences
                </span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CardEtatEquipmentSummary;
