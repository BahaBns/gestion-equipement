"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/state/api";
import { setAuthToken, debugTokenStatus } from "@/utils/auth";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();

  // New state variables for the two-step login process
  const [loginStep, setLoginStep] = useState(1); // 1 for credentials, 2 for database selection
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [authToken, setTemporaryAuthToken] = useState(""); // Store token temporarily between steps

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      console.log("Attempting login...");
      const response = await login({ username, password }).unwrap();
      console.log("Login response:", response);

      if (response.token) {
        // Store token temporarily (don't set in auth yet)
        setTemporaryAuthToken(response.token);

        console.log("Credentials validated successfully");
        // Move to database selection step
        setLoginStep(2);
      } else {
        setError("No token received");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Information incorrects");
    }
  };

  const handleDatabaseSelect = async (database: string) => {
    setSelectedDatabase(database);
    try {
      console.log("Selecting database:", database);

      const response = await fetch("/api/auth/select-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: authToken,
          selectedDatabase: database,
        }),
        credentials: "include", // Important: include credentials for cookies
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        // IMPORTANT: Store the token with the database selection
        setAuthToken(data.token, database);
        
        // Check token status after setting
        setTimeout(() => {
          const tokenStatus = debugTokenStatus();
          console.log("Token status after setting:", tokenStatus);
          
          // If token is properly set, navigate to dashboard
          if (tokenStatus.cookie) {
            console.log("Token set successfully - redirecting to dashboard");
            // Use a temporary flag to bypass middleware check during transition
            router.push("/dashboard?bypassAuth=true");
          } else {
            console.log("Token not properly set - using window.location");
            // Fallback: Use window.location for hard navigation
            window.location.href = "/dashboard?bypassAuth=true";
          }
        }, 100);
      } else {
        throw new Error(data.message || "Database selection failed");
      }
    } catch (err) {
      console.error("Database selection error:", err);
      setError(err instanceof Error ? err.message : "Error selecting database");
    }
  };

  // Render different forms based on login step
  if (loginStep === 1) {
    // Step 1: Username and Password form
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "#f3f4f6" }}
      >
        <div
          className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md transition-all duration-200"
          style={{
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bonjour</h1>
            <p className="text-gray-600">Veuillez vous connecter</p>
          </div>

          {error && (
            <div
              className="mb-6 rounded-md p-4"
              style={{
                backgroundColor: "#fee2e2",
                borderColor: "#f87171",
                color: "#b91c1c",
              }}
            >
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleCredentialsSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom d&apos;utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 block w-full px-4 py-2 border rounded-md"
                  style={{
                    borderColor: "#d1d5db",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  }}
                  placeholder="votre nom d'utilisateur"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full px-4 py-2 border rounded-md"
                  style={{
                    borderColor: "#d1d5db",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  }}
                  placeholder="Votre mot de passe"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-200"
              style={{
                color: "#FFFFFF",
                backgroundColor: "#007857",
                boxShadow:
                  "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#006745")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#007857")
              }
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3 "
                    style={{ color: "#FFFFFF" }}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connexion...
                </div>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  } else {
    // Step 2: Database selection
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "#f3f4f6" }}
      >
        <div
          className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md transition-all duration-200"
          style={{
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sélectionnez une espace
            </h1>
            <p className="text-gray-600">
              Veuillez choisir l&apos;espace à laquelle vous souhaitez vous
              connecter
            </p>
          </div>

          {error && (
            <div
              className="mb-6 rounded-md p-4"
              style={{
                backgroundColor: "#fee2e2",
                borderColor: "#f87171",
                color: "#b91c1c",
              }}
            >
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => handleDatabaseSelect("insight")}
              className="w-full flex justify-center py-3 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200"
              style={{
                backgroundColor: "#f3f4f6",
                borderColor: "#d1d5db",
                color: "#111827",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#e5e7eb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
            >
              Insight Times
            </button>

            <button
              onClick={() => handleDatabaseSelect("lagom")}
              className="w-full flex justify-center py-3 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200"
              style={{
                backgroundColor: "#f3f4f6",
                borderColor: "#d1d5db",
                color: "#111827",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#e5e7eb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
            >
              Lagom Consulting
            </button>

            <button
              onClick={() => setLoginStep(1)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-200"
              style={{
                color: "#6B7280",
                backgroundColor: "#ffffff",
                borderColor: "#d1d5db",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
              }}
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }
}
