"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export default function SyncUser() {
  const { user, isLoaded } = useUser();
  const createUser = useMutation(api.users.createUser);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const sync = async () => {
      await createUser({
        clerkId: user.id,
        name: user.fullName ?? "User",
        email: user.emailAddresses[0].emailAddress,
        imageUrl: user.imageUrl,
      });
    };

    sync();
  }, [isLoaded, user, createUser]);

  return null;
}