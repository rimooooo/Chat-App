"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { useEffect, useRef } from "react";

export default function ChatWindow({
  conversationId,
}: {
  conversationId: string;
}) {
  const { user } = useUser();
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const messages = useQuery(
    api.messages.getMessages,
    conversationId
      ? { conversationId: conversationId as Id<"conversations"> }
      : "skip"
  );

  const conversations = useQuery(
    api.conversations.getConversations,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  // Get the other user from this conversation
  const otherUser = conversations?.find(
    (c) => c._id === conversationId
  )?.otherUser;

  // Check if other user is online based on lastSeen
  const isOtherUserOnline =
    otherUser?.lastSeen !== undefined &&
    Date.now() - otherUser.lastSeen < 60000;

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const typingUsers = useQuery(
  api.messages.getTypingUsers,
  conversationId && currentUser?._id
    ? {
        conversationId: conversationId as Id<"conversations">,
        currentUserId: currentUser._id,
      }
    : "skip"
  );


  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
        {otherUser ? (
          <>
            <div className="relative">
              <img
                src={otherUser.imageUrl}
                alt={otherUser.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  isOtherUserOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{otherUser.name}</p>
              <p className="text-xs text-gray-500">
                {isOtherUserOnline ? "🟢 Online" : "⚫ Offline"}
              </p>
            </div>
          </>
        ) : (
          <p className="text-gray-500">Loading...</p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages === undefined ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.senderId === currentUser?._id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers && typingUsers.length > 0 && (
      <div className="flex items-center gap-2 px-2">
        <div className="bg-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
      )
      }

      {/* Message Input */}
      <MessageInput
        conversationId={conversationId as Id<"conversations">}
        senderId={currentUser?._id}
      />

      
    </div>
  );
}
