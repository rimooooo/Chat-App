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
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      messageType: args.messageType,
      isRead: false,
    });

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

    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          isRead: message.isRead ?? false,
          isDeleted: message.isDeleted ?? false,
          reactions: message.reactions ?? [],
          sender,
        };
      })
    );

    return messagesWithSender;
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      content: "This message was deleted",
      isDeleted: true,
    });
  },
});

// Typing indicator
export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typing")
      .filter((q) =>
        q.and(
          q.eq(q.field("conversationId"), args.conversationId),
          q.eq(q.field("userId"), args.userId)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastTyped: Date.now() });
    } else {
      await ctx.db.insert("typing", {
        conversationId: args.conversationId,
        userId: args.userId,
        lastTyped: Date.now(),
      });
    }
  },
});

// Get typing users
export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const typingUsers = await ctx.db
      .query("typing")
      .filter((q) =>
        q.eq(q.field("conversationId"), args.conversationId)
      )
      .collect();

    const threeSecondsAgo = Date.now() - 3000;

    return typingUsers.filter(
      (t) =>
        t.userId !== args.currentUserId &&
        t.lastTyped > threeSecondsAgo
    );
  },
});

// Get unread message count
export const getUnreadCount = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    return messages.filter(
      (m) => m.senderId !== args.userId && !m.isRead
    ).length;
  },
});


// Mark all messages as read
export const markMessagesAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", args.conversationId)
        )
        .collect();

      const unreadMessages = messages.filter(
        (m) => m.senderId !== args.userId && !m.isRead
      );

      await Promise.all(
        unreadMessages.map((m) =>
          ctx.db.patch(m._id, { isRead: true })
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },
});

// reaction function
export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    const reactions = message.reactions ?? [];

    // Check if user already reacted with this emoji
    const existingIndex = reactions.findIndex(
      (r) => r.userId === args.userId && r.emoji === args.emoji
    );

    if (existingIndex !== -1) {
      // Remove reaction
      reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      reactions.push({ userId: args.userId, emoji: args.emoji });
    }

    await ctx.db.patch(args.messageId, { reactions });
  },
});

export const fixOldMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();

    await Promise.all(
      messages.map((m) =>
        ctx.db.patch(m._id, {
          isRead: m.isRead ?? false,
          isDeleted: m.isDeleted ?? false,
          reactions: m.reactions ?? [],
        })
      )
    );

    return `Fixed ${messages.length} messages`;
  },
});