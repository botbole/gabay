import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex h-screen bg-blue-50" dir="rtl">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <Outlet />
      </main>
    </div>
  );
}
