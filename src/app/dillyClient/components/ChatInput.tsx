"use client";

import { Mic, Square,  CornerUpLeft } from "lucide-react"; 
import { useState, useRef } from "react";

export default function ChatInput({
  onSend,
}: {
  onSend: (msg: string) => void;
}) {
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
    <div className="relative w-full max-w-3xl mx-auto p-2 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="flex items-end gap-2">
        <textarea
          rows={1}
          className="flex-1 resize-none text-black rounded-xl px-2 py-2 focus:outline-none placeholder-gray-500 max-h-40 overflow-y-auto"
          placeholder="Message Dilly..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />

        <div className="flex items-center gap-1">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-150 ${
              recording
                ? "bg-red-500 text-white hover:bg-red-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title={recording ? "Stop Recording" : "Start Voice Input"}
          >
            {recording ? <Square size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={send}
            disabled={!input.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-150 ${
              input.trim()
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            title="Send Message"
          >
            <CornerUpLeft size={20} className="transform rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}