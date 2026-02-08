import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Chip,
    Button,
} from '@mui/material';
import {
    AccountBalanceWallet,
    Logout,
    Person,
    Settings,
    School,
} from '@mui/icons-material';
import { useAuthStore, useUser, useIsAdmin } from '../../stores';
import { authApi } from '../../services/api';

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useUser();
    const isAdmin = useIsAdmin();
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (err) {
            // Continue with logout even if API fails
        }
        logout();
        navigate('/login');
    };

    const getRoleColor = () => {
        switch (user?.role) {
            case 'admin': return 'error';
            case 'teacher': return 'primary';
            default: return 'secondary';
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="sticky">
                <Toolbar>
                    {/* Logo */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                        <AccountBalanceWallet sx={{ color: 'primary.main' }} />
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #00d4ff 0%, #00ffa3 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Dibby Dollars
                        </Typography>
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Admin/Teacher nav switcher - admins can access both */}
                    {isAdmin && (
                        <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                            <Button
                                color="inherit"
                                size="small"
                                startIcon={<Settings />}
                                onClick={() => navigate('/admin')}
                                sx={{ opacity: location.pathname === '/admin' ? 1 : 0.8 }}
                            >
                                Admin
                            </Button>
                            <Button
                                color="inherit"
                                size="small"
                                startIcon={<School />}
                                onClick={() => navigate('/teacher')}
                                sx={{ opacity: location.pathname === '/teacher' ? 1 : 0.8 }}
                            >
                                Teacher
                            </Button>
                        </Box>
                    )}

                    {/* User info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {user?.balance !== undefined && (
                            <Chip
                                label={`${user.balance} DB$`}
                                color="primary"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                            />
                        )}

                        <Chip
                            icon={<Person />}
                            label={user?.fullName}
                            color={getRoleColor()}
                            variant="filled"
                        />

                        <IconButton onClick={handleLogout} color="inherit" title="Logout">
                            <Logout />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1 }}>
                {children}
            </Box>
        </Box>
    );
}
