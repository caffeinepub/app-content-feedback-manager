import { useEffect, useState } from "react";

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeUntilMidnight(): CountdownTime {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, minutes, seconds };
}

export function useCountdown(): CountdownTime {
  const [time, setTime] = useState<CountdownTime>(getTimeUntilMidnight);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}
