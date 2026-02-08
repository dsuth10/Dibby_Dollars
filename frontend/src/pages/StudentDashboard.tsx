import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Skeleton,
} from '@mui/material';
import {
    AccountBalanceWallet,
    TrendingUp,
    EmojiEvents,
    History,
    ArrowUpward,
    ArrowDownward,
    Star,
} from '@mui/icons-material';
import { balanceApi, transactionsApi } from '../services/api';
import { useUser } from '../stores';

interface BalanceData {
    balance: number;
    interestEarned: number;
    rank: number | null;
    totalStudents: number | null;
}

interface Transaction {
    id: number;
    amount: number;
    type: string;
    categoryName: string | null;
    notes: string | null;
    createdAt: string;
}

export function StudentDashboard() {
    const user = useUser();
    const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [balanceRes, txRes] = await Promise.all([
                    balanceApi.getMe(),
                    transactionsApi.list({ limit: 10 }),
                ]);

                if (balanceRes.data.success) {
                    setBalanceData(balanceRes.data);
                }
                if (txRes.data.success) {
                    setTransactions(txRes.data.transactions);
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Skeleton variant="text" width={280} height={48} sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card>
                            <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                <Skeleton variant="circular" width={48} height={48} sx={{ mx: 'auto', mb: 2 }} />
                                <Skeleton variant="text" width={100} sx={{ mx: 'auto', mb: 1 }} />
                                <Skeleton variant="text" width={120} height={56} sx={{ mx: 'auto' }} />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
                        <Skeleton variant="rounded" height={120} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Skeleton variant="rounded" height={200} />
                    </Grid>
                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Welcome Header */}
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                Welcome, {user?.firstName}! 👋
            </Typography>

            <Grid container spacing={3}>
                {/* Balance Hero Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                        sx={{
                            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 255, 163, 0.15) 100%)',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                            boxShadow: '0 0 40px rgba(0, 212, 255, 0.2)',
                        }}
                    >
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <AccountBalanceWallet sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Your Balance
                            </Typography>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #00d4ff 0%, #00ffa3 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    textShadow: '0 0 30px rgba(0, 212, 255, 0.5)',
                                    animation: 'balanceFadeIn 0.6s ease-out',
                                    '@keyframes balanceFadeIn': {
                                        from: { opacity: 0, transform: 'scale(0.95)' },
                                        to: { opacity: 1, transform: 'scale(1)' },
                                    },
                                }}
                            >
                                {balanceData?.balance ?? 0} DB$
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Stats Cards */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Grid container spacing={2}>
                        {/* Savings Rank */}
                        <Grid size={{ xs: 12 }}>
                            <Card>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(0, 255, 163, 0.15)',
                                        }}
                                    >
                                        <EmojiEvents sx={{ fontSize: 28, color: 'secondary.main' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Savings Rank
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                            #{balanceData?.rank ?? '-'} of {balanceData?.totalStudents ?? '-'}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Interest Earned */}
                        <Grid size={{ xs: 12 }}>
                            <Card>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(0, 212, 255, 0.15)',
                                        }}
                                    >
                                        <TrendingUp sx={{ fontSize: 28, color: 'primary.main' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Interest Earned
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                                            +{balanceData?.interestEarned ?? 0} DB$
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Recent Transactions */}
                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <History sx={{ color: 'primary.main' }} />
                                <Typography variant="h6">Recent Activity</Typography>
                            </Box>

                            {transactions.length === 0 ? (
                                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                                    No transactions yet. Start earning DB$!
                                </Typography>
                            ) : (
                                <List disablePadding>
                                    {transactions.map((tx, index) => (
                                        <Box key={tx.id}>
                                            {index > 0 && <Divider />}
                                            <ListItem sx={{ px: 0 }}>
                                                <ListItemIcon>
                                                    {tx.amount > 0 ? (
                                                        <ArrowUpward sx={{ color: 'secondary.main' }} />
                                                    ) : (
                                                        <ArrowDownward sx={{ color: 'error.main' }} />
                                                    )}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography>
                                                                {tx.categoryName || tx.notes || tx.type}
                                                            </Typography>
                                                            {tx.type === 'RAFFLE' && <Star sx={{ fontSize: 16, color: 'warning.main' }} />}
                                                        </Box>
                                                    }
                                                    secondary={new Date(tx.createdAt).toLocaleDateString()}
                                                />
                                                <Chip
                                                    label={`${tx.amount > 0 ? '+' : ''}${tx.amount} DB$`}
                                                    size="small"
                                                    color={tx.amount > 0 ? 'success' : 'error'}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </ListItem>
                                        </Box>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
