"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Sidebar from "./components/Sidebar";
import MessageBubble from "./components/MessageBubble";
import ChatInput from "./components/ChatInput";
import { Menu, Download } from "lucide-react"; // <-- AJOUT DE DOWNLOAD
import { downloadReport } from "@/utils/downloadReport"; // <-- AJOUT DE L'UTILITAIRE

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean; 
  analysisContent?: string; 
}

const COLLAPSED_SIDEBAR_WIDTH_PX = 80;
const EXPANDED_SIDEBAR_WIDTH_PX = 288;

export default function ChatPage() {
  const [chatHistory, setChatHistory] = useState<Message[][]>([[]]);
  const [currentChatIndex, setCurrentChatIndex] = useState<number>(0);
  const [sidebarTitles, setSidebarTitles] = useState<string[]>([]);

  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentMessages = useMemo(
    () => chatHistory[currentChatIndex] || [],
    [chatHistory, currentChatIndex]
  );
  const hasMessages = currentMessages.length > 0;

  const [messages, setMessages] = useState<Message[]>(currentMessages);

  useEffect(() => {
    setMessages(currentMessages);
  }, [currentMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateChatState = (newMessages: Message[]) => {
    setMessages(newMessages);
    setChatHistory((hist) => {
      const updatedHist = [...hist];
      updatedHist[currentChatIndex] = newMessages;
      return updatedHist;
    });
  };

  async function sendMessage(text: string) {
    const userMessage: Message = { role: "user", content: text };

    const messagesWithUser = [...messages, userMessage];
    const initialAssistantMessage: Message = { role: "assistant", content: "", isStreaming: true, analysisContent: "" };
    const messagesWithPlaceholder = [...messagesWithUser, initialAssistantMessage];
    updateChatState(messagesWithPlaceholder);

    if (messages.length === 0) {
      setSidebarTitles((prev) => {
        const newTitles = [...prev];
        newTitles[currentChatIndex] =
          text.length > 30 ? text.substring(0, 30) + "..." : text;
        return newTitles;
      });
    }

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text }),
    });

    const data = await res.json();
    const fullResponseText = data.response;

    let fullParsedResponse: { table: any, graph: any, analysis: string, suggestions?: string[] } | null = null;
    try {
      fullParsedResponse = JSON.parse(fullResponseText);
    } catch (error) {}

    if (fullParsedResponse && fullParsedResponse.analysis !== undefined) {
      const analysisText = fullParsedResponse.analysis || "";
      let streamedAnalysis = "";
      
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg.role === "assistant") {
           lastMsg.content = fullResponseText; 
        }
        return updated;
      });

      for (const char of analysisText) {
        streamedAnalysis += char;
        
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          
          if (lastMsg.role === "assistant" && lastMsg.isStreaming) {
            lastMsg.analysisContent = streamedAnalysis;
            
            setChatHistory((hist) => {
              const updatedHist = [...hist];
              updatedHist[currentChatIndex] = updated;
              return updatedHist;
            });
          }
          return updated;
        });
        await new Promise(resolve => setTimeout(resolve, 15));
      }
      
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg.role === "assistant") {
          lastMsg.content = fullResponseText;
          lastMsg.isStreaming = false;
          lastMsg.analysisContent = analysisText;
        }
        updateChatState(updated);
        return updated;
      });
    } else {
      const finalMessage: Message = { 
        role: "assistant", 
        content: fullResponseText, 
        isStreaming: false 
      };
      updateChatState([...messagesWithUser.slice(0, messagesWithUser.length - 1), userMessage, finalMessage]);
    }
  }

  const handleSuggestionClick = (question: string) => {
    sendMessage(question);
  };

  // --- NOUVELLE LOGIQUE DE TÉLÉCHARGEMENT DU RAPPORT ---
  async function handleDownloadReport() {
    if (messages.length === 0) return;

    try {
      const historyToSend = messages.map(msg => ({
        role: msg.role,
        content: msg.content 
      }));

      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: historyToSend }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Server returned error without JSON body." }));
        console.error("API Error:", errorData);
        throw new Error(`Échec de la récupération du rapport. Erreur API: ${errorData.error || res.statusText}`);
      }

      await downloadReport(res);

    } catch (e) {
      console.error("Erreur lors du téléchargement du rapport:", e);
      alert(`Erreur lors de la génération du rapport PDF: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  // --- FIN NOUVELLE LOGIQUE ---


  function selectChat(id: number) {
    if (id !== currentChatIndex) {
      setCurrentChatIndex(id);
      setIsMobileMenuOpen(false);
    }
  }

  function startNewChat() {
    if (chatHistory[currentChatIndex].length > 0) {
      setChatHistory((prev) => [...prev, []]);
      setCurrentChatIndex(chatHistory.length);
    } else {
      setMessages([]);
    }
    setIsMobileMenuOpen(false);
  }

  const InitialView = (
    <div className="flex flex-col items-center justify-center flex-1 h-full">
      <div className="text-4xl font-light mb-8 text-gray-700">
        Hello! I&apos;m Dilly, your AI DATA assistant.
      </div>
      <div className="w-full max-w-3xl px-4">
        <ChatInput onSend={sendMessage} />
      </div>
      <p className="text-xs text-gray-500 mt-6 max-w-xl text-center">
        Dilly can provide structured data like tables and graphs, or simple text
        analysis.
      </p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <div
        className={`hidden md:block fixed inset-y-0 left-0 w-[${COLLAPSED_SIDEBAR_WIDTH_PX}px] transition-all duration-300 ease-in-out z-20`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        style={{
            width: isSidebarHovered ? `${EXPANDED_SIDEBAR_WIDTH_PX}px` : `${COLLAPSED_SIDEBAR_WIDTH_PX}px`,
        }}
      >
        <Sidebar
          chats={sidebarTitles}
          onSelectChat={selectChat}
          onNewChat={startNewChat}
          isOpen={isSidebarHovered}
        />
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <Sidebar
            chats={sidebarTitles}
            onSelectChat={selectChat}
            onNewChat={startNewChat}
            isOpen={true}
          />
          <div
            className="flex-1 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      <main 
        className="flex-1 flex flex-col min-w-0"
        style={{ marginLeft: `${COLLAPSED_SIDEBAR_WIDTH_PX}px` }}
      >
        <header className="md:hidden h-16 flex items-center p-4 border-b bg-white z-10">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-600 hover:text-gray-900 mr-4"
          >
            <Menu />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            {hasMessages
              ? sidebarTitles[currentChatIndex] || "Dilly Chat"
              : "Dilly"}
          </h1>
        </header>

        {hasMessages ? (
          <>
            <div className="flex-1 overflow-y-auto pt-8 pb-32 px-4 md:px-8">
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((msg, i) => (
                  <MessageBubble
                    key={i}
                    role={msg.role}
                    content={msg.content}
                    isStreamingAnalysis={msg.isStreaming}
                    streamingAnalysisText={msg.analysisContent}
                    onSuggestionClick={handleSuggestionClick}
                  />
                ))}
              </div>
              <div ref={messagesEndRef} />
            </div>

            <div
              className={`fixed bottom-0 right-0 p-4 bg-gray-50 bg-opacity-95 backdrop-blur-sm z-30 flex justify-center w-full transition-all duration-300 ease-in-out`}
              style={{
                width: `calc(100% - ${
                  isSidebarHovered
                    ? EXPANDED_SIDEBAR_WIDTH_PX
                    : COLLAPSED_SIDEBAR_WIDTH_PX
                }px)`,
              }}
            >
              <div className="flex items-end gap-3 w-full max-w-3xl mx-auto">
                <ChatInput onSend={sendMessage} />
                
                <button
                  onClick={handleDownloadReport}
                  disabled={messages.length === 0}
                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-150 shadow-md ${
                    messages.length > 0
                      ? "bg-white text-gray-700 hover:bg-gray-100"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  title="Télécharger le rapport de la discussion"
                >
                  <Download size={24} />
                </button>

              </div>
              
              <p className="absolute bottom-1 right-1/2 translate-x-1/2 text-xs text-gray-400 mt-2">
                Dilly may display inaccurate info, including about people, so
                double-check its responses.
              </p>
            </div>
          </>
        ) : (
          InitialView
        )}
      </main>
    </div>
  );
}