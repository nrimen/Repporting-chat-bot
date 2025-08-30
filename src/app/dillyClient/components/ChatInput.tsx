"use client";

import { Mic, Square, Send } from "lucide-react";
import { useState, useRef } from "react";

export default function ChatInput({ onSend }: { onSend: (msg: string) => void }) {
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const send = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", audioBlob, "voiceNote.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.text) {
        onSend(data.text);
      }
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="flex items-center gap-3 w-full md:w-2/3 lg:w-1/2">
      <input
        className="flex-1 border text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
      />
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`${
          recording ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
        } text-white p-3 rounded-lg flex items-center justify-center`}
      >
        {recording ? <Square size={18} /> : <Mic size={18} />}
      </button>
      <button
        onClick={send}
        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
