import PushSubscriptionSync from "@/components/PushSubscriptionSync";

export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <>
      <PushSubscriptionSync userId={userId} />
      {children}
    </>
  );
}
