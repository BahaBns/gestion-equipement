"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation, useRequestPasswordResetMutation } from "@/state/api";
import { setAuthToken, debugTokenStatus } from "@/utils/auth";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState(""); // For login (email)
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // General login/form error
  const [message, setMessage] = useState(""); // For success/info messages (e.g., after requesting password reset)
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();

  // State for forgot password
  const [view, setView] = useState<"login" | "forgotPassword">("login"); // 'login', 'forgotPassword'
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [
    requestPasswordReset,
    {
      isLoading: isRequestingPasswordReset,
      isSuccess: isPasswordResetRequested,
    },
  ] = useRequestPasswordResetMutation();

  // Existing state variables for the two-step login process
  const [loginStep, setLoginStep] = useState(1); // 1 for credentials, 2 for database selection
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [authToken, setTemporaryAuthToken] = useState("");

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      console.log("Attempting login with email:", username);
      const response = await login({ username, password }).unwrap(); // username here is the email
      console.log("Login response:", response);

      if (response.token) {
        setTemporaryAuthToken(response.token);
        console.log("Credentials validated successfully");
        setLoginStep(2); // Move to database selection step
      } else {
        setError("No token received after login.");
      }
    } catch (err) {
      console.error("Login error:", err);
      const apiError = err as { data?: { message?: string }; status?: number };
      setError(
        apiError.data?.message || "Informations de connexion incorrectes."
      );
    }
  };

  const handleDatabaseSelect = async (database: string) => {
    setSelectedDatabase(database);
    try {
      console.log("Selecting database:", database);

      const response = await fetch(
        "api/auth/select-database",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: authToken,
            selectedDatabase: database,
          }),
          credentials: "include", // Important: include credentials for cookies
        }
      );

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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await requestPasswordReset({
        email: forgotPasswordEmail,
      }).unwrap();
      setMessage(
        response.message ||
          "Si votre email est enregistré, vous recevrez un lien de réinitialisation."
      );
      // Optionally, clear the email field or switch view back to login after a delay
      // setForgotPasswordEmail("");
      // setTimeout(() => setView("login"), 5000); // Go back to login after 5s
    } catch (err) {
      console.error("Forgot password error:", err);
      const apiError = err as { data?: { message?: string }; status?: number };
      setError(
        apiError.data?.message || "Une erreur est survenue. Veuillez réessayer."
      );
    }
  };

  // Render different forms based on login step and view
  if (loginStep === 1) {
    if (view === "login") {
      // Step 1, View 1: Username and Password form
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
                className="mb-4 rounded-md p-3 text-sm"
                style={{
                  backgroundColor: "#fee2e2",
                  borderColor: "#f87171",
                  color: "#b91c1c",
                }}
              >
                {error}
              </div>
            )}
            {message && (
              <div
                className="mb-4 rounded-md p-3 text-sm"
                style={{
                  backgroundColor: "#d1fae5", // Green for success
                  borderColor: "#6ee7b7",
                  color: "#065f46",
                }}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="username" // Should be email, but using 'username' for consistency with existing req.body
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Adresse e-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    {/* Email Icon */}
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
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    type="email" // Changed to type email for better UX
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 block w-full px-4 py-2 border rounded-md"
                    style={{
                      borderColor: "#d1d5db",
                      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    }}
                    placeholder="votre.email@example.com"
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
                    {/* Lock Icon */}
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

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setView("forgotPassword");
                    setError("");
                    setMessage("");
                  }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: "#007857" }}
                >
                  Mot de passe oublié ?
                </button>
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
                disabled={isLoginLoading}
              >
                {isLoginLoading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      );
    } else if (view === "forgotPassword") {
      // Step 1, View 2: Forgot Password form
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
                Mot de passe oublié
              </h1>
              <p className="text-gray-600">
                Entrez votre adresse e-mail pour recevoir un lien de
                réinitialisation.
              </p>
            </div>

            {error && (
              <div
                className="mb-4 rounded-md p-3 text-sm"
                style={{
                  backgroundColor: "#fee2e2",
                  borderColor: "#f87171",
                  color: "#b91c1c",
                }}
              >
                {error}
              </div>
            )}
            {message && ( // Display success message here too if password reset was requested
              <div
                className="mb-4 rounded-md p-3 text-sm"
                style={{
                  backgroundColor: isPasswordResetRequested
                    ? "#d1fae5"
                    : "#e0f2fe", // Green for success, blue for info
                  borderColor: isPasswordResetRequested ? "#6ee7b7" : "#7dd3fc",
                  color: isPasswordResetRequested ? "#065f46" : "#0c4a6e",
                }}
              >
                {message}
              </div>
            )}

            {!isPasswordResetRequested && ( // Only show form if reset hasn't been successfully requested yet
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="forgotPasswordEmail"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      {/* Email Icon */}
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
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="forgotPasswordEmail"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="pl-10 block w-full px-4 py-2 border rounded-md"
                      style={{
                        borderColor: "#d1d5db",
                        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                      }}
                      placeholder="votre.email@example.com"
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
                  disabled={isRequestingPasswordReset}
                >
                  {isRequestingPasswordReset
                    ? "Envoi en cours..."
                    : "Envoyer le lien de réinitialisation"}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setView("login");
                  setError("");
                  setMessage("");
                }}
                className="text-sm font-medium hover:underline"
                style={{ color: "#007857" }}
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      );
    }
  } else {
    // Step 2: Database selection (existing code)
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "#f3f4f6" }}
      >
        <div
          className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md transition-all duration-200"
          // ... (rest of the database selection JSX, no changes needed here for forgot password) ...
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

          {error && ( // Display error from database selection if any
            <div
              className="mb-6 rounded-md p-4"
              style={{
                backgroundColor: "#fee2e2",
                borderColor: "#f87171",
                color: "#b91c1c",
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => handleDatabaseSelect("insight")}
              className="w-full flex justify-center py-3 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200"
              // ... styles ...
            >
              Insight Times
            </button>

            <button
              onClick={() => handleDatabaseSelect("lagom")}
              className="w-full flex justify-center py-3 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200"
              // ... styles ...
            >
              Lagom Consulting
            </button>

            <button
              onClick={() => {
                setLoginStep(1);
                setError("");
                setMessage("");
              }} // Go back to credential step (login view by default)
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium"
              // ... styles ...
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }
  return null; // Should not happen if logic is correct
}
