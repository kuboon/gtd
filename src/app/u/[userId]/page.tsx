import { client } from "@/lib/db";
import Link from "next/link";
import TaskForm from "@/components/TaskForm";

async function getListCounts(userId: string) {
  const result = await client.execute({
    sql: "SELECT list, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY list",
    args: [userId],
  });
  
  const counts: Record<string, number> = {
    inbox: 0,
    now: 0,
    next: 0,
    waiting: 0,
    done: 0,
  };

  result.rows.forEach((row) => {
    counts[row.list as string] = Number(row.count);
  });

  return counts;
}

export default async function UserHome({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const counts = await getListCounts(userId);

  const lists = [
    { id: 'inbox', label: 'Inbox', color: '#007aff' },
    { id: 'now', label: 'Now', color: '#ff2d55' },
    { id: 'next', label: 'Next', color: '#ffcc00' },
    { id: 'waiting', label: 'Waiting', color: '#5856d6' },
  ];

  return (
    <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--primary)' }}>tindone</h1>
      </header>

      <section style={{ marginBottom: '30px' }}>
        <TaskForm userId={userId} />
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {lists.map((list) => (
          <Link 
            key={list.id} 
            href={`/u/${userId}/swipe/${list.id}`}
            style={{
              backgroundColor: 'var(--gray)',
              padding: '20px',
              borderRadius: '15px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              position: 'relative'
            }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{list.label}</span>
            <span style={{ fontSize: '2rem', color: list.color }}>{counts[list.id]}</span>
          </Link>
        ))}
      </div>

      <section style={{ marginTop: '40px', padding: '20px', backgroundColor: 'var(--gray)', borderRadius: '15px' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Quick API</h2>
        <code style={{ fontSize: '0.8rem', display: 'block', wordBreak: 'break-all', opacity: 0.7 }}>
          POST /api/u/{userId}/inbox<br/>
          {`{ "content": "buy milk" }`}
        </code>
      </section>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link href={`/u/${userId}/done`} style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
          View Done Tasks ({counts.done})
        </Link>
      </div>
    </main>
  );
}
