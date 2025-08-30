import React from 'react'

interface ChatMessageProps {
  sender: 'user' | 'assistant'
  text: string
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ sender, text }) => (
  <div
    className={`max-w-xl px-5 py-3 my-3 rounded-2xl shadow-sm
        ${
          sender === 'user'
            ? 'bg-blue-600 text-white self-end'
            : 'bg-gray-200 text-gray-900 self-start'
        }
      `}
    style={{ wordBreak: 'break-word' }}
  >
    <p className="text-base whitespace-pre-wrap">{text}</p>
  </div>
)
