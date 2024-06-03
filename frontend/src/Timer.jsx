import React, { useEffect, useState } from 'react';

const Timer = () => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="loader mb-4"></div>
      <p className="text-white text-lg">Processing... {time} seconds</p>
      <style jsx>{`
        .loader {
          border: 8px solid #f3f3f3;
          border-radius: 50%;
          border-top: 8px solid #3498db;
          width: 50px;
          height: 50px;
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Timer;
