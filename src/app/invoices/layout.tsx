
import ProtectedRoute from '@/components/protected-route';
import type { ReactNode } from 'react';

export default function InvoicesLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
