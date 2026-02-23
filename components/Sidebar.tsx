"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import UserItem from "./UserItem";

export default function Sidebar() {
  const { user } = useUser();

  const users = useQuery(api.users.getUsers, {
    clerkId: user?.id ?? "",
  });

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Messages</h1>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {users === undefined ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          users.map((u) => <UserItem key={u._id} user={u} />)
        )}
      </div>

      {/* Logged in user at bottom */}
      <div className="p-4 border-t border-gray-200 flex items-center gap-3">
        <img
          src={user?.imageUrl}
          alt={user?.fullName ?? ""}
          className="w-9 h-9 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-medium text-gray-800">{user?.fullName}</p>
          <p className="text-xs text-green-500">Online</p>
        </div>
      </div>
    </div>
  );
}
