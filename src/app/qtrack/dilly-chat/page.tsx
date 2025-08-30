"use client";

import { useState } from "react";
import { ChatMessage } from "../components/ChatMessages";
import { ChatInput } from "../components/ChatInput";
import { TypingDots } from "../components/TypingDots";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ sender: "user" | "assistant"; text: string }[]>([]);
  const [typing, setTyping] = useState(false);

  const sendMessage = async (message: string) => {
    setMessages((prev) => [...prev, { sender: "user", text: message }]);
    setTyping(true);

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "assistant", text: "Sure! Here's your response..." }]);
      setTyping(false);
    }, 1500);
  };

  return (
    <div className="chat-container h-[90vh]">
      <div className="flex-1 overflow-y-auto flex flex-col space-y-2">
        {messages.map((msg, i) => (
          <ChatMessage key={i} sender={msg.sender} text={msg.text} />
        ))}
        {typing && <TypingDots />}
      </div>
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
