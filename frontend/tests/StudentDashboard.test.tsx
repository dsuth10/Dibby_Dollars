import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '../src/theme';
import { StudentDashboard } from '../src/pages/StudentDashboard';
import * as api from '../src/services/api';
import { useUser } from '../src/stores';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

vi.mock('../src/services/api', () => ({
  balanceApi: {
    getMe: vi.fn(),
  },
  transactionsApi: {
    list: vi.fn(),
  },
}));

vi.mock('../src/stores', () => ({
  useUser: vi.fn(),
}));

describe('StudentDashboard', () => {
  beforeEach(() => {
    vi.mocked(useUser).mockReturnValue({
      id: 1,
      username: 'student1',
      firstName: 'Test',
      lastName: 'Student',
      role: 'student',
      className: '5A',
      balance: 42,
      isActive: true,
    } as ReturnType<typeof useUser>);
    vi.mocked(api.balanceApi.getMe).mockResolvedValue({
      data: {
        success: true,
        balance: 42,
        interestEarned: 5,
        rank: 3,
        totalStudents: 100,
      },
    } as Awaited<ReturnType<typeof api.balanceApi.getMe>>);
    vi.mocked(api.transactionsApi.list).mockResolvedValue({
      data: {
        success: true,
        transactions: [
          {
            id: 1,
            amount: 1,
            type: 'award',
            categoryName: 'On Task',
            notes: null,
            createdAt: '2025-02-01T12:00:00Z',
          },
        ],
      },
    } as Awaited<ReturnType<typeof api.transactionsApi.list>>);
  });

  it('shows loading state initially', () => {
    vi.mocked(api.balanceApi.getMe).mockImplementation(() => new Promise(() => {}));
    vi.mocked(api.transactionsApi.list).mockImplementation(() => new Promise(() => {}));
    render(<StudentDashboard />, { wrapper });
    expect(document.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('renders welcome message with user first name', async () => {
    render(<StudentDashboard />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/Welcome, Test!/)).toBeInTheDocument();
    });
  });

  it('displays balance from API', async () => {
    render(<StudentDashboard />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('42 DB$')).toBeInTheDocument();
    });
  });

  it('displays savings rank', async () => {
    render(<StudentDashboard />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/#3 of 100/)).toBeInTheDocument();
    });
  });

  it('displays interest earned', async () => {
    render(<StudentDashboard />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('+5 DB$')).toBeInTheDocument();
    });
  });

  it('displays recent transactions', async () => {
    render(<StudentDashboard />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('On Task')).toBeInTheDocument();
      expect(screen.getByText('+1 DB$')).toBeInTheDocument();
    });
  });

  it('shows empty state when no transactions', async () => {
    vi.mocked(api.transactionsApi.list).mockResolvedValue({
      data: { success: true, transactions: [] },
    } as Awaited<ReturnType<typeof api.transactionsApi.list>>);
    render(<StudentDashboard />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/No transactions yet/)).toBeInTheDocument();
    });
  });
});
