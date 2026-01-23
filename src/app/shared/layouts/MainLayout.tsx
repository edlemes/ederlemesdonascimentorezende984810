import { PropsWithChildren } from 'react';

export default function MainLayout({ children }: PropsWithChildren) {
  return (
    <div style={{ display: 'grid', minHeight: '100vh', gridTemplateRows: 'auto 1fr auto' }}>
      <header style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
        <strong>App</strong>
      </header>
      <main style={{ padding: 16 }}>{children}</main>
      <footer style={{ padding: 12, borderTop: '1px solid #e5e7eb' }}>
        <small>© {new Date().getFullYear()}</small>
      </footer>
    </div>
  );
}
