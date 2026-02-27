"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface MessageInputProps {
  conversationId: Id<"conversations"> | string | undefined;
  senderId: Id<"users"> | string | undefined;
}

export default function MessageInput({
  conversationId,
  senderId,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const sendMessage = useMutation(api.messages.sendMessage);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const setTyping = useMutation(api.messages.setTyping);

  const handleSend = async () => {
    console.log("=== SEND DEBUG ===");
    console.log("conversationId:", conversationId);
    console.log("senderId:", senderId);
    console.log("message:", message);
    console.log("types:", typeof conversationId, typeof senderId);

    if (!message.trim()) {
    console.log("BLOCKED: empty message");
    return;
    }
    if (!senderId || !conversationId) {
    console.error("Missing senderId or conversationId!");
    return;
    }
    if (senderId === "" || conversationId === "") {
    console.log("BLOCKED: empty conversation");
    return;
    }

  setSending(true);
  setError(false);

  try {
    const result = await sendMessage({
      conversationId: conversationId as string,
      senderId: senderId as string,
      content: message.trim(),
      messageType: "text",
    });
    console.log("Send result:", result);
    setMessage("");
    } catch (err) {
    console.error("Send failed:", err);
    setError(true);
    } finally {
    setSending(false);
    }
};


  const handleTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
  setMessage(e.target.value);
  if (senderId && conversationId && senderId !== "" && conversationId !== "") {
    try {
      await setTyping({
        conversationId: conversationId as string,
        userId: senderId as string,
      });
    } catch {
      // ignore typing errors
    }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={message}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
    </div>
  );
}