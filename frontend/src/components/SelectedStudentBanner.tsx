import { Box, Typography, Button, Chip } from '@mui/material';
import { Person, Clear } from '@mui/icons-material';

export interface SelectedStudentBannerStudent {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    className: string;
    balance?: number;
}

interface SelectedStudentBannerProps {
    student: SelectedStudentBannerStudent;
    onClearSelection?: () => void;
}

export function SelectedStudentBanner({ student, onClearSelection }: SelectedStudentBannerProps) {
    return (
        <Box
            sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                position: 'sticky',
                top: 0,
                zIndex: 1,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Person color="primary" />
                <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                        Selected
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {student.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Class: {student.className || '—'} | Balance: {student.balance ?? 0} DB$
                    </Typography>
                </Box>
                <Chip
                    label={`${student.balance ?? 0} DB$`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 600 }}
                />
            </Box>
            {onClearSelection && (
                <Button
                    size="small"
                    startIcon={<Clear />}
                    onClick={onClearSelection}
                    color="inherit"
                    sx={{ color: 'text.secondary' }}
                >
                    Clear
                </Button>
            )}
        </Box>
    );
}
