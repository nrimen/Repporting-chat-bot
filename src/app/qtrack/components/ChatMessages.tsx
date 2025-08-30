// components/ChatMessage.tsx
import React from "react";

interface ChatMessageProps {
  sender: "user" | "assistant";
  text: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text }) => {
  return (
    <div
      className={`p-3 my-2 max-w-xl rounded-xl ${
        sender === "user" ? "bg-blue-100 self-end" : "bg-gray-100 self-start"
      }`}
    >
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{text}</p>
    </div>
  );
};
