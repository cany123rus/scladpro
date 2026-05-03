import React, { useState, useEffect } from 'react';

interface ClockProps {
  className?: string;
}

export const Clock: React.FC<ClockProps> = ({ className = '' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className={`clock ${className}`}>
      {formatTime()}
    </div>
  );
};

export default Clock;