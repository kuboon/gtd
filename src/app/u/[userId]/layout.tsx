import { redirect } from "next/navigation";
import PushSubscriptionSync from "@/components/PushSubscriptionSync";
import LogoutButton from "@/components/LogoutButton";
import { getSessionUserId } from "@/lib/auth";

export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  // Defense in depth: middleware already enforces this, but make the gtd user
  // id authoritative for child server components too.
  const sessionUserId = await getSessionUserId();
  if (sessionUserId !== userId) {
    redirect("/");
  }

  return (
    <>
      <PushSubscriptionSync userId={userId} />
      <div
        style={{
          position: "fixed",
          top: "8px",
          right: "12px",
          zIndex: 100,
        }}
      >
        <LogoutButton />
      </div>
      {children}
    </>
  );
}
