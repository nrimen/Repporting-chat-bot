"use client";

import { useState, useEffect } from "react";
import { auth } from "@/utils/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isValidString = (str: string) => str.trim().length > 0;

  const validatePassword = (pw: string) => {
    const lengthValid = pw.length >= 8;
    const hasUppercase = /[A-Z]/.test(pw);
    const hasLowercase = /[a-z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    return {
      lengthValid,
      hasUppercase,
      hasLowercase,
      hasNumber,
      isValid: lengthValid && hasUppercase && hasLowercase && hasNumber,
    };
  };

  const pwStrength = validatePassword(password);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false);
      if (user) router.push("/dilly");
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isValidString(name) || !isValidString(shop) || !isValidString(email)) {
      setError("Tous les champs doivent être valides.");
      return;
    }

    if (!pwStrength.isValid) {
      setError("Mot de passe non valide.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Erreur inconnue.");
    }
  };

  if (loading) {
    return (
      <p className="p-6 text-center text-gray-700 animate-pulse">Chargement...</p>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-gray-100">
      <section className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl mb-6 text-center text-gray-900 font-semibold">
          Créer un compte
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm animate-fade-in">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-gray-700 font-medium mb-1">
              Nom complet
            </label>
            <input
              id="name"
              type="text"
              placeholder="Votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-800
                focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label htmlFor="shop" className="block text-gray-700 font-medium mb-1">
              Nom de la boutique
            </label>
            <input
              id="shop"
              type="text"
              placeholder="Nom de votre shop"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-800
                focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-800
                focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 font-medium mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              placeholder="Min 8 caractères, majuscule, chiffre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-800
                focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />

            {/* Strength bar */}
            <div className="mt-2 h-2 rounded bg-gray-200 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  pwStrength.isValid
                    ? "bg-green-500 w-full"
                    : pwStrength.lengthValid
                    ? "bg-yellow-400 w-2/3"
                    : "bg-red-500 w-1/3"
                }`}
              />
            </div>

            {/* Hints */}
            <ul className="text-xs text-gray-600 mt-1 space-y-1">
              <li className={pwStrength.lengthValid ? "text-green-600" : ""}>
                - Au moins 8 caractères
              </li>
              <li className={pwStrength.hasUppercase ? "text-green-600" : ""}>
                - Une majuscule
              </li>
              <li className={pwStrength.hasLowercase ? "text-green-600" : ""}>
                - Une minuscule
              </li>
              <li className={pwStrength.hasNumber ? "text-green-600" : ""}>
                - Un chiffre
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={
              !isValidString(name) ||
              !isValidString(shop) ||
              !isValidString(email) ||
              !pwStrength.isValid
            }
            className={`w-full text-white py-3 rounded-md font-semibold transition ${
              pwStrength.isValid
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            S’inscrire
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          Vous avez déjà un compte ?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Connectez-vous
          </a>
        </p>
      </section>
    </main>
  );
}
