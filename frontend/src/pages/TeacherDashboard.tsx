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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Tabs,
    Tab,
    FormGroup,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import {
    Add,
    EmojiEvents,
    Casino,
    Person,
    Savings,
    CheckCircle,
    Settings,
} from '@mui/icons-material';
import { studentsApi, transactionsApi, behaviorsApi, raffleApi } from '../services/api';
import { Leaderboard, BehaviorChart, StudentSidebar, SelectedStudentBanner } from '../components';

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

    // Student creation dialog state
    const [createStudentOpen, setCreateStudentOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({
        firstName: '',
        lastName: '',
        className: '',
        pin: '',
    });
    const [classes, setClasses] = useState<string[]>([]);
    const [pinError, setPinError] = useState('');
    const [creatingStudent, setCreatingStudent] = useState(false);

    // Manage Behaviors dialog state
    const [manageBehaviorsOpen, setManageBehaviorsOpen] = useState(false);
    const [allBehaviors, setAllBehaviors] = useState<Behavior[]>([]);
    const [selectedBehaviorIds, setSelectedBehaviorIds] = useState<number[]>([]);
    const [savingBehaviors, setSavingBehaviors] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsRes, behaviorsRes, classesRes] = await Promise.all([
                    studentsApi.list({ include_balance: true }),
                    behaviorsApi.getMyFocus(),
                    studentsApi.listClasses(),
                ]);

                if (studentsRes.data.success) {
                    setStudents(studentsRes.data.students);
                }
                if (behaviorsRes.data.success) {
                    setFocusBehaviors(behaviorsRes.data.focusBehaviors);
                }
                if (classesRes.data.success && classesRes.data.classes) {
                    setClasses(classesRes.data.classes);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const validatePin = (pin: string): string => {
        if (!pin) return 'PIN is required';
        if (!/^\d{4,6}$/.test(pin)) return 'PIN must be 4-6 digits';
        return '';
    };

    const handleCloseCreateDialog = () => {
        setNewStudent({ firstName: '', lastName: '', className: '', pin: '' });
        setPinError('');
        setCreateStudentOpen(false);
    };

    const handleCreateStudent = async () => {
        const { firstName, lastName, className, pin } = newStudent;
        if (!firstName.trim()) {
            setSnackbar({ open: true, message: 'First name is required', severity: 'error' });
            return;
        }
        if (!lastName.trim()) {
            setSnackbar({ open: true, message: 'Last name is required', severity: 'error' });
            return;
        }
        const pinErr = validatePin(pin);
        if (pinErr) {
            setPinError(pinErr);
            setSnackbar({ open: true, message: pinErr, severity: 'error' });
            return;
        }

        setCreatingStudent(true);
        setPinError('');
        try {
            const response = await studentsApi.create({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                className: className.trim() || undefined,
                pin,
            });
            if (response.data.success) {
                const created = response.data.student as Student;
                setStudents(prev => [created, ...prev]);
                if (created.className && !classes.includes(created.className)) {
                    setClasses(prev => [...prev, created.className].sort());
                }
                setSnackbar({
                    open: true,
                    message: `Student ${created.fullName} created successfully! Record their PIN securely.`,
                    severity: 'success',
                });
                handleCloseCreateDialog();
            }
        } catch (err: unknown) {
            const message = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                : 'Failed to create student';
            setSnackbar({ open: true, message: message || 'Failed to create student', severity: 'error' });
        } finally {
            setCreatingStudent(false);
        }
    };

    const handleOpenManageBehaviors = async () => {
        try {
            const [listRes, focusRes] = await Promise.all([
                behaviorsApi.list(),
                behaviorsApi.getMyFocus(),
            ]);
            if (listRes.data.success && listRes.data.behaviors) {
                setAllBehaviors(listRes.data.behaviors);
            }
            if (focusRes.data.success && focusRes.data.focusBehaviors) {
                setSelectedBehaviorIds(focusRes.data.focusBehaviors.map((b: Behavior) => b.id));
            } else {
                setSelectedBehaviorIds([]);
            }
            setManageBehaviorsOpen(true);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to load behaviors', severity: 'error' });
        }
    };

    const handleCloseManageBehaviors = () => {
        setManageBehaviorsOpen(false);
    };

    const handleBehaviorToggle = (behaviorId: number, checked: boolean) => {
        setSelectedBehaviorIds(prev =>
            checked ? [...prev, behaviorId] : prev.filter(id => id !== behaviorId)
        );
    };

    const handleSaveBehaviors = async () => {
        const count = selectedBehaviorIds.length;
        if (count < 3) {
            setSnackbar({ open: true, message: 'Select 3 to 5 behaviors (minimum 3).', severity: 'error' });
            return;
        }
        if (count > 5) {
            setSnackbar({ open: true, message: 'Maximum 5 behaviors.', severity: 'error' });
            return;
        }
        setSavingBehaviors(true);
        try {
            const orderIds = allBehaviors.filter(b => selectedBehaviorIds.includes(b.id)).map(b => b.id);
            const response = await behaviorsApi.setMyFocus(orderIds);
            if (response.data.success) {
                const focusRes = await behaviorsApi.getMyFocus();
                if (focusRes.data.success && focusRes.data.focusBehaviors) {
                    setFocusBehaviors(focusRes.data.focusBehaviors);
                }
                setSnackbar({ open: true, message: 'Focus behaviors updated.', severity: 'success' });
                handleCloseManageBehaviors();
            }
        } catch (err: unknown) {
            const message = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                : 'Failed to save behaviors';
            setSnackbar({ open: true, message: message || 'Failed to save behaviors', severity: 'error' });
        } finally {
            setSavingBehaviors(false);
        }
    };

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
                const winner = response.data.winner;
                const prizeAmount = (response.data.raffle?.prizeAmount ?? parseInt(rafflePrize, 10)) || 50;
                // Use API balance if present and numeric, else compute from previous balance + prize
                const previousBalance = (students.find(s => s.id === winner.id)?.balance) ?? 0;
                const newBalance = typeof winner.balance === 'number'
                    ? winner.balance
                    : previousBalance + prizeAmount;
                const winnerWithBalance = { ...winner, balance: newBalance };

                // Update students list with winner's new balance (synchronous state update)
                setStudents(prev => prev.map(s =>
                    s.id === winner.id ? { ...s, balance: newBalance } : s
                ));

                // If winner is currently selected, update selected student too
                if (selectedStudent?.id === winner.id) {
                    setSelectedStudent(prev => prev ? { ...prev, balance: newBalance } : null);
                }

                // Show raffle result dialog (use winnerWithBalance so dialog shows correct balance)
                setRaffleResult({
                    winner: winnerWithBalance,
                    amount: prizeAmount
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
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                height: { xs: 'auto', md: 'calc(100vh - 64px)' },
                minHeight: { md: 'calc(100vh - 64px)' },
            }}
        >
            <StudentSidebar
                students={students}
                selectedStudent={selectedStudent}
                onSelectStudent={setSelectedStudent}
            />
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    minHeight: 0,
                    p: { xs: 2, md: 3 },
                }}
            >
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
                    Teacher Dashboard
                </Typography>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                    <Tab label="Award & Raffle" id="teacher-tab-0" aria-controls="teacher-panel-0" />
                    <Tab label="Analytics" id="teacher-tab-1" aria-controls="teacher-panel-1" />
                </Tabs>

                {tab === 0 && (
                <>
                    {selectedStudent && (
                        <SelectedStudentBanner
                            student={selectedStudent}
                            onClearSelection={() => setSelectedStudent(null)}
                        />
                    )}
                    <Grid container spacing={3} id="teacher-panel-0" aria-labelledby="teacher-tab-0">
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
                                ) : null}

                                <Button
                                    variant="outlined"
                                    onClick={() => handleAward(undefined, 'Other positive behavior')}
                                    disabled={!selectedStudent || awarding}
                                    sx={{ flex: '1 1 100%' }}
                                    startIcon={<Add />}
                                >
                                    Other
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleOpenManageBehaviors}
                                    startIcon={<Settings />}
                                    sx={{ flex: '1 1 100%' }}
                                >
                                    Manage Behaviors
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

                {/* Student Management */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person color="primary" /> Student Management
                            </Typography>

                            <Button
                                variant="contained"
                                fullWidth
                                startIcon={<Add />}
                                onClick={() => setCreateStudentOpen(true)}
                            >
                                Add New Student
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
                    </Grid>
                </>
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

            {/* Create Student Dialog */}
            <Dialog open={createStudentOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="First Name"
                        required
                        value={newStudent.firstName}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, firstName: e.target.value }))}
                        sx={{ mt: 2 }}
                        autoFocus
                    />
                    <TextField
                        fullWidth
                        label="Last Name"
                        required
                        value={newStudent.lastName}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, lastName: e.target.value }))}
                        sx={{ mt: 2 }}
                    />
                    <Autocomplete
                        freeSolo
                        options={classes}
                        value={newStudent.className}
                        onChange={(_, value) => setNewStudent(prev => ({ ...prev, className: (value as string) ?? '' }))}
                        onInputChange={(_, value) => setNewStudent(prev => ({ ...prev, className: value }))}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Class"
                                helperText="e.g., 5A, 6B (optional)"
                                sx={{ mt: 2 }}
                            />
                        )}
                    />
                    <TextField
                        fullWidth
                        label="PIN"
                        required
                        type="password"
                        value={newStudent.pin}
                        onChange={(e) => {
                            setNewStudent(prev => ({ ...prev, pin: e.target.value }));
                            if (pinError) setPinError(validatePin(e.target.value));
                        }}
                        onBlur={() => setPinError(validatePin(newStudent.pin))}
                        error={!!pinError}
                        helperText={pinError || '4-6 digit PIN for student login'}
                        sx={{ mt: 2 }}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', minLength: 4, maxLength: 6 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreateDialog} disabled={creatingStudent}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreateStudent} variant="contained" disabled={creatingStudent}>
                        {creatingStudent ? 'Creating...' : 'Create Student'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Manage Behaviors Dialog */}
            <Dialog open={manageBehaviorsOpen} onClose={handleCloseManageBehaviors} maxWidth="sm" fullWidth>
                <DialogTitle>Manage Focus Behaviors</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Select 3 to 5 behaviors for your quick-award buttons. Order follows the list below.
                    </Typography>
                    <FormGroup>
                        {allBehaviors.map((behavior) => (
                            <FormControlLabel
                                key={behavior.id}
                                control={
                                    <Checkbox
                                        checked={selectedBehaviorIds.includes(behavior.id)}
                                        onChange={(_, checked) => handleBehaviorToggle(behavior.id, checked)}
                                    />
                                }
                                label={behavior.name}
                            />
                        ))}
                    </FormGroup>
                    {allBehaviors.length < 3 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Fewer than 3 behaviors in the system. Add more behaviors first.
                        </Typography>
                    )}
                    <Typography
                        variant="body2"
                        color={selectedBehaviorIds.length >= 3 && selectedBehaviorIds.length <= 5 ? 'text.secondary' : 'error.main'}
                        sx={{ mt: 2 }}
                    >
                        {selectedBehaviorIds.length < 3
                            ? 'Select 3 to 5 behaviors (minimum 3).'
                            : selectedBehaviorIds.length > 5
                                ? 'Maximum 5 behaviors.'
                                : `${selectedBehaviorIds.length} selected.`}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseManageBehaviors} disabled={savingBehaviors}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveBehaviors}
                        variant="contained"
                        disabled={savingBehaviors || selectedBehaviorIds.length < 3 || selectedBehaviorIds.length > 5 || allBehaviors.length < 3}
                    >
                        {savingBehaviors ? 'Saving...' : 'Save'}
                    </Button>
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
        </Box>
    );
}
