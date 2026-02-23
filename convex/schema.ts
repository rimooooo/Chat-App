import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
    clerkId: v.string(),
    isOnline: v.boolean(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    groupImage: v.optional(v.string()),
    lastMessage: v.optional(v.id("messages")),
  }),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video")
    ),
  }).index("by_conversationId", ["conversationId"]),
});
