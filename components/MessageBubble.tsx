"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface MessageBubbleProps {
  message: {
    _id: Id<"messages">;
    content: string;
    messageType: string;
    senderId: Id<"users">;
    isDeleted?: boolean;
    reactions?: { userId: Id<"users">; emoji: string }[];
    sender?: {
      name: string;
      imageUrl: string;
    } | null;
    _creationTime: number;
  };
  isOwn: boolean;
}

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

  if (isToday) return timeString;
  if (isThisYear) {
    return (
      messageDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      }) +
      ", " +
      timeString
    );
  }
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

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const { user } = useUser();
  const [showReactions, setShowReactions] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [sendError, setSendError] = useState(false);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const timestamp = formatTimestamp(message._creationTime);

  const handleDelete = async () => {
    try {
      await deleteMessage({ messageId: message._id });
      setShowActions(false);
    } catch {
      setSendError(true);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentUser) return;
    try {
      await toggleReaction({
        messageId: message._id,
        userId: currentUser._id,
        emoji,
      });
    } catch {
      setSendError(true);
    }
    setShowReactions(false);
    setShowActions(false);
  };

  // Group reactions by emoji
  const reactionCounts = message.reactions?.reduce(
    (acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const hasReacted = (emoji: string) =>
    message.reactions?.some(
      (r) => r.userId === currentUser?._id && r.emoji === emoji
    );

  return (
    <div
      className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {/* Avatar */}
      {!isOwn && (
        <img
          src={message.sender?.imageUrl}
          alt={message.sender?.name}
          className="w-7 h-7 rounded-full object-cover mb-1 flex-shrink-0"
        />
      )}

      <div className={`flex flex-col max-w-xs lg:max-w-md ${isOwn ? "items-end" : "items-start"}`}>

        {/* Emoji Picker */}
        {showReactions && (
          <div className="bg-white rounded-full shadow-lg border border-gray-100 flex items-center gap-1 px-2 py-1 mb-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`text-xl hover:scale-125 transition-transform ${
                  hasReacted(emoji) ? "opacity-100" : "opacity-60 hover:opacity-100"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Bubble + Action Buttons Row */}
        <div className={`flex items-center gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>

          {/* Message Bubble */}
          <div
            className={`px-4 py-2 rounded-2xl cursor-pointer ${
              isOwn
                ? "bg-blue-500 text-white rounded-br-sm"
                : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
            }`}
            onMouseEnter={() => setShowActions(true)}
          >
            {message.isDeleted ? (
              <p className={`text-sm italic ${isOwn ? "text-blue-100" : "text-gray-400"}`}>
                This message was deleted
              </p>
            ) : message.messageType === "text" ? (
              <p className="text-sm">{message.content}</p>
            ) : (
              <img
                src={message.content}
                alt="image message"
                className="rounded-lg max-w-full"
              />
            )}

            <p className={`text-xs mt-1 text-right ${
              isOwn ? "text-blue-100" : "text-gray-400"
            }`}>
              {timestamp}
            </p>
          </div>

          {/* Action Buttons */}
          {showActions && !message.isDeleted && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setShowReactions(!showReactions);
                }}
                className="text-gray-400 hover:text-gray-600 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow border border-gray-100 text-sm"
                title="React"
              >
                😊
              </button>
              {isOwn && (
                <button
                  onClick={handleDelete}
                  className="text-gray-400 hover:text-red-500 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow border border-gray-100 text-sm"
                  title="Delete"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reaction Counts */}
        {reactionCounts && Object.keys(reactionCounts).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  hasReacted(emoji)
                    ? "bg-blue-50 border-blue-300 text-blue-600"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Send Error */}
        {sendError && (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-red-500">Action failed</p>
            <button
              onClick={() => setSendError(false)}
              className="text-xs text-blue-500 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}