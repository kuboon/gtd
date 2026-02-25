import { client } from "@/lib/db";
import type { Task, TaskLog } from '@/types';
import { notFound } from "next/navigation";
import Link from "next/link";
import ListSelector from "@/components/ListSelector";
import TaskLogList from "@/components/TaskLogList";

async function getTaskData(taskId: string): Promise<{ task: Task; logs: TaskLog[] } | null> {
  const taskResult = await client.execute({
    sql: "SELECT * FROM tasks WHERE id = ?",
    args: [taskId],
  });
  
  if (taskResult.rows.length === 0) return null;

  const logsResult = await client.execute({
    sql: "SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at DESC",
    args: [taskId],
  });

  const taskRow = taskResult.rows[0];
  const task: Task = {
    id: String(taskRow.id),
    user_id: String(taskRow.user_id),
    content: String(taskRow.content),
    list: String(taskRow.list) as Task['list'],
    created_at: taskRow.created_at ? Number(taskRow.created_at) : null,
    updated_at: taskRow.updated_at ? Number(taskRow.updated_at) : null,
  };

  const logs: TaskLog[] = logsResult.rows.map((r: any) => ({
    id: String(r.id),
    task_id: String(r.task_id),
    from_list: r.from_list ?? null,
    to_list: String(r.to_list) as TaskLog['to_list'],
    created_at: r.created_at ? Number(r.created_at) : null,
  }));

  return { task, logs };
}

export async function generateMetadata({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const result = await client.execute({
    sql: "SELECT content FROM tasks WHERE id = ?",
    args: [taskId],
  });
  const task = result.rows[0];
  return {
    title: task ? `${task.content} | tindone` : 'Task not found',
  };
}

export default async function TaskDetailPage({ params }: { params: Promise<{ userId: string, taskId: string }> }) {
  const { userId, taskId } = await params;
  const data = await getTaskData(taskId);
  if (!data) notFound();

  const { task, logs } = data;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const apiPath = `/api/u/${userId}/tasks/${taskId}`;
  const apiUrl = `${baseUrl}${apiPath}`;

  const curlCommand = `curl -X PATCH ${apiUrl} -H "Content-Type: application/json" -d '{"list":"now"}'`;
  const wgetCommand = `wget --method=PATCH --body-data='{"list":"now"}' --header="Content-Type: application/json" ${apiUrl}`;

  return (
    <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '20px' }}>
        <Link href={`/u/${userId}`} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>← Back to Home</Link>
      </header>

      <section style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>{String(task.content)}</h1>
        <div style={{ color: 'var(--text-gray)' }}>Current List: <span style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>{String(task.list).toUpperCase()}</span></div>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Move to:</h2>
        <ListSelector userId={userId} taskId={taskId} currentList={String(task.list)} />
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>History</h2>
        <TaskLogList userId={userId} taskId={taskId} logs={logs} />
      </section>

      <section style={{ padding: '20px', backgroundColor: '#f8f8f8', borderRadius: '15px', border: '1px dashed #ccc' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '10px' }}>Remote Update Commands</h2>
        <div style={{ marginBottom: '15px' }}>
          <p style={{ fontSize: '0.8rem', marginBottom: '5px', opacity: 0.7 }}>cURL:</p>
          <code style={{ fontSize: '0.75rem', display: 'block', wordBreak: 'break-all', backgroundColor: '#eee', padding: '10px', borderRadius: '5px' }}>
            {curlCommand}
          </code>
        </div>
        <div>
          <p style={{ fontSize: '0.8rem', marginBottom: '5px', opacity: 0.7 }}>Wget:</p>
          <code style={{ fontSize: '0.75rem', display: 'block', wordBreak: 'break-all', backgroundColor: '#eee', padding: '10px', borderRadius: '5px' }}>
            {wgetCommand}
          </code>
        </div>
      </section>
    </main>
  );
}
