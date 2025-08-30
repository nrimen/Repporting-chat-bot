// components/ChatInput.tsx
import React, { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2">
      <input
        type="text"
        placeholder="Type your message..."
        className="flex-1 border p-2 rounded"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Send
      </button>
    </form>
  );
};
