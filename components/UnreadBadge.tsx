"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function UnreadBadge({
  conversationId,
  userId,
}: {
  conversationId: Id<"conversations">;
  userId: Id<"users">;
}) {
  const unreadCount = useQuery(api.messages.getUnreadCount, {
    conversationId,
    userId,
  });

  if (!unreadCount || unreadCount === 0) return null;

  return (
    <span className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1.5">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
