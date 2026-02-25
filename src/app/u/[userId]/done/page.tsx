import { client } from "@/lib/db";
import type { Task } from '@/types';
import Link from "next/link";

async function getDoneTasks(userId: string) {
  const result = await client.execute({
    sql: "SELECT * FROM tasks WHERE user_id = ? AND list = 'done' ORDER BY updated_at DESC",
    args: [userId],
  });
  return result.rows.map((r: any): Task => ({
    id: String(r.id),
    user_id: String(r.user_id),
    content: String(r.content),
    list: String(r.list) as Task['list'],
    created_at: r.created_at ? Number(r.created_at) : null,
    updated_at: r.updated_at ? Number(r.updated_at) : null,
  }));
}

export default async function DonePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const tasks = await getDoneTasks(userId);

  return (
    <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '20px' }}>
        <Link href={`/u/${userId}`} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>← Back to Home</Link>
      </header>

      <h1 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Done Tasks</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tasks.length === 0 && <p style={{ color: 'var(--text-gray)' }}>No completed tasks yet.</p>}
        {tasks.map((task: any) => (
          <Link 
            key={task.id} 
            href={`/u/${userId}/tasks/${task.id}`}
            style={{ 
              padding: '15px', 
              backgroundColor: 'var(--gray)', 
              borderRadius: '10px',
              textDecoration: 'none',
              color: 'inherit',
              display: 'block'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{task.content}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Completed: {new Date(task.updated_at * 1000).toLocaleString()}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
