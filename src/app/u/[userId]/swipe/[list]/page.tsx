import { client } from "@/lib/db";
import SwipeContainer from "@/components/SwipeContainer";
import type { Task } from '@/types';
import { notFound } from "next/navigation";

async function getTasks(userId: string, list: string) {
  const result = await client.execute({
    sql: "SELECT * FROM tasks WHERE user_id = ? AND list = ? ORDER BY created_at ASC",
    args: [userId, list],
  });
  return result.rows.map((row: any): Task => ({
    id: String(row.id),
    user_id: String(row.user_id),
    content: String(row.content),
    list: String(row.list) as Task['list'],
    created_at: row.created_at ? Number(row.created_at) : null,
    updated_at: row.updated_at ? Number(row.updated_at) : null,
  }));
}

export default async function SwipePage({ params }: { params: Promise<{ userId: string, list: string }> }) {
  const { userId, list } = await params;
  const validLists = ['inbox', 'now', 'next', 'waiting'];
  
  if (!validLists.includes(list)) {
    notFound();
  }

  const tasks = await getTasks(userId, list);

  return (
    <main style={{ height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#000', position: 'relative' }}>
      <SwipeContainer initialTasks={tasks} userId={userId} currentList={list} />
    </main>
  );
}
