import { useCallback, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { SplashScreen } from './components/SplashScreen';
import { Home } from './pages/Home';
import { Tasks } from './pages/Tasks';
import { Tracker } from './pages/Tracker';

export default function App() {
  const [splashDone, setSplashDone] = useState(
    () => localStorage.getItem('memento_splash_seen') === '1'
  );

  const onSplashComplete = useCallback(() => {
    localStorage.setItem('memento_splash_seen', '1');
    setSplashDone(true);
  }, []);

  if (!splashDone) {
    return <SplashScreen onComplete={onSplashComplete} />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tracker" element={<Tracker />} />
      </Routes>
    </AppLayout>
  );
}
