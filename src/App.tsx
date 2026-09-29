import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '@/store/auth';
import { Spinner } from '@/components/layout/Spinner';

export function App() {
  const { bootstrap, ready } = useAuthStore();

  useEffect(() => { bootstrap(); }, [bootstrap]);

  if (!ready) return <Spinner />;

  return <RouterProvider router={router} />;
}