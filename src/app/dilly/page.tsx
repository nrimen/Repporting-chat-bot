"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { QuestionBox } from "@/components/QuestionBox";
import { ResponseBox } from "@/components/ResponseBox";
import LogStream from "@/components/LogBox";

export default function DillyPage() {
  const [userEmail, setUserEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<string[][] | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email || "");
        setLoadingUser(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // useEffect(() => {
  //   let isMounted = true;

  //   async function streamLogs() {
  //     try {
  //       const res = await fetch("http://dilly-server:8001/logs");
  //       if (!res.ok) {
  //         console.error("Erreur lors de la récupération des logs:", await res.text());
  //         return;
  //       }

  //       const reader = res.body?.getReader();
  //       if (!reader) {
  //         console.error("Le flux ReadableStream n'est pas supporté");
  //         return;
  //       }

  //       const decoder = new TextDecoder();
  //       let buffer = "";

  //       while (isMounted) {
  //         const { done, value } = await reader.read();
  //         if (done) break;

  //         buffer += decoder.decode(value, { stream: true });
  //         const lines = buffer.split("\n");
  //         buffer = lines.pop() || "";
  //         if (lines.length > 0) {
  //           setLogs((prev) => [...prev, ...lines].slice(-200));
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Erreur lors du streaming des logs:", error);
  //     }
  //   }

  //   streamLogs();

  //   return () => {
  //     isMounted = false;
  //   };
  // }, []);

  const handleQuestionSubmit = async (question: string, shopId: string) => {
    try {
      console.log("Question soumise:", question);
      console.log("Shop ID:", shopId);
      setIsLoading(true);

      const payload = { prompt: question, shop_id: shopId };

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erreur de réponse API:", errorText);
        throw new Error("Erreur lors de l’appel à l’API.");
      }

      const data = await res.json();
      setResponseData(data.response);
      setLogs((prev) => [data.log, ...prev]);
    } catch (err) {
      console.error("Exception dans handleQuestionSubmit:", err);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    sessionStorage.clear();
    setUserEmail("");
    setResponseData(null);
    setLogs([]);
    router.push("/login");
  };

  if (loadingUser) return <p className="p-6">Chargement utilisateur...</p>;

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Bonjour, {userEmail}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Déconnexion
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuestionBox onSubmit={handleQuestionSubmit} isLoading={isLoading} />
        <ResponseBox response={responseData} />
        <LogStream />
      </div>
    </main>
  );
}
