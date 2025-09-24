"use client";

export interface SidebarProps {
  chats: string[];
  onSelectChat: (id: number) => void;
  onNewChat: () => void;
}

export default function Sidebar({ chats, onSelectChat, onNewChat }: SidebarProps) {
  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-4 font-bold text-lg border-b border-gray-700 flex justify-between items-center">
        Dilly History
        <button
          onClick={onNewChat}
          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat, i) => (
          <button
            key={i}
            onClick={() => onSelectChat(i)}
            className="w-full text-left px-4 py-2 hover:bg-gray-800"
          >
            {chat}
          </button>
        ))}
      </div>
    </aside>
  );
}
