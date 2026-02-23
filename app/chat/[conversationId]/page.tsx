import ChatWindow from "@/components/ChatWindow";

export default function ChatPage({
  params,
}: {
  params: { conversationId: string };
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <ChatWindow conversationId={params.conversationId} />
    </div>
  );
}