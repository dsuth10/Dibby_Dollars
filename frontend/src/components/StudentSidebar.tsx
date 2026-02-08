import { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    List,
    ListItemButton,
    Chip,
} from '@mui/material';
import { Search, Person } from '@mui/icons-material';

export interface StudentSidebarStudent {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    className: string;
    balance?: number;
}

interface StudentSidebarProps {
    students: StudentSidebarStudent[];
    selectedStudent: StudentSidebarStudent | null;
    onSelectStudent: (student: StudentSidebarStudent) => void;
}

function matchesSearch(student: StudentSidebarStudent, search: string): boolean {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
        student.firstName.toLowerCase().includes(q) ||
        student.lastName.toLowerCase().includes(q) ||
        student.fullName.toLowerCase().includes(q) ||
        !!(student.className && student.className.toLowerCase().includes(q))
    );
}

export function StudentSidebar({
    students,
    selectedStudent,
    onSelectStudent,
}: StudentSidebarProps) {
    const [search, setSearch] = useState('');

    const filteredStudents = useMemo(
        () => students.filter((s) => matchesSearch(s, search)),
        [students, search]
    );

    return (
        <Box
            sx={{
                width: { xs: '100%', md: 280 },
                minWidth: { md: 280 },
                height: { xs: 'auto', md: '100%' },
                maxHeight: { xs: '45vh', md: 'none' },
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(10, 10, 15, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRight: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.1)' },
                borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.1)', md: 'none' },
                flexShrink: 0,
            }}
        >
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography
                    variant="h6"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                        fontWeight: 600,
                    }}
                >
                    <Person color="primary" />
                    Students
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name or class..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                        ),
                        sx: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 2,
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                        },
                    }}
                />
                <Chip
                    label={`${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{ mt: 1.5 }}
                    color="primary"
                    variant="outlined"
                />
            </Box>
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    minHeight: 0,
                }}
            >
                {filteredStudents.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {students.length === 0
                                ? 'No students yet'
                                : 'No students match your search'}
                        </Typography>
                    </Box>
                ) : (
                    <List disablePadding sx={{ py: 1 }}>
                        {filteredStudents.map((student) => (
                            <ListItemButton
                                key={student.id}
                                selected={selectedStudent?.id === student.id}
                                onClick={() => onSelectStudent(student)}
                                sx={{
                                    borderRadius: 2,
                                    mx: 1,
                                    mb: 0.5,
                                    '&.Mui-selected': {
                                        backgroundColor: 'rgba(0, 212, 255, 0.15)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 212, 255, 0.2)',
                                        },
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        gap: 0.5,
                                    }}
                                >
                                    <Typography variant="body1" fontWeight={500}>
                                        {student.fullName}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {student.className && (
                                            <Typography variant="caption" color="text.secondary">
                                                {student.className}
                                            </Typography>
                                        )}
                                        <Chip
                                            label={`${student.balance ?? 0} DB$`}
                                            size="small"
                                            sx={{ height: 20, fontSize: '0.75rem' }}
                                            color="primary"
                                            variant="filled"
                                        />
                                    </Box>
                                </Box>
                            </ListItemButton>
                        ))}
                    </List>
                )}
            </Box>
        </Box>
    );
}
