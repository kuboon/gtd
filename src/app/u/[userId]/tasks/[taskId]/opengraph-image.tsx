import { ImageResponse } from 'next/og';
import { client } from '@/lib/db';
import type { Task } from '@/types';

export const runtime = 'edge';
export const alt = 'tindone task';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const result = await client.execute({
    sql: "SELECT content, list FROM tasks WHERE id = ?",
    args: [taskId],
  });

  const row = result.rows[0] as any | undefined;
  const task: Partial<Task> | undefined = row
    ? {
        id: String(row.id),
        user_id: row.user_id ? String(row.user_id) : '',
        content: row.content ? String(row.content) : undefined,
        list: row.list ? (String(row.list) as Task['list']) : undefined,
        created_at: row.created_at ? Number(row.created_at) : null,
        updated_at: row.updated_at ? Number(row.updated_at) : null,
      }
    : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #ff4458, #ff6b6b)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 20, opacity: 0.8 }}>tindone task</div>
        <div style={{ fontSize: 80, fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 }}>
          {String(task?.content || 'Task not found')}
        </div>
        <div style={{ fontSize: 40, marginTop: 40, padding: '10px 30px', background: 'rgba(255,255,255,0.2)', borderRadius: 20 }}>
          List: {String(task?.list || 'unknown').toUpperCase()}
        </div>
      </div>
    ),
    { ...size }
  );
}
