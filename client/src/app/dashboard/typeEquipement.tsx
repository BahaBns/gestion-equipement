import { TrendingUp } from "lucide-react";
import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  useGetActifsQuery,
  useGetLicensesQuery,
  useGetStatusesQuery,
} from "@/state/api";

// Define interfaces for type safety
interface StatusCount {
  actifs: number;
  licenses: number;
  total: number;
  assigned: number;
  available: number;
}

interface StatusData {
  name: string;
  value: number;
  actifs: number;
  licenses: number;
  assigned: number;
  available: number;
  percentage: string;
}

// Status colors interface with string index signature
interface StatusColorMap {
  [key: string]: string;
  "En service": string;
  "En maintenance": string;
  "Hors service": string;
  "En stock": string;
  Disponible: string;
  Réservé: string;
  Attribué: string;
  "En prêt": string;
  Expiré: string;
  Actif: string;
  Inactif: string;
  Autre: string;
}

// Status colors - you can adjust these as needed
const statusColors: StatusColorMap = {
  "En service": "#00C49F", // Green for active equipment
  "En maintenance": "#FFBB28", // Yellow for maintenance
  "Hors service": "#FF8042", // Orange for out of service
  "En stock": "#0088FE", // Blue for in stock
  Disponible: "#0088FE", // Blue for available
  Réservé: "#8884D8", // Purple for reserved
  Attribué: "#00C49F", // Green for assigned
  "En prêt": "#82CA9D", // Light green for borrowed
  Expiré: "#FF0000", // Red for expired licenses
  Actif: "#00C49F", // Green for active licenses
  Inactif: "#FF8042", // Orange for inactive licenses
  Autre: "#A0A0A0", // Gray for other statuses
};

