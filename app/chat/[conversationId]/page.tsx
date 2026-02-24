import ChatWindow from "@/components/ChatWindow";

export default async function ChatPage({
  params,
}: {
  params: Promise <{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return (
    <div className="flex h-screen bg-gray-100">
      <ChatWindow conversationId={conversationId} />
    </div>
  );
}