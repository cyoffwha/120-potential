import { useState, useEffect } from "react";
export const Timer = () => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    setSeconds(0); // Always reset when starting
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
    // Only restart when running toggles to true
  }, [running]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <span className="text-[#223971]">⏱️</span>
      <span className="text-[#223971]">{formatTime(seconds)}</span>
      <button
        className={`ml-2 px-2 py-1 rounded text-xs font-semibold border ${running ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
        onClick={() => setRunning(r => !r)}
        aria-label={running ? 'Stop timer' : 'Start timer'}
        style={{ minWidth: 60 }}
      >
        {running ? 'Stop' : 'Start'}
      </button>
    </div>
  );
};