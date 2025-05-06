import { useGetActifsQuery, useGetEmployeesQuery } from "@/state/api";
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
} from "recharts";
import { getSelectedDatabase } from "@/utils/auth";

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

  const isLoading = actifLoading || employeeLoading;
  const isError = actifError || employeeError;

  // Calculate metrics when data is available - using quantity
  const assetMetrics = useMemo(() => {
    if (!actifs || !employees) return null;

    // Calculate total quantity of all equipment
    const totalQuantity = actifs.reduce(
      (total, actif) => total + (actif.quantity || 0),
      0
    );

    // Calculate exploited and unexploited equipment based on assignments
    let exploitedCount = 0;
    let unexploitedCount = 0;

    actifs.forEach((actif) => {
      const quantity = actif.quantity || 0;

      // If the asset has employees assigned or fournisseurs assigned
      const hasEmployees = actif.employees && actif.employees.length > 0;
      const hasFournisseurs =
        actif.fournisseurs && actif.fournisseurs.length > 0;
      const hasMultipleSuppliers =
        actif.multipleSuppliers !== undefined &&
        actif.multipleSuppliers.length > 0;
      const usesMultipleSuppliers = actif.useMultipleSuppliers === true;

      if (hasEmployees || hasFournisseurs || hasMultipleSuppliers) {
        // Count assigned quantities
        let assignedQuantity = 0;

        // Count employee assignments
        if (hasEmployees) {
          // Sum up all employee assignment quantities
          assignedQuantity += actif.employees.reduce(
            (sum, emp) => sum + (emp.quantity || 0),
            0
          );
        }

        if (hasFournisseurs && actif.fournisseurs) {
          assignedQuantity += actif.fournisseurs.reduce(
            (sum, fournisseur) => sum + (fournisseur.quantity || 0),
            0
          );
        }

        // If we have multipleSuppliers data, use that too
        if (
          hasMultipleSuppliers &&
          usesMultipleSuppliers &&
          actif.multipleSuppliers
        ) {
          assignedQuantity += actif.multipleSuppliers.reduce(
            (sum, supplier) => sum + (supplier.quantity || 0),
            0
          );
        }
        // If no explicit assignments via multipleSuppliers but there is a direct fournisseur property,
        // and no other assignments, count that as well
        else if (
          !usesMultipleSuppliers &&
          actif.fournisseur &&
          actif.quantity > 0 &&
          !hasEmployees &&
          !hasFournisseurs &&
          !hasMultipleSuppliers
        ) {
          // Count the direct fournisseur reference as an assignment
          assignedQuantity += actif.quantity;
        }

        // Exploited count is the assigned quantity (capped at total quantity)
        const exploitedForThisActif = Math.min(assignedQuantity, quantity);
        exploitedCount += exploitedForThisActif;

        // Unexploited is the remainder of quantity
        unexploitedCount += quantity - exploitedForThisActif;
      } else {
        // If no assignments, all quantity is unexploited
        unexploitedCount += quantity;
      }
    });

    return [
      { name: "Equipements total", value: totalQuantity },
      { name: "Equipements exploités", value: exploitedCount },
      { name: "Equipements non exploités", value: unexploitedCount },
    ];
  }, [actifs, employees]);

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
                    ? `${(
                        (assetMetrics[1].value / assetMetrics[0].value) *
                        100
                      ).toFixed(2)}% exploités`
                    : "0% exploités"}
                </span>
              </div>
            </div>

            {/* CHART */}
            <ResponsiveContainer width="100%" height={350} className="px-7">
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
                  formatter={(value) => [
                    `${value} unités`,
                    "Nombre d'equipements",
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  fill={primaryColor}
                  barSize={60}
                  radius={[10, 10, 0, 0]}
                />
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
                      {(
                        (assetMetrics[1].value / assetMetrics[0].value) *
                        100
                      ).toFixed(2)}
                      %
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
