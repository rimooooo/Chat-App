"use client";

interface MessageBubbleProps {
  message: {
    content: string;
    messageType: string;
    sender?: {
      name: string;
      imageUrl: string;
    } | null;
    _creationTime: number;
  };
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = new Date(message._creationTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isOwn && (
        <img
          src={message.sender?.imageUrl}
          alt={message.sender?.name}
          className="w-7 h-7 rounded-full object-cover mb-1"
        />
      )}

      {/* Bubble */}
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          isOwn
            ? "bg-blue-500 text-white rounded-br-sm"
            : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
        }`}
      >
        {message.messageType === "text" ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <img
            src={message.content}
            alt="image message"
            className="rounded-lg max-w-full"
          />
        )}
        <p
          className={`text-xs mt-1 ${
            isOwn ? "text-blue-100" : "text-gray-400"
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
