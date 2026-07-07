import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { SocketProvider } from '@/providers/SocketProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </SocketProvider>
  );
}
