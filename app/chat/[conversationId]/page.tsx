import ChatWindow from "@/components/ChatWindow";
import Sidebar from "@/components/Sidebar";
import SyncUser from "@/components/SyncUser";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { conversationId } = await params;

  return (
    <div className="flex h-screen bg-gray-100">
      <SyncUser />
      {/* Sidebar hidden on mobile when in chat */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {/* Chat takes full width on mobile */}
      <div className="flex-1">
        <ChatWindow conversationId={conversationId} />
      </div>
    </div>
  );
}