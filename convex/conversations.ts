import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Query all conversations
    const allConversations = await ctx.db
      .query("conversations")
      .collect();

    // Filter to get only conversations where user is a participant
    const myConversations = allConversations.filter((conv) =>
      conv.participants.includes(args.userId)
    );

    // Get other user and last message for each conversation
    const result = await Promise.all(
      myConversations.map(async (conv) => {
        const otherUserId = conv.participants.find(
          (p) => p !== args.userId
        );

        const otherUser =
          !conv.isGroup && otherUserId
            ? await ctx.db.get(otherUserId)
            : null;

        const lastMessage = conv.lastMessage
          ? await ctx.db.get(conv.lastMessage)
          : null;

        return {
          ...conv,
          otherUser,
          lastMessage,
          lastMessageTime: lastMessage?._creationTime ?? conv._creationTime,
        };
      })
    );

    // Sort by most recent message first
    return result.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
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
          ? await ctx.db.get(conv.lastMessage)
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

