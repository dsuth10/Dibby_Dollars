import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    Autocomplete,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Add,
    EmojiEvents,
    Casino,
    Person,
    Savings,
    CheckCircle,
} from '@mui/icons-material';
import { studentsApi, transactionsApi, behaviorsApi, raffleApi } from '../services/api';
import { Leaderboard, BehaviorChart } from '../components';

interface Student {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    className: string;
    balance?: number;
}

interface Behavior {
    id: number;
    name: string;
}

export function TeacherDashboard() {
    const [students, setStudents] = useState<Student[]>([]);
    const [focusBehaviors, setFocusBehaviors] = useState<Behavior[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [awarding, setAwarding] = useState(false);

    // Deposit dialog
    const [depositOpen, setDepositOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');

    // Raffle dialog
    const [raffleOpen, setRaffleOpen] = useState(false);
    const [rafflePrize, setRafflePrize] = useState('50');
    const [raffleDescription, setRaffleDescription] = useState('');
    const [raffleResult, setRaffleResult] = useState<{ winner: Student; amount: number } | null>(null);

    // Tab: 0 = Award & Raffle, 1 = Analytics
    const [tab, setTab] = useState(0);

    // Snackbar
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsRes, behaviorsRes] = await Promise.all([
                    studentsApi.list({ include_balance: true }),
                    behaviorsApi.getMyFocus(),
                ]);

                if (studentsRes.data.success) {
                    setStudents(studentsRes.data.students);
                }
                if (behaviorsRes.data.success) {
                    setFocusBehaviors(behaviorsRes.data.focusBehaviors);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAward = async (behaviorId?: number, notes?: string) => {
        if (!selectedStudent) {
            setSnackbar({ open: true, message: 'Please select a student first', severity: 'error' });
            return;
        }

        setAwarding(true);
        try {
            const response = await transactionsApi.award(selectedStudent.id, behaviorId, notes);
            if (response.data.success) {
                setSnackbar({ open: true, message: `Awarded 1 DB$ to ${selectedStudent.fullName}!`, severity: 'success' });
                // Update student balance in list
                setStudents(prev => prev.map(s =>
                    s.id === selectedStudent.id ? { ...s, balance: response.data.newBalance } : s
                ));
                setSelectedStudent(prev => prev ? { ...prev, balance: response.data.newBalance } : null);
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to award DB$', severity: 'error' });
        } finally {
            setAwarding(false);
        }
    };

    const handleDeposit = async () => {
        if (!selectedStudent || !depositAmount) return;

        const amount = parseInt(depositAmount);
        if (isNaN(amount) || amount <= 0) {
            setSnackbar({ open: true, message: 'Invalid amount', severity: 'error' });
            return;
        }

        try {
            const response = await transactionsApi.deposit(selectedStudent.id, amount);
            if (response.data.success) {
                setSnackbar({ open: true, message: `Deposited ${amount} DB$ for ${selectedStudent.fullName}!`, severity: 'success' });
                setStudents(prev => prev.map(s =>
                    s.id === selectedStudent.id ? { ...s, balance: response.data.newBalance } : s
                ));
                setSelectedStudent(prev => prev ? { ...prev, balance: response.data.newBalance } : null);
                setDepositOpen(false);
                setDepositAmount('');
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to deposit', severity: 'error' });
        }
    };

    const handleRaffle = async () => {
        try {
            const response = await raffleApi.draw(parseInt(rafflePrize), raffleDescription);
            if (response.data.success) {
                setRaffleResult({
                    winner: response.data.winner,
                    amount: response.data.raffle.prizeAmount
                });
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to conduct raffle', severity: 'error' });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
                Teacher Dashboard
            </Typography>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                <Tab label="Award & Raffle" id="teacher-tab-0" aria-controls="teacher-panel-0" />
                <Tab label="Analytics" id="teacher-tab-1" aria-controls="teacher-panel-1" />
            </Tabs>

            {tab === 0 && (
            <Grid container spacing={3} id="teacher-panel-0" aria-labelledby="teacher-tab-0">
                {/* Student Selector */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person color="primary" /> Select Student
                            </Typography>

                            <Autocomplete
                                options={students}
                                getOptionLabel={(option) => `${option.fullName} (${option.className})`}
                                value={selectedStudent}
                                onChange={(_, value) => setSelectedStudent(value)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Search student..." variant="outlined" />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                            <span>{option.fullName}</span>
                                            <Chip label={`${option.balance ?? 0} DB$`} size="small" />
                                        </Box>
                                    </li>
                                )}
                            />

                            {selectedStudent && (
                                <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(0, 212, 255, 0.1)' }}>
                                    <Typography variant="body2" color="text.secondary">Selected</Typography>
                                    <Typography variant="h5">{selectedStudent.fullName}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Class: {selectedStudent.className} | Balance: {selectedStudent.balance ?? 0} DB$
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick Award Buttons */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircle color="secondary" /> Quick Award (1 DB$)
                            </Typography>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {focusBehaviors.length > 0 ? (
                                    focusBehaviors.map((behavior) => (
                                        <Button
                                            key={behavior.id}
                                            variant="contained"
                                            onClick={() => handleAward(behavior.id)}
                                            disabled={!selectedStudent || awarding}
                                            sx={{
                                                flex: '1 1 calc(50% - 8px)',
                                                minWidth: 120,
                                            }}
                                        >
                                            {behavior.name}
                                        </Button>
                                    ))
                                ) : (
                                    <Typography color="text.secondary">
                                        No focus behaviors set. Configure them in settings.
                                    </Typography>
                                )}

                                <Button
                                    variant="outlined"
                                    onClick={() => handleAward(undefined, 'Other positive behavior')}
                                    disabled={!selectedStudent || awarding}
                                    sx={{ flex: '1 1 100%' }}
                                    startIcon={<Add />}
                                >
                                    Other
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Actions */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Savings color="primary" /> Deposit Tokens
                            </Typography>

                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => setDepositOpen(true)}
                                disabled={!selectedStudent}
                                startIcon={<Add />}
                            >
                                Deposit Physical Tokens
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Raffle */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, rgba(255, 179, 71, 0.1) 0%, rgba(255, 77, 109, 0.1) 100%)',
                        border: '1px solid rgba(255, 179, 71, 0.3)',
                    }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Casino sx={{ color: 'warning.main' }} /> Weekly Raffle
                            </Typography>

                            <Button
                                variant="contained"
                                color="warning"
                                fullWidth
                                onClick={() => setRaffleOpen(true)}
                                startIcon={<EmojiEvents />}
                            >
                                Conduct Raffle Draw
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            )}

            {tab === 1 && (
            <Grid container spacing={3} id="teacher-panel-1" aria-labelledby="teacher-tab-1">
                <Grid size={{ xs: 12, md: 6 }}>
                    <Leaderboard />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <BehaviorChart />
                </Grid>
            </Grid>
            )}

            {/* Deposit Dialog */}
            <Dialog open={depositOpen} onClose={() => setDepositOpen(false)}>
                <DialogTitle>Deposit Tokens for {selectedStudent?.fullName}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Number of tokens"
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        sx={{ mt: 2 }}
                        inputProps={{ min: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDepositOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeposit} variant="contained">Deposit</Button>
                </DialogActions>
            </Dialog>

            {/* Raffle Dialog */}
            <Dialog open={raffleOpen} onClose={() => { setRaffleOpen(false); setRaffleResult(null); }}>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Casino sx={{ color: 'warning.main' }} />
                        {raffleResult ? 'Raffle Winner!' : 'Conduct Raffle Draw'}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {raffleResult ? (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <EmojiEvents sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                                {raffleResult.winner.fullName}
                            </Typography>
                            <Typography variant="h6" color="secondary.main">
                                Wins {raffleResult.amount} DB$!
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <TextField
                                fullWidth
                                label="Prize Amount (DB$)"
                                type="number"
                                value={rafflePrize}
                                onChange={(e) => setRafflePrize(e.target.value)}
                                sx={{ mt: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Prize Description (optional)"
                                value={raffleDescription}
                                onChange={(e) => setRaffleDescription(e.target.value)}
                                sx={{ mt: 2 }}
                                placeholder="e.g., Weekly Assembly Jackpot"
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setRaffleOpen(false); setRaffleResult(null); }}>
                        {raffleResult ? 'Close' : 'Cancel'}
                    </Button>
                    {!raffleResult && (
                        <Button onClick={handleRaffle} variant="contained" color="warning">
                            Draw Winner
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
