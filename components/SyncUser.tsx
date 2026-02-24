"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export default function SyncUser() {
  const { user, isLoaded } = useUser();
  const createUser = useMutation(api.users.createUser);
  const setOffline = useMutation(api.users.setUserOffline);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Save user and set online
    const sync = async () => {
      await createUser({
        clerkId: user.id,
        name: user.fullName ?? "User",
        email: user.emailAddresses[0].emailAddress,
        imageUrl: user.imageUrl,
      });
    };

    sync();

    // Set offline when user leaves
    const handleOffline = async () => {
      await setOffline({ clerkId: user.id });
    };

    window.addEventListener("beforeunload", handleOffline);
    return () => window.removeEventListener("beforeunload", handleOffline);
  }, [isLoaded, user, createUser, setOffline]);

  return null;
}