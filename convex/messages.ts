import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Send a message
export const sendMessage = mutation({
  args: {
    conversationId: v.string(),
    senderId: v.string(),
    content: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video")
    ),
  },
  handler: async (ctx, args) => {
    if (!args.conversationId || !args.senderId) return null;
    if (args.conversationId === "" || args.senderId === "") return null;
    if (!args.content || args.content.trim() === "") return null;

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId as Id<"conversations">,
      senderId: args.senderId as Id<"users">,
      content: args.content,
      messageType: args.messageType,
      isRead: false,
      isDeleted: false,
      reactions: [],
    });

    await ctx.db.patch(args.conversationId as Id<"conversations">, {
      lastMessage: messageId,
    });

    return messageId;
  },
});

// Get all messages in a conversation
export const getMessages = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    if (!args.conversationId || args.conversationId === "") return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId as Id<"conversations">)
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
    conversationId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.conversationId || !args.userId) return;
    if (args.conversationId === "" || args.userId === "") return;

    try {
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
          conversationId: args.conversationId as Id<"conversations">,
          userId: args.userId as Id<"users">,
          lastTyped: Date.now(),
        });
      }
    } catch {
      return;
    }
  },
});

// Get typing users
export const getTypingUsers = query({
  args: {
    conversationId: v.string(),
    currentUserId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.conversationId || !args.currentUserId) return [];
    if (args.conversationId === "" || args.currentUserId === "") return [];

    try {
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
    } catch {
      return [];
    }
  },
});

// Get unread message count
export const getUnreadCount = query({
  args: {
    conversationId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.conversationId || !args.userId) return 0;
    if (args.conversationId === "" || args.userId === "") return 0;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId as Id<"conversations">)
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
    conversationId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.conversationId || !args.userId) return;
    if (args.conversationId === "" || args.userId === "") return;

    const conversation = await ctx.db.get(
      args.conversationId as Id<"conversations">
    );
    if (!conversation) return;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId as Id<"conversations">)
      )
      .collect();

    if (messages.length === 0) return;

    const unread = messages.filter(
      (m) => m.senderId !== args.userId && m.isRead !== true
    );

    if (unread.length === 0) return;

    await Promise.all(
      unread.map((m) => ctx.db.patch(m._id, { isRead: true }))
    );
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

export const migrateOldMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();

    let count = 0;
    for (const message of messages) {
      await ctx.db.patch(message._id, {
        isRead: message.isRead ?? false,
        isDeleted: message.isDeleted ?? false,
        reactions: message.reactions ?? [],
      });
      count++;
    }

    return `Migrated ${count} messages successfully`;
  },
});