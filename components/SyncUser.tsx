"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export default function SyncUser() {
  const { user, isLoaded } = useUser();
  const createUser = useMutation(api.users.createUser);
  const sendHeartbeat = useMutation(api.users.heartbeat);
  const setOffline = useMutation(api.users.setUserOffline);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const sync = async () => {
      try {
        const userId = await createUser({
          clerkId: user.id,
          name: user.fullName ?? user.firstName ?? "User",
          email: user.emailAddresses[0].emailAddress,
          imageUrl: user.imageUrl ?? "",
        });
        console.log("✅ User synced to Convex:", userId);

        await sendHeartbeat({ clerkId: user.id });
        console.log("✅ Heartbeat sent");
      } catch (err) {
        console.error("❌ SyncUser failed:", err);
      }
    };

    sync();

    const interval = setInterval(async () => {
      try {
        await sendHeartbeat({ clerkId: user.id });
      } catch (err) {
        console.error("❌ Heartbeat failed:", err);
      }
    }, 30000);

    const handleOffline = async () => {
      try {
        await setOffline({ clerkId: user.id });
      } catch (err) {
        console.error("❌ SetOffline failed:", err);
      }
    };

    window.addEventListener("beforeunload", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, [isLoaded, user]);

  return null;
}