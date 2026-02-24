import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create user when they sign up via Clerk
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) return existingUser._id;

    // Create new user
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      clerkId: args.clerkId,
      isOnline: true,
    });

    return userId;
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return user;
  },
});

// Get all users except the logged in user
export const getUsers = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    return users.filter((u) => u.clerkId !== args.clerkId);
  },
});

// Update online status
export const updateOnlineStatus = mutation({
  args: {
    clerkId: v.string(),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return;

    await ctx.db.patch(user._id, { isOnline: args.isOnline });
  },
});

// function that sets user offline when they leave
export const setUserOffline = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return;
    await ctx.db.patch(user._id, { isOnline: false });
  },
});