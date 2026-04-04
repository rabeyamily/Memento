import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';

export function SplashScreen({ onComplete }) {
  const navigate = useNavigate();
  const { settings } = useAppState();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setExiting(true), 2200);
    const doneTimer = window.setTimeout(() => {
      navigate('/', { replace: true });
      onComplete?.();
    }, 2700);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [navigate, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-dot-grid"
      style={{
        '--dot-color': settings.dotColor,
        '--bg-color': settings.bgColor,
        '--accent-dark': settings.accentDark,
      }}
    >
      <h1
        className="font-splash px-4 text-center font-semibold tracking-[0.2em]"
        style={{
          fontSize: 'clamp(4rem, 15vw, 6rem)',
          color: 'var(--accent-dark)',
          animation: exiting
            ? 'splash-out 0.4s ease-in forwards'
            : 'splash-in 0.9s ease-out 0.2s forwards',
        }}
      >
        Memento
      </h1>
    </div>
  );
}
