import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Send a message
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video")
    ),
  },
  handler: async (ctx, args) => {
    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      messageType: args.messageType,
    });

    // Update lastMessage in conversation
    await ctx.db.patch(args.conversationId, {
      lastMessage: messageId,
    });

    return messageId;
  },
});

// Get all messages in a conversation
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    // Get sender details for each message
    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return { ...message, sender };
      })
    );

    return messagesWithSender;
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
  },
});
