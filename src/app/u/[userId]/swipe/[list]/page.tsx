import { client } from "@/lib/db";
import SwipeContainer from "@/components/SwipeContainer";
import type { Task } from "@/types";
import { notFound } from "next/navigation";

async function getTasks(userId: string, list: string) {
  const result = await client.execute({
    sql: "SELECT * FROM tasks WHERE user_id = ? AND list = ? ORDER BY created_at ASC",
    args: [userId, list],
  });
  return result.rows.map((row): Task => {
    const mapped = row as Record<string, unknown>;
    return {
      id: String(mapped.id),
      user_id: String(mapped.user_id),
      content: String(mapped.content),
      list: String(mapped.list) as Task["list"],
      created_at: mapped.created_at ? Number(mapped.created_at) : null,
      updated_at: mapped.updated_at ? Number(mapped.updated_at) : null,
    };
  });
}

export default async function SwipePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; list: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { userId, list } = await params;
  const { from } = await searchParams;
  const validLists = ["inbox", "now", "next", "waiting"];

  if (!validLists.includes(list)) {
    notFound();
  }

  const tasks = await getTasks(userId, list);

  return (
    <main
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "#000",
        position: "relative",
      }}
    >
      <SwipeContainer
        initialTasks={tasks}
        userId={userId}
        currentList={list}
        fromList={validLists.includes(from ?? "") ? from : undefined}
      />
    </main>
  );
}
