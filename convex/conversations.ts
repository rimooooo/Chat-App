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
    // Get ALL conversations
    const allConversations = await ctx.db
      .query("conversations")
      .collect();

    // Filter ones where user is a participant
    const myConversations = allConversations.filter((conv) =>
      conv.participants.includes(args.userId)
    );

    // Attach other user + last message details
    const result = await Promise.all(
      myConversations.map(async (conv) => {
        const otherUserId = conv.participants.find(
          (p) => p !== args.userId
        );

        const otherUser = otherUserId
          ? await ctx.db.get(otherUserId)
          : null;

        const lastMessage = conv.lastMessage
          ? await ctx.db.get(conv.lastMessage)
          : null;

        return {
          ...conv,
          otherUser,
          lastMessage,
        };
      })
    );

    return result;
  },
});
