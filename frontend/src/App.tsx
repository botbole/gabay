import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppConfigProvider } from './contexts/AppConfigContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Congregants } from './pages/Congregants';
import { Payments } from './pages/Payments';
import { Seating } from './pages/Seating';
import { Azkarot } from './pages/Azkarot';
import { Smachot } from './pages/Smachot';
import { Calendar } from './pages/Calendar';
import { Import } from './pages/Import';
import { Chat } from './pages/Chat';
import { Aliyot } from './pages/Aliyot';
import { PrayerSchedule } from './pages/PrayerSchedule';
import { Login } from './pages/Login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppConfigProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute allowedRoles={['admin', 'gabai']} />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/congregants" element={<Congregants />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/seating" element={<Seating />} />
                  <Route path="/aliyot" element={<Aliyot />} />
                  <Route path="/azkarot" element={<Azkarot />} />
                  <Route path="/smachot" element={<Smachot />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/schedule" element={<PrayerSchedule />} />
                  <Route path="/import" element={<Import />} />
                  <Route path="/chat" element={<Chat />} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </AppConfigProvider>
    </QueryClientProvider>
  );
}
