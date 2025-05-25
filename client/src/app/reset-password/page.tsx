"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useResetPasswordMutation } from "@/state/api"; // Make sure this path is correct
import Link from "next/link";

// A wrapper component to handle useSearchParams, as it needs to be used in a Client Component wrapped by Suspense
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [resetPassword, { isLoading, isSuccess }] = useResetPasswordMutation();

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError("Aucun jeton de réinitialisation fourni ou jeton invalide.");
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Jeton de réinitialisation manquant.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const response = await resetPassword({ token, newPassword }).unwrap();
      setMessage(
        response.message ||
          "Votre mot de passe a été réinitialisé avec succès !"
      );
      // Optionally redirect after a delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      const apiError = err as { data?: { message?: string } };
      setError(
        apiError.data?.message ||
          "Échec de la réinitialisation du mot de passe. Le jeton est peut-être invalide ou a expiré."
      );
    }
  };

  if (!tokenFromUrl && !error) {
    // Still loading token or no token present initially
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "#f3f4f6" }}
      >
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (error && !token) {
    // If token was invalid from the start (e.g. not in URL)
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "#f3f4f6" }}
      >
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <Link href="/login" legacyBehavior>
            <a
              className="text-sm font-medium"
              style={{ color: "#007857", textDecoration: "underline" }}
            >
              Retour à la page de connexion
            </a>
          </Link>
        </div>
      </div>
    );
  }

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
            Réinitialiser le mot de passe
          </h1>
          <p className="text-gray-600">
            Veuillez entrer votre nouveau mot de passe.
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

        {!isSuccess &&
          token && ( // Only show form if not successfully reset and token is present
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nouveau mot de passe
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
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 block w-full px-4 py-2 border rounded-md"
                    style={{
                      borderColor: "#d1d5db",
                      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    }}
                    placeholder="Entrez le nouveau mot de passe"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirmer le nouveau mot de passe
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
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 block w-full px-4 py-2 border rounded-md"
                    style={{
                      borderColor: "#d1d5db",
                      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    }}
                    placeholder="Confirmez le nouveau mot de passe"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-200"
                style={{
                  color: "#FFFFFF",
                  backgroundColor: "#007857", // Same green as login
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
                {isLoading
                  ? "Réinitialisation..."
                  : "Réinitialiser le mot de passe"}
              </button>
            </form>
          )}

        {(isSuccess || (error && token)) && ( // Show back to login link if success or if there was an error but a token was present
          <div className="mt-6 text-center">
            <Link href="/login" legacyBehavior>
              <a
                className="text-sm font-medium"
                style={{ color: "#007857", textDecoration: "underline" }}
              >
                Retour à la page de connexion
              </a>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// To use useSearchParams, the page component must be wrapped in Suspense
// This is typically done in your layout or a parent component,
// but for a standalone page, you can wrap it here.
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Chargement...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
