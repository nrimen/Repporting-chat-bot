interface MessageBubbleProps {
    role: "user" | "assistant";
    content: string;
  }
  
  export default function MessageBubble({ role, content }: MessageBubbleProps) {
    const isUser = role === "user";
    return (
      <div className={`flex justify-center`}>
        <div
          className={`w-full md:w-2/3 lg:w-1/2 p-5 rounded-xl shadow-sm ${
            isUser
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-900 border"
          }`}
        >
          {content}
        </div>
      </div>
    );
  }
  