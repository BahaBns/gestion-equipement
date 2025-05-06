import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Building,
  HardDrive,
  Laptop,
} from "lucide-react";
import {
  useGetActifsQuery,
  useGetEmployeesQuery,
  useGetLicensesQuery,
  useGetActifAssignmentsQuery,
} from "@/state/api";

const StatsRow = () => {
  const { data: actifs, isLoading: actifLoading } = useGetActifsQuery();
  const { data: employees, isLoading: employeeLoading } =
    useGetEmployeesQuery();
  const { data: licenses, isLoading: licenseLoading } = useGetLicensesQuery();
  const { data: assignments, isLoading: assignmentsLoading } =
    useGetActifAssignmentsQuery();

  const [stats, setStats] = useState([
    {
      title: "Total Hardware",
      value: 0,
      change: "0%",
      isPositive: true,
      icon: HardDrive,
    },
    {
      title: "Total Software",
      value: 0,
      change: "0%",
      isPositive: true,
      icon: Laptop,
    },
    {
      title: "Hardware Assigné",
      value: 0,
      change: "0%",
      isPositive: true,
      icon: Users,
    },
    {
      title: "Software Assigné",
      value: 0,
      change: "0%",
      isPositive: true,
      icon: Package,
    },
    {
      title: "Employees",
      value: 0,
      change: "0%",
      isPositive: true,
      icon: Building,
    },
  ]);

  useEffect(() => {
    if (actifs && employees && licenses) {
      // Debug: check data structure
      if (actifs.length > 0) {
        console.log("Example actif properties:", Object.keys(actifs[0]));
        console.log("Example actif marqueObj:", actifs[0].marqueObj);
        console.log("Example actif modeleObj:", actifs[0].modeleObj);
      }

      // Get current date and create date for previous month
      const currentDate = new Date();
      const previousMonthDate = new Date();
      previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

      // Calculate asset changes
      const calculateChange = (current : any, previous : any) => {
        if (previous === 0) return current > 0 ? "+100%" : "0%";
        const changePercent = ((current - previous) / previous) * 100;
        const formattedChange = changePercent.toFixed(1);
        return changePercent >= 0
          ? `+${formattedChange}%`
          : `${formattedChange}%`;
      };

      // 1. Calculate total hardware (sum of quantities)
      const totalHardware = Array.isArray(actifs)
        ? actifs.reduce((sum, actif) => sum + (actif.quantity || 0), 0)
        : 0;

      // For previous month comparison, check localStorage or use a reasonable default
      const previousMonthKey = `stats_${previousMonthDate.getMonth()}_${previousMonthDate.getFullYear()}`;
      let prevStats = {
        totalHardware: 0,
        totalSoftware: 0,
        assignedHardwareCount: 0,
        assignedSoftwareCount: 0,
        employeesCount: 0,
      };

      try {
        const savedStats = localStorage.getItem(previousMonthKey);
        if (savedStats) {
          prevStats = JSON.parse(savedStats);
        }
      } catch (e) {
        console.error("Error parsing localStorage stats:", e);
      }

      const hardwareChange = calculateChange(
        totalHardware,
        prevStats.totalHardware
      );

      // 2. Calculate total software (sum of license quantities)
      const totalSoftware = Array.isArray(licenses)
        ? licenses.reduce(
            (sum, license) => sum + (license.licenseQuantity || 0),
            0
          )
        : 0;

      const softwareChange = calculateChange(
        totalSoftware,
        prevStats.totalSoftware
      );

      // 3. Calculate assigned hardware (sum of assigned quantities) - FIXED VERSION
      let assignedHardwareCount = 0;

      // Count only quantities of hardware explicitly assigned to employees
      if (Array.isArray(actifs)) {
        actifs.forEach((actif) => {
          // Only count employee assignments
          if (actif.employees && actif.employees.length > 0) {
            // Sum employee assigned quantities
            const employeeAssignments = actif.employees.reduce(
              (sum, emp) => sum + (emp.quantity || 0),
              0
            );
            assignedHardwareCount += employeeAssignments;
          }

          // We don't count supplier assignments as "assigned" hardware
          // This is the key change - removing the supplier/fournisseur counting
        });
      }

      const assignedHardwareChange = calculateChange(
        assignedHardwareCount,
        prevStats.assignedHardwareCount
      );

      // 4. Calculate assigned software
      let assignedSoftwareCount = 0;
      if (Array.isArray(licenses)) {
        licenses.forEach((license) => {
          if (license.employees && license.employees.length > 0) {
            // Sum assigned license quantities
            const licenseAssignments = license.employees.reduce(
              (sum, emp) => sum + (emp.quantity || 0),
              0
            );
            assignedSoftwareCount += licenseAssignments;
          }
        });
      }

      const assignedSoftwareChange = calculateChange(
        assignedSoftwareCount,
        prevStats.assignedSoftwareCount
      );

      // 5. Employees count
      const employeesCount = Array.isArray(employees) ? employees.length : 0;

      const employeeChange = calculateChange(
        employeesCount,
        prevStats.employeesCount
      );

      // Save current stats for next month's comparison
      const currentMonthKey = `stats_${currentDate.getMonth()}_${currentDate.getFullYear()}`;
      localStorage.setItem(
        currentMonthKey,
        JSON.stringify({
          totalHardware,
          totalSoftware,
          assignedHardwareCount,
          assignedSoftwareCount,
          employeesCount,
        })
      );

      setStats([
        {
          title: "Hardware Total",
          value: totalHardware,
          change: hardwareChange,
          isPositive: parseFloat(hardwareChange) >= 0,
          icon: HardDrive,
        },
        {
          title: "Software Total",
          value: totalSoftware,
          change: softwareChange,
          isPositive: parseFloat(softwareChange) >= 0,
          icon: Laptop,
        },
        {
          title: "Hardware Assigné",
          value: assignedHardwareCount,
          change: assignedHardwareChange,
          isPositive: parseFloat(assignedHardwareChange) >= 0,
          icon: Users,
        },
        {
          title: "Software Assigné",
          value: assignedSoftwareCount,
          change: assignedSoftwareChange,
          isPositive: parseFloat(assignedSoftwareChange) >= 0,
          icon: Package,
        },
        {
          title: "Employees",
          value: employeesCount,
          change: employeeChange,
          isPositive: parseFloat(employeeChange) >= 0,
          icon: Building,
        },
      ]);
    }
  }, [actifs, employees, licenses, assignments]);

  // Loading state
  if (actifLoading || employeeLoading || licenseLoading || assignmentsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm p-4 h-24 animate-pulse"
          >
            <div className="bg-gray-200 h-3 w-1/2 mb-2 rounded"></div>
            <div className="bg-gray-300 h-6 w-16 mb-2 rounded"></div>
            <div className="bg-gray-200 h-3 w-12 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm p-4 flex flex-col"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">
              {stat.title}
            </span>
            <stat.icon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold mb-1">{stat.value}</div>
          <div
            className={`text-sm flex items-center ${
              stat.isPositive ? "text-blue-500" : "text-red-500"
            }`}
          >
            {stat.isPositive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsRow;