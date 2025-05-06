"use client";

import React, { useState } from "react";
import Header from "@/app/(components)/Header";
import MarqueManager from "./component/MarqueManager";
import ModeleManager from "./component/ModeleManager";
import FournisseurManager from "./component/FournisseurManager";

type Tab = "marques" | "modeles" | "fournisseurs";

const Administration = () => {
  const [activeTab, setActiveTab] = useState<Tab>("marques");

  return (
    <div className="w-full">
      <Header name="Administration" />

      {/* Tabs navigation - responsive for mobile/desktop */}
      <div className="flex flex-col sm:flex-row border-b border-gray-200 mb-4">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "marques"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("marques")}
        >
          Marques
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "modeles"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("modeles")}
        >
          Modèles
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "fournisseurs"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("fournisseurs")}
        >
          Fournisseurs
        </button>
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === "marques" && <MarqueManager />}
        {activeTab === "modeles" && <ModeleManager />}
        {activeTab === "fournisseurs" && <FournisseurManager />}
      </div>
    </div>
  );
};

export default Administration;
