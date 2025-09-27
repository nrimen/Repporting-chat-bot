"use client";

import { MessageSquare, Plus } from "lucide-react";

export interface SidebarProps {
  chats: string[];
  onSelectChat: (id: number) => void;
  onNewChat: () => void;
  isOpen: boolean;
}

export default function Sidebar({
  chats,
  onSelectChat,
  onNewChat,
  isOpen,
}: SidebarProps) {
  const truncate = (str: string) =>
    str.length > 30 ? str.substring(0, 30) + "..." : str;

  const collapsedWidth = 'w-20'; 
  const expandedWidth = 'w-72'; 

  const sidebarClass = `h-full ${
    isOpen ? expandedWidth : collapsedWidth
  } bg-gray-900 text-gray-100 flex flex-col transition-all duration-300 ease-in-out z-20`;

  const contentVisibilityClass = isOpen ? "opacity-100 delay-150" : "opacity-0 pointer-events-none";

  return (
    <aside className={sidebarClass}>
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full h-12 flex items-center bg-gray-800 hover:bg-gray-700 text-white rounded-full p-3 transition duration-150 justify-center group"
        >
          <Plus size={20} className={isOpen ? "mr-3" : "mr-0"} />
          <span className={`transition-opacity duration-150 ease-in-out ${contentVisibilityClass}`}>
            New Chat
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-4 px-3">
        <p
          className={`text-xs font-semibold text-gray-500 uppercase mb-2 px-3 transition-opacity duration-150 ease-in-out ${contentVisibilityClass}`}
        >
          Recent
        </p>
        {chats.map((chat, i) => (
          <button
            key={i}
            onClick={() => onSelectChat(i)}
            className="w-full text-left flex items-center rounded-lg px-3 py-3 mb-1 text-sm text-gray-300 hover:bg-gray-700 transition duration-150"
            title={chat} 
          >
            <MessageSquare size={18} className={isOpen ? "mr-3 flex-shrink-0" : "mr-0 flex-shrink-0"} />
            <span
              className={`flex-1 min-w-0 truncate transition-opacity duration-150 ease-in-out ${contentVisibilityClass}`}
            >
              {truncate(chat)}
            </span>
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-gray-700">
        <div className="flex items-center hover:bg-gray-700 p-2 rounded-lg cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
            D
          </div>
          <span className={`text-sm transition-opacity duration-150 ease-in-out ${contentVisibilityClass}`}>
            User Name
          </span>
        </div>
      </div>
    </aside>
  );
}