'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUserId = localStorage.getItem('tindone_user_id');
    if (savedUserId) {
      router.push(`/u/${savedUserId}`);
    }
  }, [router]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const userId = nanoid();
      
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });

      if (res.ok) {
        localStorage.setItem('tindone_user_id', userId);
        router.push(`/u/${userId}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: '900', letterSpacing: '-2px' }}>tindone</h1>
      <p style={{ marginBottom: '2.5rem', color: 'var(--text-gray)', fontSize: '1.2rem' }}>
        Swipe your way to GTD nirvana.
      </p>
      <button 
        onClick={handleStart}
        disabled={loading}
        style={{
          backgroundColor: 'var(--primary)',
          color: 'white',
          padding: '18px 50px',
          borderRadius: '40px',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(255, 68, 88, 0.4)'
        }}
      >
        {loading ? 'Setting up...' : 'Get Started'}
      </button>
    </main>
  );
}
