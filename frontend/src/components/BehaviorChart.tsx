import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyticsApi } from '../services/api';

interface BreakdownItem {
  behavior: string;
  count: number;
}

const CHART_COLORS = ['#00d4ff', '#00ffa3', '#7c4dff', '#ff6b9d', '#ffb74d', '#4dd0e1'];

export function BehaviorChart() {
  const [data, setData] = useState<BreakdownItem[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    analyticsApi.behaviorBreakdown(days)
      .then((res) => {
        if (res.data.success) setData(res.data.breakdown);
      })
      .catch(() => setError('Failed to load breakdown'))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Awards by Behavior (last {days} days)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {[7, 30, 90].map((d) => (
            <Typography
              key={d}
              component="button"
              variant="body2"
              onClick={() => setDays(d)}
              sx={{
                border: 'none',
                background: days === d ? 'rgba(0, 212, 255, 0.2)' : 'transparent',
                borderRadius: 1,
                px: 1.5,
                py: 0.5,
                cursor: 'pointer',
                fontWeight: days === d ? 600 : 400,
              }}
            >
              {d} days
            </Typography>
          ))}
        </Box>
        {data.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>No awards in this period.</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="behavior" tick={{ fill: '#b0b0b0', fontSize: 12 }} />
              <YAxis tick={{ fill: '#b0b0b0', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'rgba(10,10,15,0.95)', border: '1px solid rgba(0,212,255,0.3)' }}
                labelStyle={{ color: '#00d4ff' }}
              />
              <Bar dataKey="count" name="Awards" radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