const CardStatusEquipmentSummary = () => {
  // Use existing API hooks to fetch data
  const { data: actifs, isLoading: actifLoading } = useGetActifsQuery();
  const { data: licenses, isLoading: licenseLoading } = useGetLicensesQuery();
  const { data: statuses } = useGetStatusesQuery();

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

  // Calculate equipment by status
  const calculateEquipmentByStatus = (): StatusData[] => {
    if (!actifs || !licenses || !statuses) return [];

    // Initialize an object to store counts by status
    const statusCounts: Record<string, StatusCount> = {};

    // Group actifs by status and count, considering assignments
    actifs.forEach((actif) => {
      const statusName = actif.status?.name || "Non défini";
      if (!statusCounts[statusName]) {
        statusCounts[statusName] = {
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

      // Update status counts
      statusCounts[statusName].actifs += actif.quantity || 0;
      statusCounts[statusName].total += actif.quantity || 0;
      statusCounts[statusName].assigned += assignedQuantity;
      statusCounts[statusName].available += availableQuantity;
    });

    // Group licenses by status and count
    licenses.forEach((license) => {
      const statusName = license.status?.name || "Non défini";
      if (!statusCounts[statusName]) {
        statusCounts[statusName] = {
          actifs: 0,
          licenses: 0,
          total: 0,
          assigned: 0,
          available: 0,
        };
      }
      // Use licenseQuantity field for licenses
      statusCounts[statusName].licenses += license.licenseQuantity;
      statusCounts[statusName].total += license.licenseQuantity;

      // For licenses, we consider them all as "assigned" if they have employees
      // or "available" if they don't
      if (license.employees && license.employees.length > 0) {
        const assignedLicenseQuantity = license.employees.reduce(
          (sum: number, emp: any) => sum + (emp.quantity || 0),
          0
        );
        statusCounts[statusName].assigned += assignedLicenseQuantity;
        statusCounts[statusName].available +=
          license.licenseQuantity - assignedLicenseQuantity;
      } else {
        statusCounts[statusName].available += license.licenseQuantity;
      }
    });

    // Convert the object to array for Recharts
    const statusArray = Object.entries(statusCounts).map(([name, counts]) => ({
      name,
      value: counts.total,
      actifs: counts.actifs,
      licenses: counts.licenses,
      assigned: counts.assigned,
      available: counts.available,
      percentage: "0", // Will be calculated below
    }));

    // Sort by value (count) in descending order
    statusArray.sort((a, b) => Number(b.value) - Number(a.value));

    // Calculate total equipment count
    const totalCount = statusArray.reduce((sum, item) => sum + item.value, 0);

    // Calculate percentages for statuses
    return statusArray.map((status) => ({
      ...status,
      percentage: ((Number(status.value) / totalCount) * 100).toFixed(1),
    }));
  };

  // Calculate aggregate assigned vs available equipment
  const calculateAssignmentSummary = () => {
    if (!actifs || !licenses) return [];

    // Initialize counters
    let totalAssigned = 0;
    let totalAvailable = 0;
    let totalCount = 0;

    // Count assigned and available actifs
    actifs.forEach((actif) => {
      const assignedQty = calculateAssignedQuantity(actif);
      const availableQty = calculateLibreQuantity(actif);

      totalAssigned += assignedQty;
      totalAvailable += availableQty;
      totalCount += actif.quantity || 0;
    });

    // Count assigned and available licenses
    licenses.forEach((license) => {
      if (license.employees && license.employees.length > 0) {
        const assignedLicenseQty = license.employees.reduce(
          (sum: number, emp: any) => sum + (emp.quantity || 0),
          0
        );
        totalAssigned += assignedLicenseQty;
        totalAvailable += license.licenseQuantity - assignedLicenseQty;
      } else {
        totalAvailable += license.licenseQuantity;
      }
      totalCount += license.licenseQuantity;
    });

    // Create summary data
    return [
      {
        name: "Assigné",
        value: totalAssigned,
        actifs: actifs
          ? actifs.filter((a) => calculateAssignedQuantity(a) > 0).length
          : 0,
        licenses: licenses
          ? licenses.filter((l) => l.employees && l.employees.length > 0).length
          : 0,
        percentage: ((totalAssigned / totalCount) * 100).toFixed(1),
        display: `${totalAssigned} équipement${
          totalAssigned > 1 ? "s" : ""
        } assigné${totalAssigned > 1 ? "s" : ""}`,
      },
      {
        name: "Disponible",
        value: totalAvailable,
        actifs: actifs
          ? actifs.filter((a) => calculateLibreQuantity(a) > 0).length
          : 0,
        licenses: licenses
          ? licenses.filter(
              (l) =>
                !l.employees ||
                l.employees.length === 0 ||
                l.licenseQuantity >
                  l.employees.reduce((sum, emp) => sum + (emp.quantity || 0), 0)
            ).length
          : 0,
        percentage: ((totalAvailable / totalCount) * 100).toFixed(1),
        display: `${totalAvailable} équipement${
          totalAvailable > 1 ? "s" : ""
        } non assigné${totalAvailable > 1 ? "s" : ""}`,
      },
    ];
  };

  const equipmentStatuses = calculateEquipmentByStatus();
  const assignmentSummary = calculateAssignmentSummary();

  // Calculate total equipment count
  const totalActifs = actifs
    ? actifs.reduce((sum, actif) => sum + actif.quantity, 0)
    : 0;

  const totalLicenses = licenses
    ? licenses.reduce((sum, license) => sum + license.licenseQuantity, 0)
    : 0;

  const totalEquipmentCount = totalActifs + totalLicenses;

  // Get color for status - dynamically map colors based on available statuses
  const getStatusColor = (statusName: string): string => {
    // If we have a predefined color, use it
    if (statusName in statusColors) {
      return statusColors[statusName];
    }

    // Otherwise, generate a color based on the index of the status
    if (statuses) {
      const statusIndex = statuses.findIndex((s) => s.name === statusName);
      if (statusIndex >= 0) {
        const colorKeys = Object.keys(statusColors);
        const fallbackKey = colorKeys[statusIndex % colorKeys.length];
        return statusColors[fallbackKey] || "#A0A0A0";
      }
    }

    // Default fallback
    return "#A0A0A0";
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
              Statuts des Équipements
            </h2>
            <hr />
          </div>
          {/* BODY */}
          <div className="xl:flex justify-between pr-7">
            {/* CHART - Assignment distribution */}
            <div className="relative basis-3/5">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={assignmentSummary}
                    innerRadius={50}
                    outerRadius={60}
                    fill="#3182ce"
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                  >
                    <Cell key="assigned" fill="#00C49F" />{" "}
                    {/* Green for assigned */}
                    <Cell key="available" fill="#0088FE" />{" "}
                    {/* Blue for available */}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center basis-2/5">
                <span className="font-bold text-xl">{totalEquipmentCount}</span>
              </div>
            </div>
            {/* LABELS */}
            <ul className="flex flex-col justify-around items-center xl:items-start py-5 gap-3">
              {/* Assignment summary */}
              {assignmentSummary.map((entry, index) => (
                <li
                  key={`assignment-${index}`}
                  className="flex items-center text-xs font-medium"
                >
                  <span
                    className="mr-2 w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        entry.name === "Assigné" ? "#00C49F" : "#0088FE",
                    }}
                  ></span>
                  {entry.name}: {entry.percentage}% ({entry.display})
                </li>
              ))}
              {/* Status breakdown */}

            </ul>
          </div>
          {/* FOOTER */}
          <div>
            <div className="mt-3 flex justify-between items-center px-7 mb-4">
              <div className="pt-2">
                <p className="text-sm">Distribution par statut</p>
              </div>
              <span className="flex items-center mt-2">
                <TrendingUp className="mr-2 text-blue-500" />
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

export default CardStatusEquipmentSummary;
