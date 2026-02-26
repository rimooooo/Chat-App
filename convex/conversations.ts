import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createConversation = mutation({
  args: {
    participantOne: v.id("users"),
    participantTwo: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("participants"), [args.participantOne, args.participantTwo]),
          ),
          q.and(
            q.eq(q.field("participants"), [args.participantTwo, args.participantOne]),
          )
        )
      )
      .first();

    if (existing) return existing._id;

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

