import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import { useIsAuthenticated, useIsStudent, useIsTeacher, useIsAdmin } from './stores';
import { LoginPage, StudentDashboard, TeacherDashboard, AdminDashboard } from './pages';
import { AppLayout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

// Protected route wrapper
function ProtectedRoute({ allowedRoles }: { allowedRoles?: ('student' | 'teacher' | 'admin')[] }) {
  const isAuthenticated = useIsAuthenticated();
  const isStudent = useIsStudent();
  const isTeacher = useIsTeacher();
  const isAdmin = useIsAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const hasAccess = allowedRoles.some(role => {
      if (role === 'student') return isStudent;
      if (role === 'teacher') return isTeacher && !isAdmin;
      if (role === 'admin') return isAdmin;
      return false;
    });

    // Admins can access both /admin and /teacher routes
    const adminCanAccessTeacher = isAdmin && allowedRoles.includes('teacher');
    if (!hasAccess && !adminCanAccessTeacher) {
      // Redirect to appropriate dashboard
      if (isStudent) return <Navigate to="/student" replace />;
      if (isAdmin) return <Navigate to="/admin" replace />;
      if (isTeacher) return <Navigate to="/teacher" replace />;
    }
  }

  return <AppLayout><Outlet /></AppLayout>;
}

function DefaultRedirect() {
  const isAuthenticated = useIsAuthenticated();
  const isStudent = useIsStudent();
  const isAdmin = useIsAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (isStudent) return <Navigate to="/student" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <Navigate to="/teacher" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <ErrorBoundary>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Student routes */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student" element={<StudentDashboard />} />
            </Route>

            {/* Teacher routes (teachers and admins can access - admins need award/raffle tools) */}
            <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Default redirect - send authenticated users to their dashboard */}
            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
