import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Auth API
export const authApi = {
    login: (username: string, pin: string) =>
        api.post('/auth/login', { username, pin }),
    logout: () =>
        api.post('/auth/logout'),
    getMe: () =>
        api.get('/auth/me'),
};

// Students API
export const studentsApi = {
    list: (params?: { class_name?: string; include_balance?: boolean }) =>
        api.get('/students', { params }),
    get: (id: number) =>
        api.get(`/students/${id}`),
    create: (data: { firstName: string; lastName: string; className?: string; pin: string }) =>
        api.post('/students', data),
    update: (id: number, data: Partial<{ firstName: string; lastName: string; className: string; pin: string; isActive: boolean }>) =>
        api.put(`/students/${id}`, data),
    listClasses: () =>
        api.get('/students/classes'),
};

// Transactions API
export const transactionsApi = {
    award: (studentId: number, behaviorId?: number, notes?: string) =>
        api.post('/transactions/award', { studentId, behaviorId, notes }),
    deposit: (studentId: number, amount: number, notes?: string) =>
        api.post('/transactions/deposit', { studentId, amount, notes }),
    list: (params?: { user_id?: number; type?: string; limit?: number; offset?: number }) =>
        api.get('/transactions', { params }),
};

// Balance API
export const balanceApi = {
    getMe: () =>
        api.get('/balance/me'),
    getUser: (userId: number) =>
        api.get(`/balance/${userId}`),
};

// Behaviors API
export const behaviorsApi = {
    list: () =>
        api.get('/behaviors'),
    create: (name: string, description?: string) =>
        api.post('/behaviors', { name, description }),
    getMyFocus: () =>
        api.get('/behaviors/my-focus'),
    setMyFocus: (behaviorIds: number[]) =>
        api.put('/behaviors/my-focus', { behaviorIds }),
};

// Raffle API
export const raffleApi = {
    draw: (prizeAmount?: number, prizeDescription?: string) =>
        api.post('/raffle/draw', { prizeAmount, prizeDescription }),
    history: (params?: { limit?: number; offset?: number }) =>
        api.get('/raffle/history', { params }),
};

// Analytics API
export const analyticsApi = {
    leaderboard: (type: 'savers' | 'earners', limit?: number, className?: string) =>
        api.get('/analytics/leaderboard', { params: { type, limit, class_name: className } }),
    behaviorBreakdown: (days?: number) =>
        api.get('/analytics/behavior-breakdown', { params: { days } }),
    systemStats: () =>
        api.get('/analytics/system-stats'),
};

// Admin API
export const adminApi = {
    getConfig: () =>
        api.get('/admin/config'),
    updateConfig: (config: { interestRate?: string; rafflePrizeDefault?: string }) =>
        api.put('/admin/config', config),
    listUsers: () =>
        api.get('/admin/users'),
    createUser: (data: { username: string; password: string; firstName: string; lastName: string; role: 'teacher' | 'admin' }) =>
        api.post('/admin/users', data),
    triggerInterest: () =>
        api.post('/admin/trigger-interest'),
};
