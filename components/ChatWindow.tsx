"use client";

import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatWindow({
  conversationId,
}: {
  conversationId: string;
}) {
  const { user } = useUser();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const router = useRouter();

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

  const markAsRead = useMutation(api.messages.markMessagesAsRead);

  const typingUsers = useQuery(
    api.messages.getTypingUsers,
    conversationId && currentUser?._id
      ? {
          conversationId: conversationId as Id<"conversations">,
          currentUserId: currentUser._id,
        }
      : "skip"
  );

  // Get current conversation details
  const currentConversation = conversations?.find(
    (c) => c._id === conversationId
  );
  const isGroup = currentConversation?.isGroup;
  const groupName = currentConversation?.groupName;
  const memberCount = currentConversation?.participants?.length;
  const otherUser = currentConversation?.otherUser;

  const isOtherUserOnline =
    otherUser?.lastSeen !== undefined &&
    Date.now() - otherUser.lastSeen < 60000;

  // Detect if user is at bottom of chat
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const threshold = 100;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    const atBottom = distanceFromBottom < threshold;
    setIsAtBottom(atBottom);

    if (atBottom) setHasNewMessages(false);
  };

  // When new messages arrive
  useEffect(() => {
    if (!messages) return;

    if (isAtBottom) {

      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasNewMessages(false);
    } else {

      setHasNewMessages(true);
    }
  }, [messages]);

  // Mark as read when conversation opens
  useEffect(() => {
    if (!conversationId || !currentUser?._id) return;

    markAsRead({
      conversationId: conversationId as Id<"conversations">,
      userId: currentUser._id,
    });
  }, [conversationId, currentUser?._id, messages]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessages(false);
    setIsAtBottom(true);
  };

  return (
    <div className="flex-1 flex flex-col h-screen">

    {/* Header */}
    <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">

      {/* Back Button — mobile only */}
      <button
        onClick={() => router.push("/")}
        className="md:hidden text-gray-500 hover:text-gray-700 mr-1"
      >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" />
      </svg>
      </button>

      {isGroup ? (
      <>
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {groupName?.[0]?.toUpperCase() ?? "G"}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{groupName}</p>
          <p className="text-xs text-gray-500">{memberCount} members</p>
        </div>
      </>
      ) : otherUser ? (
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
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2 relative"
      >
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

        {/* Typing Indicator */}
        {typingUsers && typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2">
            <div className="bg-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* New Messages Button */}
      {hasNewMessages && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
          <button
            onClick={scrollToBottom}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce"
          >
            <span>↓</span>
            <span>New messages</span>
          </button>
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        conversationId={conversationId as Id<"conversations">}
        senderId={currentUser?._id}
      />

    </div>
  );
}
