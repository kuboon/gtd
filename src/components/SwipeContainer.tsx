'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Task {
  id: string;
  content: string;
  list: string;
}

interface SwipeContainerProps {
  initialTasks: Task[];
  userId: string;
  currentList: string;
}

export default function SwipeContainer({ initialTasks, userId, currentList }: SwipeContainerProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const currentTask = tasks[currentIndex];

  const handleSwipe = async (direction: 'right' | 'left' | 'up' | 'down') => {
    if (!currentTask) return;

    let targetList = '';
    
    if (direction === 'up') targetList = 'done';
    else {
      switch (currentList) {
        case 'inbox':
          if (direction === 'right') targetList = 'now';
          if (direction === 'left') targetList = 'next';
          if (direction === 'down') targetList = 'waiting';
          break;
        case 'now':
          if (direction === 'right') targetList = 'now'; // back to end of now
          if (direction === 'left') targetList = 'next';
          if (direction === 'down') targetList = 'waiting';
          break;
        case 'waiting':
          if (direction === 'right') targetList = 'now';
          if (direction === 'left') targetList = 'next';
          if (direction === 'down') targetList = 'waiting'; // back to end of waiting
          break;
        case 'next':
          if (direction === 'right') targetList = 'now';
          if (direction === 'left') targetList = 'next'; // back to end of next
          if (direction === 'down') targetList = 'waiting';
          break;
      }
    }

    // Call API to update task list
    const res = await fetch(`/api/u/${userId}/tasks/${currentTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list: targetList }),
    });

    if (res.ok) {
      if (currentIndex + 1 >= tasks.length) {
        // Session finished for this list
        handleTransition();
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }
  };

  const handleTransition = () => {
    switch (currentList) {
      case 'inbox':
        router.push(`/u/${userId}/swipe/now`);
        break;
      case 'now':
        router.push(`/u/${userId}/swipe/waiting`);
        break;
      case 'waiting':
        // logic: after waiting, if now has items go now, else next
        // Since we are in a client component and don't easily know other list counts here, 
        // we'll just follow the sequence or redirect to home to refresh state.
        router.push(`/u/${userId}/swipe/next`);
        break;
      case 'next':
        router.push(`/u/${userId}`);
        break;
      default:
        router.push(`/u/${userId}`);
    }
  };

  if (tasks.length === 0 || currentIndex >= tasks.length) {
    return (
      <div style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <h2>No more tasks in {currentList}</h2>
        <button 
          onClick={handleTransition}
          style={{ marginTop: '20px', color: 'var(--primary)', fontWeight: 'bold' }}
        >
          Next List →
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AnimatePresence>
        <SwipeCard 
          key={currentTask.id}
          task={currentTask} 
          onSwipe={handleSwipe} 
          userId={userId}
          list={currentList}
        />
      </AnimatePresence>
      
      <div style={{ position: 'absolute', top: '20px', left: '20px', color: 'white' }}>
        <Link href={`/u/${userId}`} style={{ opacity: 0.7 }}>← Home</Link>
      </div>
      <div style={{ position: 'absolute', top: '20px', right: '20px', color: 'white', fontWeight: 'bold' }}>
        {currentList.toUpperCase()} ({currentIndex + 1}/{tasks.length})
      </div>
    </div>
  );
}

function SwipeCard({ task, onSwipe, userId, list }: { task: Task, onSwipe: (dir: any) => void, userId: string, list: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  // Hints
  const rightHint = useTransform(x, [20, 100], [0, 1]);
  const leftHint = useTransform(x, [-20, -100], [0, 1]);
  const upHint = useTransform(y, [-20, -100], [0, 1]);
  const downHint = useTransform(y, [20, 100], [0, 1]);

  const getLabel = (dir: 'right' | 'left' | 'up' | 'down') => {
    if (dir === 'up') return 'DONE';
    switch (list) {
      case 'inbox':
        if (dir === 'right') return 'NOW';
        if (dir === 'left') return 'NEXT';
        if (dir === 'down') return 'WAIT';
        break;
      case 'now':
        if (dir === 'right') return 'RE-NOW';
        if (dir === 'left') return 'NEXT';
        if (dir === 'down') return 'WAIT';
        break;
      case 'waiting':
        if (dir === 'right') return 'NOW';
        if (dir === 'left') return 'NEXT';
        if (dir === 'down') return 'RE-WAIT';
        break;
      case 'next':
        if (dir === 'right') return 'NOW';
        if (dir === 'left') return 'RE-NEXT';
        if (dir === 'down') return 'WAIT';
        break;
    }
    return '';
  };

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) onSwipe('right');
    else if (info.offset.x < -100) onSwipe('left');
    else if (info.offset.y < -100) onSwipe('up');
    else if (info.offset.y > 100) onSwipe('down');
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      style={{
        x, y, rotate,
        position: 'absolute',
        width: '90%',
        maxWidth: '400px',
        height: '70%',
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        cursor: 'grab',
        zIndex: 10
      }}
      whileTap={{ cursor: 'grabbing' }}
    >
      <Link href={`/u/${userId}/tasks/${task.id}`} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', textAlign: 'center', color: '#111', wordBreak: 'break-word' }}>
          {task.content}
        </h2>
      </Link>

      {/* Visual Hints */}
      <motion.div style={{ opacity: rightHint, position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#4caf50', fontWeight: 'bold', fontSize: '2rem', border: '4px solid #4caf50', padding: '10px', borderRadius: '10px' }}>
        {getLabel('right')}
      </motion.div>
      <motion.div style={{ opacity: leftHint, position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#f44336', fontWeight: 'bold', fontSize: '2rem', border: '4px solid #f44336', padding: '10px', borderRadius: '10px' }}>
        {getLabel('left')}
      </motion.div>
      <motion.div style={{ opacity: upHint, position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', color: '#2196f3', fontWeight: 'bold', fontSize: '2rem', border: '4px solid #2196f3', padding: '10px', borderRadius: '10px' }}>
        {getLabel('up')}
      </motion.div>
      <motion.div style={{ opacity: downHint, position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', color: '#9c27b0', fontWeight: 'bold', fontSize: '2rem', border: '4px solid #9c27b0', padding: '10px', borderRadius: '10px' }}>
        {getLabel('down')}
      </motion.div>
    </motion.div>
  );
}
