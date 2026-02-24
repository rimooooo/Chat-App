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
  
  const messages = useQuery(
    api.messages.getMessages,
    conversationId ? { conversationId: conversationId as Id<"conversations"> } : "skip"
  );

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const conversation = useQuery(
    api.conversations.getConversations,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const otherUser = conversation?.find(
    (c) => c._id === conversationId
  )?.otherUser;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ... rest of the component stays the same

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
        {otherUser && (
      <>
        <div className="relative">
          <img
            src={otherUser.imageUrl}
            alt={otherUser.name}
            className="w-9 h-9 rounded-full object-cover"
          />
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
            otherUser.isOnline ? "bg-green-500" : "bg-gray-400"
          }`} />
        </div>
      <div>
        <p className="font-semibold text-gray-800">{otherUser.name}</p>
        <p className="text-xs text-gray-500">
          {otherUser.isOnline ? "Online" : "Offline"}
        </p>
      </div>
    </>
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
            <p className="text-gray-400">
              No messages yet. Say hello! 👋
            </p>
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

      {/* Message Input */}
      <MessageInput
         conversationId={conversationId as Id<"conversations">}
         senderId={currentUser?._id}
      />
    </div>
  );
}