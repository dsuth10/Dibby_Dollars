import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import { AccountBalanceWallet, Login as LoginIcon } from '@mui/icons-material';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores';

export function LoginPage() {
    const navigate = useNavigate();
    const { setUser, setLoading, setError, isLoading, error } = useAuthStore();

    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim() || !pin.trim()) {
            setError('Please enter username and PIN');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await authApi.login(username.toLowerCase().trim(), pin);

            if (response.data.success) {
                setUser(response.data.user);

                // Redirect based on role
                const role = response.data.user.role;
                if (role === 'student') {
                    navigate('/student');
                } else if (role === 'admin') {
                    navigate('/admin');
                } else if (role === 'teacher') {
                    navigate('/teacher');
                }
            } else {
                setError(response.data.error || 'Login failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            <Card
                sx={{
                    width: '100%',
                    maxWidth: 420,
                    p: 2,
                }}
            >
                <CardContent>
                    {/* Logo/Header */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 255, 163, 0.2) 100%)',
                                mb: 2,
                                boxShadow: '0 0 30px rgba(0, 212, 255, 0.3)',
                            }}
                        >
                            <AccountBalanceWallet sx={{ fontSize: 40, color: 'primary.main' }} />
                        </Box>
                        <Typography
                            variant="h4"
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
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Your School Reward Bank
                        </Typography>
                    </Box>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            margin="normal"
                            autoComplete="username"
                            autoFocus
                            disabled={isLoading}
                        />

                        <TextField
                            fullWidth
                            label="PIN"
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            margin="normal"
                            autoComplete="current-password"
                            disabled={isLoading}
                            inputProps={{ maxLength: 20 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={isLoading}
                            sx={{ mt: 3, py: 1.5 }}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
}
