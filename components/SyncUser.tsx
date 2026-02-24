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
      await createUser({
        clerkId: user.id,
        name: user.fullName ?? "User",
        email: user.emailAddresses[0].emailAddress,
        imageUrl: user.imageUrl,
      });

      // Send first heartbeat immediately
      await sendHeartbeat({ clerkId: user.id });
    };

    sync();

    // Send heartbeat every 30 seconds
    const interval = setInterval(() => {
      sendHeartbeat({ clerkId: user.id });
    }, 30000);

    // Set offline when tab closes
    const handleOffline = () => {
      setOffline({ clerkId: user.id });
    };

    window.addEventListener("beforeunload", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, [isLoaded, user]);

  return null;
}