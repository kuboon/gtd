'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TaskForm({ userId }: { userId: string }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/u/${userId}/inbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setContent('');
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
      <input
        type="text"
        maxLength={100}
        placeholder="What needs to be done?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          flex: 1,
          padding: '12px 15px',
          borderRadius: '10px',
          border: '1px solid #ddd',
          fontSize: '1rem'
        }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          backgroundColor: 'var(--primary)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '10px',
          fontWeight: 'bold'
        }}
      >
        Add
      </button>
    </form>
  );
}
