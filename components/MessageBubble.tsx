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

// Smart timestamp function
function formatTimestamp(timestamp: number): string {
  const messageDate = new Date(timestamp);
  const now = new Date();

  const isToday =
    messageDate.getDate() === now.getDate() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getFullYear() === now.getFullYear();

  const isThisYear = messageDate.getFullYear() === now.getFullYear();

  const timeString = messageDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    // Today → just time e.g. "2:34 PM"
    return timeString;
  } else if (isThisYear) {
    // This year → date + time e.g. "Feb 15, 2:34 PM"
    return (
      messageDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      }) +
      ", " +
      timeString
    );
  } else {
    // Different year → full date + time e.g. "Feb 15 2024, 2:34 PM"
    return (
      messageDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      ", " +
      timeString
    );
  }
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const timestamp = formatTimestamp(message._creationTime);

  return (
    <div
      className={`flex items-end gap-2 ${
        isOwn ? "flex-row-reverse" : "flex-row"
      }`}
    >
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

        {/* Smart Timestamp */}
        <p
          className={`text-xs mt-1 text-right ${
            isOwn ? "text-blue-100" : "text-gray-400"
          }`}
        >
          {timestamp}
        </p>
      </div>
    </div>
  );
}
