import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const createConversation = mutation({
  args: {
    participantOne: v.string(),
    participantTwo: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.participantOne || !args.participantTwo) return null;

    const existing = await ctx.db.query("conversations").collect();

    const existingConversation = existing.find(
      (conv) =>
        !conv.isGroup &&
        conv.participants.map((p: any) => p.toString()).includes(args.participantOne) &&
        conv.participants.map((p: any) => p.toString()).includes(args.participantTwo)
    );

    if (existingConversation) {
      return existingConversation._id.toString();
    }

    const conversationId = await ctx.db.insert("conversations", {
      participants: [args.participantOne, args.participantTwo],
      isGroup: false,
    });

    return conversationId.toString();
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
      conv.participants.map((p: any) => p.toString()).includes(args.userId)
    );

    const result = await Promise.all(
      myConversations.map(async (conv) => {
        const otherUserId = conv.participants
          .map((p: any) => p.toString())
          .find((p: string) => p !== args.userId);

        let otherUser = null;
        if (!conv.isGroup && otherUserId) {
          const user = await ctx.db.get(otherUserId as any);
          if (user && "name" in user) {
            otherUser = {
              _id: user._id.toString(),
              name: (user as any).name,
              imageUrl: (user as any).imageUrl,
              lastSeen: (user as any).lastSeen,
              isOnline: (user as any).isOnline,
            };
          }
        }

        let lastMessageContent = "";
        if (conv.lastMessage) {
          const msg = await ctx.db.get(conv.lastMessage as any);
          if (msg && "content" in msg) {
            lastMessageContent = (msg as any).isDeleted
              ? "This message was deleted"
              : (msg as any).content;
          }
        }

        return {
          _id: conv._id.toString(),
          _creationTime: conv._creationTime,
          isGroup: conv.isGroup,
          groupName: conv.groupName,
          groupImage: conv.groupImage,
          participants: conv.participants.map((p: any) => p.toString()),
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

    const conv = await ctx.db.get(args.conversationId as any);
    if (!conv) return null;
    if (!("participants" in conv)) return null;

    const participants = conv.participants.map((p: any) => p.toString());

    const otherUserId = participants.find(
      (p: string) => p !== args.currentUserId
    );

    let otherUser = null;
    if (!conv.isGroup && otherUserId) {
      const user = await ctx.db.get(otherUserId as any);
      if (user && "name" in user) {
        otherUser = {
          _id: user._id.toString(),
          name: (user as any).name,
          imageUrl: (user as any).imageUrl,
          lastSeen: (user as any).lastSeen,
          isOnline: (user as any).isOnline,
        };
      }
    }

    return {
      _id: conv._id.toString(),
      isGroup: conv.isGroup,
      groupName: conv.groupName ?? null,
      memberCount: participants.length,
      otherUser,
    };
  },
});

export const createGroupConversation = mutation({
  args: {
    participants: v.array(v.string()),
    groupName: v.string(),
    creatorId: v.string(),
  },
  handler: async (ctx, args) => {
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

    return conversationId.toString();
  },
});

export const getGroupConversations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    if (!args.userId || args.userId === "") return [];

    const allConversations = await ctx.db
      .query("conversations")
      .collect();

    const myGroups = allConversations.filter(
      (conv) =>
        conv.isGroup &&
        conv.participants.map((p: any) => p.toString()).includes(args.userId)
    );

    return await Promise.all(
      myGroups.map(async (conv) => {
        return {
          _id: conv._id.toString(),
          isGroup: conv.isGroup,
          groupName: conv.groupName,
          memberCount: conv.participants.length,
          participants: conv.participants.map((p: any) => p.toString()),
        };
      })
    );
  },
});

