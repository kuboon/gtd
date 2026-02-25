'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ListSelector({ userId, taskId, currentList }: { userId: string, taskId: string, currentList: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMove = async (list: string) => {
    if (list === currentList || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/u/${userId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const lists = ['inbox', 'now', 'next', 'waiting', 'done'];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {lists.map(list => (
        <button
          key={list}
          disabled={loading || list === currentList}
          onClick={() => handleMove(list)}
          style={{
            padding: '8px 15px',
            borderRadius: '20px',
            backgroundColor: list === currentList ? 'var(--primary)' : 'var(--gray)',
            color: list === currentList ? 'white' : 'var(--foreground)',
            fontWeight: 'bold',
            opacity: list === currentList ? 1 : 0.7,
            cursor: list === currentList ? 'default' : 'pointer'
          }}
        >
          {list.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
