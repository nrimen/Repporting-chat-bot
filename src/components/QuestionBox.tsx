import { useState, useRef, useEffect } from "react";

type Props = {
  onSubmit: (question: string, shopId: string) => void;
  isLoading: boolean;
};

const predefinedQuestions = [
  "Quel est le chiffre daffaires du 1er au 15 janvier 2024",
  "Quels sont les chiffres de vente du dernier trimestre ?",
  "Comparaison des ventes entre les deux derniers mois.",
  "Quel est le chiffre d'affaires par produit ?",
  "Analyse du trafic client pour la dernière semaine.",
  "Statistiques de conversion par canal marketing.",
];

type Shop = {
  customerId: string;
};

export function QuestionBox({ onSubmit, isLoading }: Props) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function fetchShops() {
      try {
        const res = await fetch("/api/shops");
        if (!res.ok) throw new Error("Erreur lors de la récupération des boutiques");
        const data: Shop[] = await res.json();
        setShops(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchShops();
  }, []);

  const handleShopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setShopId(e.target.value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setQuestion(value);
    if (value.trim()) {
      const suggestions = predefinedQuestions.filter((q) =>
        q.toLowerCase().startsWith(value.toLowerCase())
      );
      setFilteredSuggestions(suggestions);
    } else {
      setFilteredSuggestions([]);
    }
  };

  const handleSelect = (suggestion: string) => {
    setQuestion(suggestion);
    setFilteredSuggestions([]);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId.trim()) {
      setError("Veuillez choisir une boutique.");
      return;
    }
    if (!question.trim()) {
      setError("Veuillez entrer une question.");
      return;
    }
    setError("");
    onSubmit(question, shopId);
    setQuestion("");
    setShopId("");
    setFilteredSuggestions([]);
  };

  return (
    <section className="col-span-1 lg:col-span-1 border border-gray-300 rounded-2xl p-6 overflow-auto bg-white shadow-xl max-h-[600px]">
      <h2 className="font-semibold mb-6 text-gray-900 text-xl border-b border-indigo-300 pb-2">
        Question :
      </h2>

      {isLoading ? (
        <div className="text-indigo-600 font-medium animate-pulse mt-2 flex items-center space-x-2 justify-center h-[300px]">
          <svg
            className="w-5 h-5 animate-spin text-indigo-500"
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
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
          <span>Traitement en cours...</span>
        </div>
      ) : (
        <>
          <label className="block mb-3 font-medium text-gray-700" htmlFor="shopSelect">
            Choisissez une boutique
          </label>
          <select
            id="shopSelect"
            className="mb-6 w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            onChange={handleShopChange}
            value={shopId}
          >
            <option value="">-- Sélectionnez une boutique --</option>
            {shops.map((shop) => (
              <option key={shop.customerId} value={shop.customerId}>
                {shop.customerId}
              </option>
            ))}
          </select>

          <select
            className="mb-6 border border-gray-300 rounded-lg p-3 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition w-full"
            onChange={(e) => handleSelect(e.target.value)}
            value=""
            aria-label="Choisissez une question prédéfinie"
          >
            <option value="" disabled>
              Choisissez une question ...
            </option>
            {predefinedQuestions.map((q, i) => (
              <option key={i} value={q}>
                {q}
              </option>
            ))}
          </select>

          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef}
              rows={5}
              className="w-full border border-gray-300 rounded-lg p-4 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
              value={question}
              onChange={handleChange}
              placeholder="Tapez votre question ici..."
              aria-label="Zone de texte pour poser une question"
            />
            {filteredSuggestions.length > 0 && (
              <ul className="absolute z-20 top-full mt-2 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-44 overflow-auto">
                {filteredSuggestions.map((suggestion, i) => (
                  <li
                    key={i}
                    onClick={() => handleSelect(suggestion)}
                    className="p-3 hover:bg-indigo-100 cursor-pointer text-sm"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(suggestion);
                      }
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}

            {error && (
              <p className="text-red-600 mt-4 font-semibold">{error}</p>
            )}

            <button
              type="submit"
              className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              Envoyer
            </button>
          </form>
        </>
      )}
    </section>
  );
}
