import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    Slider,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import {
    Settings,
    People,
    Assessment,
    School,
    Refresh,
    Add,
} from '@mui/icons-material';
import { adminApi, analyticsApi } from '../services/api';
import { Leaderboard, BehaviorChart } from '../components';

interface ConfigState {
    interestRate: string;
    rafflePrizeDefault: string;
}

interface User {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface SystemStats {
    totalStudents: number;
    totalCirculation: number;
    transactionsToday: number;
    totalInterestDistributed: number;
    classCounts: Record<string, number>;
}

export function AdminDashboard() {
    const navigate = useNavigate();
    const [config, setConfig] = useState<ConfigState>({ interestRate: '2', rafflePrizeDefault: '50' });
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [triggeringInterest, setTriggeringInterest] = useState(false);

    // Create user dialog
    const [createOpen, setCreateOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'teacher' as 'teacher' | 'admin',
    });

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [configRes, usersRes, statsRes] = await Promise.all([
                adminApi.getConfig(),
                adminApi.listUsers(),
                analyticsApi.systemStats(),
            ]);

            if (configRes.data.success) {
                const cfg = configRes.data.config;
                setConfig({
                    interestRate: cfg.interest_rate?.value ?? '2',
                    rafflePrizeDefault: cfg.raffle_prize_default?.value ?? '50',
                });
            }
            if (usersRes.data.success) {
                setUsers(usersRes.data.users);
            }
            if (statsRes.data.success) {
                setStats(statsRes.data.stats);
            }
        } catch (err: unknown) {
            setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveConfig = async () => {
        try {
            setSaving(true);
            await adminApi.updateConfig({
                interestRate: config.interestRate,
                rafflePrizeDefault: config.rafflePrizeDefault,
            });
            setSnackbar({ open: true, message: 'Configuration saved', severity: 'success' });
            fetchData();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to save';
            setSnackbar({ open: true, message: msg, severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleTriggerInterest = async () => {
        try {
            setTriggeringInterest(true);
            await adminApi.triggerInterest();
            setSnackbar({ open: true, message: 'Interest calculation completed', severity: 'success' });
            fetchData();
        } catch (err: unknown) {
            setSnackbar({ open: true, message: 'Failed to trigger interest calculation', severity: 'error' });
        } finally {
            setTriggeringInterest(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.username.trim() || !newUser.password || !newUser.firstName.trim() || !newUser.lastName.trim()) {
            setSnackbar({ open: true, message: 'All fields required', severity: 'error' });
            return;
        }
        try {
            await adminApi.createUser(newUser);
            setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
            setCreateOpen(false);
            setNewUser({ username: '', password: '', firstName: '', lastName: '', role: 'teacher' });
            fetchData();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to create user';
            setSnackbar({ open: true, message: msg, severity: 'error' });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
                Admin Control Panel
            </Typography>

            {/* Quick link to Teacher Portal */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <School color="primary" />
                            <Typography variant="h6">Need to award DB$ or run a raffle?</Typography>
                        </Box>
                        <Button variant="outlined" onClick={() => navigate('/teacher')} startIcon={<School />}>
                            Go to Teacher Portal
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Grid container spacing={3}>
                {/* System Configuration */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Settings /> System Configuration
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <Typography gutterBottom>
                                    Weekly Interest Rate: {config.interestRate}%
                                </Typography>
                                <Slider
                                    value={parseFloat(config.interestRate) || 0}
                                    min={0}
                                    max={10}
                                    step={0.5}
                                    valueLabelDisplay="auto"
                                    onChange={(_, value) => setConfig((c) => ({ ...c, interestRate: String(value) }))}
                                    sx={{ maxWidth: 300 }}
                                />
                            </Box>

                            <TextField
                                label="Default Raffle Prize (DB$)"
                                type="number"
                                value={config.rafflePrizeDefault}
                                onChange={(e) => setConfig((c) => ({ ...c, rafflePrizeDefault: e.target.value }))}
                                inputProps={{ min: 1 }}
                                sx={{ mb: 2, display: 'block', maxWidth: 200 }}
                            />

                            <Button
                                variant="contained"
                                onClick={handleSaveConfig}
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={16} /> : <Settings />}
                            >
                                {saving ? 'Saving...' : 'Save Configuration'}
                            </Button>

                            <Box sx={{ mt: 3 }}>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={handleTriggerInterest}
                                    disabled={triggeringInterest}
                                    startIcon={triggeringInterest ? <CircularProgress size={16} /> : <Refresh />}
                                >
                                    {triggeringInterest ? 'Running...' : 'Trigger Interest Calculation'}
                                </Button>
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                    Manually run weekly interest for all students (normally runs automatically on Sundays).
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* System Analytics */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Assessment /> System Analytics
                            </Typography>
                            {stats && (
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(0,212,255,0.1)' }}>
                                            <Typography variant="h4" color="primary">{stats.totalStudents}</Typography>
                                            <Typography variant="body2" color="text.secondary">Total Students</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(0,255,163,0.1)' }}>
                                            <Typography variant="h4" color="secondary">{stats.totalCirculation}</Typography>
                                            <Typography variant="body2" color="text.secondary">DB$ in Circulation</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                                            <Typography variant="h4">{stats.transactionsToday}</Typography>
                                            <Typography variant="body2" color="text.secondary">Transactions Today</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                                            <Typography variant="h4">{stats.totalInterestDistributed}</Typography>
                                            <Typography variant="body2" color="text.secondary">Interest Distributed</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Leaderboard & Behavior Analytics */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Leaderboard />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <BehaviorChart />
                </Grid>

                {/* User Management */}
                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <People /> User Management
                                </Typography>
                                <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
                                    Add User
                                </Button>
                            </Box>
                            <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Username</TableCell>
                                            <TableCell>Role</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell>{u.firstName} {u.lastName}</TableCell>
                                                <TableCell>{u.username}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={u.role}
                                                        color={u.role === 'admin' ? 'error' : 'primary'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Create User Dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Teacher or Admin</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Username"
                        value={newUser.username}
                        onChange={(e) => setNewUser((u) => ({ ...u, username: e.target.value }))}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="First Name"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser((u) => ({ ...u, firstName: e.target.value }))}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Last Name"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser((u) => ({ ...u, lastName: e.target.value }))}
                        margin="normal"
                    />
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Role</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                                label="Teacher"
                                onClick={() => setNewUser((u) => ({ ...u, role: 'teacher' }))}
                                color={newUser.role === 'teacher' ? 'primary' : 'default'}
                                variant={newUser.role === 'teacher' ? 'filled' : 'outlined'}
                            />
                            <Chip
                                label="Admin"
                                onClick={() => setNewUser((u) => ({ ...u, role: 'admin' }))}
                                color={newUser.role === 'admin' ? 'error' : 'default'}
                                variant={newUser.role === 'admin' ? 'filled' : 'outlined'}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateUser}>Create</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
