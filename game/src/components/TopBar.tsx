import React from 'react';
import './TopBar.css';

export default function TopBar({ time }: { time: string }) {
  return (
    <header className="top-bar">
      <span className="top-bar-time">{time}</span>
    </header>
  );
}
