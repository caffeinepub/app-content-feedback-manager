import { useEffect, useRef, useState } from "react";

export function useBackgroundMusic(
  musicUrl: string | null,
  isEnabled: boolean,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    if (!musicUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
        setAutoplayBlocked(false);
      }
      return;
    }

    // Create or update audio element imperatively (not JSX)
    if (!audioRef.current) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
    } else if (audioRef.current.src !== musicUrl) {
      audioRef.current.src = musicUrl;
    }

    if (isEnabled) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setAutoplayBlocked(true);
        });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [musicUrl, isEnabled]);

  /** Attempt playback — call this from a user interaction handler */
  const startPlayback = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => {});
    }
  };

  const play = () => startPlayback();

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return { isPlaying, autoplayBlocked, startPlayback, play, pause };
}
