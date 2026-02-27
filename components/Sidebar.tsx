"use client";

import { useQuery, useMutation } from "convex/react";
import { useUser, useClerk } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CreateGroupModal from "./CreateGroupModal";

export default function Sidebar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const conversations = useQuery(
    api.conversations.getConversations,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const allUsers = useQuery(api.users.getUsers, {
    clerkId: user?.id ?? "",
  });

  const createConversation = useMutation(api.conversations.createConversation);

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  // Users who already have a conversation
  const usersWithConversation = new Set(
    conversations
      ?.filter((c) => !c.isGroup)
      .map((c) => c.otherUser?._id)
      .filter(Boolean)
  );

  // Users who don't have a conversation yet
  const usersWithoutConversation = allUsers?.filter(
    (u) => !usersWithConversation.has(u._id)
  );

  // Filter by search
  const filteredConversations = conversations?.filter((c) => {
    const name = c.isGroup ? c.groupName : c.otherUser?.name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const filteredNewUsers = usersWithoutConversation?.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleUserClick = async (userId: Id<"users">) => {
    if (!currentUser?._id) return;
    try {
      // This creates OR returns existing conversation
      const conversationId = await createConversation({
        participantOne: currentUser._id,
        participantTwo: userId,
      });
      // conversationId is always a conversations table ID
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to open conversation:", error);
    }
  };

  return (
    <>
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-800">Messages</h1>
            <button
              type="button"
              onClick={() => setShowGroupModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg transition-colors"
              title="New Group"
            >
              +
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-gray-100 rounded-full px-4 py-2 pl-9 text-sm outline-none focus:ring-2 focus:ring-blue-300"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-4 h-4 absolute left-3 top-2.5 text-gray-400"
            >
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path
                d="M21 21l-4.35-4.35"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">

          {/* Existing Conversations */}
          {filteredConversations?.map((conv) => {
            const isGroup = conv.isGroup;
            const name = isGroup ? conv.groupName : conv.otherUser?.name;
            const imageUrl = conv.otherUser?.imageUrl;
            const lastMsg = conv.lastMessage?.content ?? "";
            const isOnline =
              !isGroup &&
              conv.otherUser?.lastSeen !== undefined &&
              Date.now() - conv.otherUser.lastSeen < 60000;

            return (
              <div
                key={conv._id}
                onClick={() => router.push(`/chat/${conv._id}`)}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
              >
                <div className="relative flex-shrink-0">
                  {isGroup ? (
                    <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {name?.[0]?.toUpperCase() ?? "G"}
                    </div>
                  ) : (
                    <>
                      <img
                        src={imageUrl}
                        alt={name ?? ""}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {lastMsg
                    ? lastMsg.length > 30
                    ? lastMsg.substring(0, 30) + "..."
                    : lastMsg
                    : isGroup
                    ? `${conv.participants?.length} members`
                    : "Start a conversation"}
                  </p>
                </div>
                
                {currentUser?._id && (
                  <UnreadCount
                    conversationId={conv._id}
                    userId={currentUser._id}
                  />
                )}
              </div>
            );
          })}

          {/* New Users — no conversation yet */}
          {filteredNewUsers && filteredNewUsers.length > 0 && (
            <>
              <p className="text-xs text-gray-400 px-4 py-2 uppercase tracking-wider font-medium">
                New Chats
              </p>
              {filteredNewUsers.map((u) => {
                const isOnline =
                  u?.lastSeen !== undefined &&
                  Date.now() - u.lastSeen < 60000;

                return (
                  <div
                    key={u._id}
                    onClick={() => handleUserClick(u._id)}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={u.imageUrl}
                        alt={u.name}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {u.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Start a conversation
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Empty State */}
          {filteredConversations?.length === 0 &&
            filteredNewUsers?.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-10 h-10 text-gray-300"
                >
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path
                    d="M21 21l-4.35-4.35"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-gray-400 text-sm">No results found</p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-blue-500 text-sm hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
        </div>

        {/* Bottom User Info */}
        <div className="p-4 border-t border-gray-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
            {user?.fullName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">
              {user?.fullName}
            </p>
            <p className="text-xs text-green-500">Online</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {showGroupModal && (
        <CreateGroupModal onClose={() => setShowGroupModal(false)} />
      )}
    </>
  );
}

// Inline unread count component
function UnreadCount({
  conversationId,
  userId,
}: {
  conversationId: Id<"conversations">;
  userId: Id<"users">;
}) {
  const count = useQuery(api.messages.getUnreadCount, {
    conversationId,
    userId,
  });

  if (!count || count === 0) return null;

  return (
    <span className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1.5">
      {count > 99 ? "99+" : count}
    </span>
  );
}