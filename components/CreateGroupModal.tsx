"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";

export default function CreateGroupModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const { user } = useUser();
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const users = useQuery(api.users.getUsers, {
    clerkId: user?.id ?? "",
  });

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const createGroup = useMutation(api.conversations.createGroupConversation);

   console.log("Selected Users:", selectedUsers);
   console.log("Creator:", currentUser?._id);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }
    if (selectedUsers.length < 2) {
      setError("Please select at least 2 members");
      return;
    }
    if (!currentUser) return;

    setIsCreating(true);
    try {
      const conversationId = await createGroup({
        participants: selectedUsers as any,
        groupName: groupName.trim(),
        creatorId: currentUser._id,
      });
      router.push(`/chat/${conversationId}`);
      onClose();
    } catch {
      setError("Failed to create group. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">New Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Group Name Input */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            value={groupName}
            onChange={(e) => {
              setGroupName(e.target.value);
              setError("");
            }}
            placeholder="Group name..."
            className="w-full bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* User Selection */}
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-3">
            Select members ({selectedUsers.length} selected)
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {users?.map((u) => (
              <div
                key={u._id}
                onClick={() => toggleUser(u._id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  selectedUsers.includes(u._id)
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <img
                  src={u.imageUrl}
                  alt={u.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <p className="flex-1 text-sm font-medium text-gray-800">
                  {u.name}
                </p>
                {selectedUsers.includes(u._id) && (
                  <span className="text-blue-500 text-lg">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="px-4 text-sm text-red-500">{error}</p>
        )}

        {/* Create Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2.5 rounded-full font-medium transition-colors"
          >
            {isCreating ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}