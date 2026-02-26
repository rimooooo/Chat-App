import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SyncUser from "@/components/SyncUser";

export default async function Home() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex h-screen bg-gray-100">
      <SyncUser />
      <Sidebar />
      {/* Desktop empty state */}
      <div className="hidden md:flex flex-1 items-center justify-center">
        <p className="text-gray-500 text-lg">
          Select a conversation to start chatting 💬
        </p>
      </div>
    </div>
  );
}
