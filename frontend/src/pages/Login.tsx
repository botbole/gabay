import { useState, type FormEvent } from 'react';
import { AlertCircle, LogIn } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAppConfig } from '../contexts/AppConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';

interface LoginLocationState {
  from?: {
    pathname: string;
  };
}

function authenticatedDestination(pathname?: string) {
  switch (pathname) {
    case '/congregants': return '/congregants';
    case '/payments': return '/payments';
    case '/seating': return '/seating';
    case '/aliyot': return '/aliyot';
    case '/azkarot': return '/azkarot';
    case '/smachot': return '/smachot';
    case '/calendar': return '/calendar';
    case '/schedule': return '/schedule';
    case '/import': return '/import';
    case '/chat': return '/chat';
    default: return '/';
  }
}

function loginErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'שם המשתמש או הסיסמה אינם נכונים.';
  }
  if (error instanceof Error && error.message.startsWith('הכניסה')) {
    return error.message;
  }
  return 'לא ניתן להתחבר כעת. יש לנסות שוב בעוד רגע.';
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = useAppConfig();
  const { isAuthenticated, isInitializing, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const state = location.state as LoginLocationState | null;
  const destination = authenticatedDestination(state?.from?.pathname);

  if (!isInitializing && isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('יש להזין שם משתמש וסיסמה.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(loginErrorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const synagogueName = config?.synagogue_name ?? 'גבאי';

  return (
    <main className="min-h-screen bg-(--color-bg) flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden shadow-xl border-0">
          <div
            className="px-8 py-8 text-center text-white"
            style={{ backgroundColor: 'var(--color-indigo)' }}
          >
            <div
              className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg"
              style={{ backgroundColor: 'var(--color-gold)' }}
            >
              {config?.logo_url ? (
                <img src={config.logo_url} alt={`לוגו ${synagogueName}`} className="h-full w-full object-cover" />
              ) : (
                <span>ג</span>
              )}
            </div>
            <p className="text-xl font-bold">{synagogueName}</p>
            <p className="mt-1 text-sm text-white/65">מערכת ניהול בית הכנסת</p>
          </div>

          <CardContent className="p-8">
            <PageHeader
              title="כניסה למערכת"
              subtitle="הזינו את פרטי המשתמש שקיבלתם ממנהל המערכת"
              className="justify-center text-center mb-6"
            />

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="שם משתמש"
                autoComplete="username"
                value={username}
                onChange={event => setUsername(event.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              <Input
                label="סיסמה"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                disabled={isSubmitting}
              />

              {error && (
                <div
                  className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                loading={isSubmitting || isInitializing}
                className="w-full"
              >
                <LogIn className="h-4 w-4" />
                כניסה
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
