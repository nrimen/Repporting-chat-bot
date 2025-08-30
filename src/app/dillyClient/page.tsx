"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import MessageBubble from "./components/MessageBubble";
import ChatInput from "./components/ChatInput";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<string[]>([]);

  async function sendMessage(text: string) {
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    if (messages.length === 0) {
      setChats((prev) => [...prev, text]);
    }

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";

    if (!reader) {
      console.error("No reader available");
      return;
    }

    while (true) {
      const { done, value } = await reader.read()!;
      if (done) break;

      const chunk = decoder.decode(value, { stream: true }).trim();
      if (!chunk) continue;

      const lines = chunk.split("\n");
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.response) {
            assistantText += json.response;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantText,
              };
              return updated;
            });
          }
        } catch {}
      }
    }
  }

  const hasMessages = messages.length > 0;
  
  function startNewChat() {
    setChats((prev) => [...prev, "New Chat"]);
    setMessages([]);
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        chats={chats}
        onSelectChat={(id) => console.log("Select", id)}
        onNewChat={startNewChat}
      />

      <main className="flex-1 flex flex-col bg-gray-100">
        {hasMessages ? (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <MessageBubble key={i} role={msg.role} content={msg.content} />
              ))}
            </div>

            <div className="p-4 border-t bg-white">
              <div className="flex justify-center">
                <ChatInput onSend={sendMessage} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <ChatInput onSend={sendMessage} />
          </div>
        )}
      </main>
    </div>
  );
}
