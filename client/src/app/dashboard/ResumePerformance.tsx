import { useGetActifsQuery, useGetEmployeesQuery, useGetLicensesQuery } from "@/state/api";
import React, { useMemo, useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Cell,
} from "recharts";
import { getSelectedDatabase } from "@/utils/auth";

// Define interfaces for type safety
interface AssetMetric {
  name: string;
  value: number;
  percentage: string;
  display: string;
}

const CardSalesSummary = () => {
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
  
  // Define theme colors based on selected database
  const primaryColor =
    databaseName.toLowerCase() === "insight" ? "#007857" : "blue"; // Green vs Blue
  const primaryTextColorClass =
    databaseName.toLowerCase() === "insight"
      ? "text-green-500"
      : "text-blue-500";
  
  const {
    data: actifs,
    isLoading: actifLoading,
    isError: actifError,
  } = useGetActifsQuery();
  const {
    data: employees,
    isLoading: employeeLoading,
    isError: employeeError,
  } = useGetEmployeesQuery();
  const {
    data: licenses,
    isLoading: licenseLoading,
    isError: licenseError,
  } = useGetLicensesQuery();
  
  const isLoading = actifLoading || employeeLoading || licenseLoading;
  const isError = actifError || employeeError || licenseError;
  
  // Helper function to calculate assigned quantity for an actif
  const calculateAssignedQuantity = (actif: any): number => {
    if (!actif.employees || actif.employees.length === 0) return 0;
    return actif.employees.reduce(
      (total: number, emp: any) => total + (emp.quantity || 0),
      0
    );
  };
  
  // Helper function to calculate available quantity for an actif
  const calculateLibreQuantity = (actif: any): number => {
    const totalQuantity = actif.quantity || 0;
    const assignedQuantity = calculateAssignedQuantity(actif);
    return Math.max(0, totalQuantity - assignedQuantity);
  };
  
  // Calculate metrics when data is available - using quantity
  const assetMetrics = useMemo(() => {
    if (!actifs || !employees || !licenses) return null;
    
    // Calculate total quantity of all actifs
    const totalActifQuantity = actifs.reduce(
      (total, actif) => total + (actif.quantity || 0),
      0
    );
    
    // Calculate total quantity of all licenses
    const totalLicenseQuantity = licenses.reduce(
      (total, license) => total + (license.licenseQuantity || 0),
      0
    );
    
    const totalQuantity = totalActifQuantity + totalLicenseQuantity;
    
    // Calculate exploited and unexploited equipment based on assignments
    let exploitedCount = 0;
    let unexploitedCount = 0;
    
    // Process actifs
    actifs.forEach((actif) => {
      const assignedQuantity = calculateAssignedQuantity(actif);
      const availableQuantity = calculateLibreQuantity(actif);
      exploitedCount += assignedQuantity;
      unexploitedCount += availableQuantity;
    });
    
    // Process licenses
    licenses.forEach((license) => {
      if (license.employees && license.employees.length > 0) {
        const assignedLicenseQty = license.employees.reduce(
          (sum: number, emp: any) => sum + (emp.quantity || 0),
          0
        );
        exploitedCount += assignedLicenseQty;
        unexploitedCount += license.licenseQuantity - assignedLicenseQty;
      } else {
        unexploitedCount += license.licenseQuantity;
      }
    });
    
    // Calculate percentages
    const exploitedPercentage = totalQuantity > 0
      ? (exploitedCount / totalQuantity * 100).toFixed(1)
      : "0.0";
    const unexploitedPercentage = totalQuantity > 0
      ? (unexploitedCount / totalQuantity * 100).toFixed(1)
      : "0.0";
    
    // Create display text
    const exploitedDisplay = `${exploitedCount} équipement${exploitedCount > 1 ? 's' : ''} exploité${exploitedCount > 1 ? 's' : ''}`;
    const unexploitedDisplay = `${unexploitedCount} équipement${unexploitedCount > 1 ? 's' : ''} non exploité${unexploitedCount > 1 ? 's' : ''}`;
    
    return [
      {
        name: "Equipements total",
        value: totalQuantity,
        percentage: "100.0",
        display: `${totalQuantity} équipement${totalQuantity > 1 ? 's' : ''} total`
      },
      {
        name: "Equipements exploités",
        value: exploitedCount,
        percentage: exploitedPercentage,
        display: exploitedDisplay
      },
      {
        name: "Equipements non exploités",
        value: unexploitedCount,
        percentage: unexploitedPercentage,
        display: unexploitedDisplay
      },
    ];
  }, [actifs, employees, licenses]);
  
  // Create a summary for the exploitation data
  const exploitationSummary = useMemo(() => {
    if (!assetMetrics) return [];
    return [
      {
        name: "Exploités",
        value: assetMetrics[1].value,
        percentage: assetMetrics[1].percentage,
        display: assetMetrics[1].display
      },
      {
        name: "Non exploités",
        value: assetMetrics[2].value,
        percentage: assetMetrics[2].percentage,
        display: assetMetrics[2].display
      }
    ];
  }, [assetMetrics]);
  
  if (isError) {
    return <div className="m-5">Échec de la récupération des données</div>;
  }
  
  return (
    <div className="row-span-3 xl:row-span-6 bg-white shadow-md rounded-2xl flex flex-col justify-between">
      {isLoading ? (
        <div className="m-5">Chargement...</div>
      ) : (
        <>
          {/* HEADER */}
          <div>
            <h2 className="text-lg font-semibold mb-2 px-7 pt-5">
              Résumé des equipements
            </h2>
            <hr />
          </div>
          
          {/* BODY */}
          <div>
            {/* BODY HEADER */}
            <div className="flex justify-between items-center mb-5 px-7 mt-5">
              <div className="text-lg font-medium">
                <p className="text-xs text-gray-400">
                  Nombre total d`equipements
                </p>
                <span className="text-2xl font-extrabold">
                  {assetMetrics?.[0]?.value || 0}
                </span>
                <span className={`${primaryTextColorClass} text-sm ml-2`}>
                  {assetMetrics && assetMetrics[0]?.value > 0
                    ? `${assetMetrics[1].percentage}% exploités`
                    : "0% exploités"}
                </span>
              </div>
            </div>
            
            {/* EXPLOITATION SUMMARY */}
            <div className="flex flex-col md:flex-row mb-5">
              <div className="flex flex-col w-full px-7 space-y-4">
                {exploitationSummary.map((entry, index) => (
                  <div
                    key={`legend-${index}`}
                    className="flex items-center"
                  >
                    <span
                      className="mr-3 w-4 h-4 rounded-full inline-block"
                      style={{
                        backgroundColor: entry.name === "Exploités"
                          ? (databaseName.toLowerCase() === "insight" ? "#007857" : "#0088FE")
                          : "#FF8042"
                      }}
                    ></span>
                    <span className="text-base font-medium">
                      {entry.name}: {entry.percentage}% ({entry.display})
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* BAR CHART */}
            <ResponsiveContainer width="100%" height={250} className="px-7 mt-5">
              <BarChart
                data={assetMetrics || []}
                margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis
                  tick={{ fontSize: 12, dx: -1 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value, name, props) => {
                    // Find the corresponding assetMetric to get the display text
                    const metric = assetMetrics?.find(m => m.value === value);
                    return [metric?.display || `${value} unités`, "Nombre d'equipements"];
                  }}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  fill={primaryColor}
                  barSize={60}
                  radius={[10, 10, 0, 0]}
                >
                  {assetMetrics && assetMetrics.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 1
                        ? (databaseName.toLowerCase() === "insight" ? "#007857" : "#0088FE")
                        : index === 2
                          ? "#FF8042"
                          : primaryColor}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* FOOTER */}
          <div>
            <div className="flex justify-between items-center mt-2 text-sm px-7 mb-4">
              {assetMetrics && assetMetrics[0]?.value > 0 ? (
                <div className="flex justify-between w-full">
                  <p className="text-sm">
                    Taux d`exploitation:{" "}
                    <span className="font-bold">
                      {assetMetrics[1].percentage}%
                    </span>
                  </p>
                  <p className="text-sm">
                    Unités totales:{" "}
                    <span className="font-bold">{assetMetrics[0].value}</span> |
                    exploités:{" "}
                    <span className={`font-bold ${primaryTextColorClass}`}>
                      {assetMetrics[1].value}
                    </span>{" "}
                    | Non exploités:{" "}
                    <span className="font-bold text-gray-500">
                      {assetMetrics[2].value}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="w-full text-center text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CardSalesSummary;
