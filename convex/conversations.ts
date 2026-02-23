import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or get existing conversation between two users
export const createConversation = mutation({
  args: {
    participantOne: v.id("users"),
    participantTwo: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if conversation already exists between these two users
    const existingConversation = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("participants"), [
              args.participantOne,
              args.participantTwo,
            ]),
          ),
          q.and(
            q.eq(q.field("participants"), [
              args.participantTwo,
              args.participantOne,
            ]),
          )
        )
      )
      .first();

    if (existingConversation) return existingConversation._id;

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      participants: [args.participantOne, args.participantTwo],
      isGroup: false,
    });

    return conversationId;
  },
});

// Get all conversations for a user
export const getConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.or(
          q.eq(q.field("participants"), [args.userId]),
        )
      )
      .collect();

    // Get full details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        // Get the other participant's details
        const otherUserId = conv.participants.find(
          (p) => p !== args.userId
        );

        const otherUser = otherUserId
          ? await ctx.db.get(otherUserId)
          : null;

        // Get last message details
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

    return conversationsWithDetails;
  },
});
