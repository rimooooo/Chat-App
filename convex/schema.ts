import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // user table
  users: defineTable({
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
    clerkId: v.string(),
    isOnline: v.boolean(),
    lastSeen: v.optional(v.number()),
    publicKey: v.optional(v.string()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  //conversations table
  conversations: defineTable({
    participants: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    groupImage: v.optional(v.string()),
    lastMessage: v.optional(v.id("messages")),
  }),

  // messages table
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video")
    ),
    isRead: v.optional(v.boolean()),
    isDeleted: v.optional(v.boolean()),
    reactions: v.optional(
      v.array(
        v.object({
          userId: v.id("users"),
          emoji: v.string(),
        })
      )
    ),
  }).index("by_conversationId", ["conversationId"]),

  // typing table (lasttyped)
  typing: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastTyped: v.number(),
  }),

});

