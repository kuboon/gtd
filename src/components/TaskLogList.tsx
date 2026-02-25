'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TaskLogList({ userId, taskId, logs }: { userId: string, taskId: string, logs: any[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (logId: string) => {
    if (deletingId) return;
    setDeletingId(logId);
    try {
      const res = await fetch(`/api/u/${userId}/tasks/${taskId}/logs/${logId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {logs.map((log: any) => (
        <div key={log.id} style={{ padding: '10px', backgroundColor: 'var(--gray)', borderRadius: '10px', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{log.from_list || 'created'} → <strong>{log.to_list}</strong></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ opacity: 0.5 }}>{new Date(log.created_at * 1000).toLocaleString()}</span>
              <button 
                onClick={() => handleDelete(log.id)}
                disabled={deletingId === log.id}
                style={{ color: '#ff4458', fontSize: '0.8rem', padding: '5px' }}
              >
                {deletingId === log.id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
