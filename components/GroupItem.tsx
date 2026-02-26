"use client";

import { useRouter } from "next/navigation";

interface GroupItemProps {
  group: {
    _id: string;
    groupName?: string;
    memberCount: number;
    lastMessage?: any;
  };
}

export default function GroupItem({ group }: GroupItemProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/chat/${group._id}`)}
      className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
    >
      {/* Group Avatar */}
      <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
        {group.groupName?.[0]?.toUpperCase() ?? "G"}
      </div>

      {/* Group Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">
          {group.groupName ?? "Group"}
        </p>
        <p className="text-xs text-gray-500">{group.memberCount} members</p>
      </div>
    </div>
  );
}