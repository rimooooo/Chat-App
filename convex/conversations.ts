import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const createConversation = mutation({
  args: {
    participantOne: v.id("users"),
    participantTwo: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if conversation already exists
    const existing = await ctx.db
      .query("conversations")
      .collect();

    const existingConversation = existing.find(
      (conv) =>
        !conv.isGroup &&
        conv.participants.includes(args.participantOne) &&
        conv.participants.includes(args.participantTwo)
    );

    if (existingConversation) {
      return existingConversation._id;
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      participants: [args.participantOne, args.participantTwo],
      isGroup: false,
    });

    return conversationId;
  },
});

export const getConversations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    if (!args.userId || args.userId === "") return [];

    const allConversations = await ctx.db
      .query("conversations")
      .collect();

    const myConversations = allConversations.filter((conv) =>
      conv.participants.includes(args.userId)
    );

    const result = await Promise.all(
      myConversations.map(async (conv) => {
        const otherUserId = conv.participants.find(
          (p) => p !== args.userId
        );

        let otherUser = null;
        if (!conv.isGroup && otherUserId) {
          const user = await ctx.db.get(otherUserId as Id<"users">);
          if (user && "name" in user) {
            otherUser = user;
          }
        }

        // Get last message safely
        let lastMessageContent = "";
        if (conv.lastMessage) {
          const msg = await ctx.db.get(conv.lastMessage as Id<"messages">);
          if (msg && "content" in msg) {
            lastMessageContent = msg.isDeleted
              ? "This message was deleted"
              : msg.content;
          }
        }

        return {
          _id: conv._id,
          _creationTime: conv._creationTime,
          isGroup: conv.isGroup,
          groupName: conv.groupName,
          groupImage: conv.groupImage,
          participants: conv.participants,
          lastMessageTime: conv._creationTime,
          lastMessage: lastMessageContent,
          otherUser,
        };
      })
    );

    return result.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  },
});

export const getConversationById = query({
  args: {
    conversationId: v.string(),
    currentUserId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.conversationId || !args.currentUserId) return null;
    if (args.conversationId === "" || args.currentUserId === "") return null;

    const conv = await ctx.db.get(
      args.conversationId as Id<"conversations">
    );

    if (!conv) return null;

    // Type guard — make sure it's a conversation not another table
    if (!("participants" in conv)) return null;

    // Find the other user in 1-on-1 chat
    const otherUserId = conv.participants.find(
      (p: string) => p !== args.currentUserId
    );

    const otherUser =
      !conv.isGroup && otherUserId
        ? await ctx.db.get(otherUserId as Id<"users">)
        : null;

    // Type guard for otherUser
    const safeOtherUser =
      otherUser && "name" in otherUser ? otherUser : null;

    return {
      ...conv,
      otherUser: safeOtherUser,
      memberCount: conv.participants.length,
    };
  },
});

export const createGroupConversation = mutation({
  args: {
    participants: v.array(v.id("users")),
    groupName: v.string(),
    creatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Remove duplicates safely
    const uniqueParticipants = Array.from(
      new Set([...args.participants, args.creatorId])
    );

    if (uniqueParticipants.length < 2) {
      throw new Error("A group must have at least 2 members");
    }

    const conversationId = await ctx.db.insert("conversations", {
      participants: uniqueParticipants,
      isGroup: true,
      groupName: args.groupName,
    });

    return conversationId;
  },
});

export const getGroupConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allConversations = await ctx.db
      .query("conversations")
      .collect();

    const myGroups = allConversations.filter(
      (conv) => conv.isGroup && conv.participants.some((id) => id === args.userId)
    );

    return await Promise.all(
      myGroups.map(async (conv) => {
        const lastMessage = conv.lastMessage
          ? await ctx.db.get(conv.lastMessage as any)
          : null;

        return {
          ...conv,
          memberCount: conv.participants.length,
          lastMessage,
        };
      })
    );
  },
});

