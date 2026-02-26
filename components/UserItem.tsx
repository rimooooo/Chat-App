"use client";

import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import UnreadBadge from "./UnreadBadge";

export default function UserItem({
  user,
  onSelect,
}: {
  user: Doc<"users">;
  onSelect?: () => void;
}) {
  const { user: clerkUser } = useUser();
  const router = useRouter();

  const currentUser = useQuery(api.users.getUserByClerkId, {
    clerkId: clerkUser?.id ?? "",
  });

  const createConversation = useMutation(api.conversations.createConversation);

  // Get existing conversation between these two users
  const conversations = useQuery(
    api.conversations.getConversations,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const existingConversation = conversations?.find((c) =>
    c.participants.includes(user._id)
  );

  const isOnline =
    user?.lastSeen !== undefined &&
    Date.now() - user.lastSeen < 60000;

  const handleClick = async () => {
    if (!currentUser) return;

    const conversationId = await createConversation({
      participantOne: currentUser._id,
      participantTwo: user._id,
    });

    onSelect?.();
    router.push(`/chat/${conversationId}`);
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
    >
      {/* Avatar */}
      <div className="relative">
        <img
          src={user.imageUrl}
          alt={user.name}
          className="w-11 h-11 rounded-full object-cover"
        />
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{user.name}</p>
        <p className="text-xs text-gray-500">
          {isOnline ? "🟢 Online" : "⚫ Offline"}
        </p>
      </div>

      {/* Unread Badge */}
      {currentUser?._id && existingConversation && (
        <UnreadBadge
          conversationId={existingConversation._id}
          userId={currentUser._id}
        />
      )}
    </div>
  );
}
