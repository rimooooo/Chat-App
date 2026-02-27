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
    if (!args.clerkId || args.clerkId === "") return null;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        imageUrl: args.imageUrl,
        name: args.name,
        lastSeen: Date.now(),
        isOnline: true,
      });
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      clerkId: args.clerkId,
      isOnline: true,
      lastSeen: Date.now(),
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

export const heartbeat = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return;

    await ctx.db.patch(user._id, {
      isOnline: true,
      lastSeen: Date.now(),
    });
  },
});

export const checkOnlineStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;

    // If last seen more than 60 seconds ago → offline
    const sixtySecondsAgo = Date.now() - 60 * 1000;
    return user.lastSeen ? user.lastSeen > sixtySecondsAgo : false;
  },
});

export const setUserOnline = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return;
    await ctx.db.patch(user._id, { isOnline: true });
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
