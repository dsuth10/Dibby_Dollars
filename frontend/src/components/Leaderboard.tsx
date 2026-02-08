import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, ToggleButtonGroup, ToggleButton, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { EmojiEvents, TrendingUp } from '@mui/icons-material';
import { analyticsApi } from '../services/api';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  className: string | null;
  value: number;
}

export function Leaderboard() {
  const [type, setType] = useState<'savers' | 'earners'>('savers');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    analyticsApi.leaderboard(type, 10)
      .then((res) => {
        if (res.data.success) setEntries(res.data.leaderboard);
      })
      .catch(() => setError('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [type]);

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents color="primary" /> Top 10 Leaderboard
          </Typography>
          <ToggleButtonGroup
            value={type}
            exclusive
            onChange={(_, v) => v && setType(v)}
            size="small"
          >
            <ToggleButton value="savers" aria-label="Top savers">
              <TrendingUp sx={{ mr: 0.5, fontSize: 18 }} /> Savers
            </ToggleButton>
            <ToggleButton value="earners" aria-label="Top earners">
              <EmojiEvents sx={{ mr: 0.5, fontSize: 18 }} /> Earners (week)
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {entries.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>No data yet.</Typography>
        ) : (
          <List dense disablePadding>
            {entries.map((entry) => (
              <ListItem key={entry.userId} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Typography variant="body2" fontWeight={700} color="primary">
                    #{entry.rank}
                  </Typography>
                </ListItemIcon>
                <ListItemText
                  primary={entry.name}
                  secondary={entry.className ? `Class ${entry.className}` : null}
                />
                <Typography variant="body1" fontWeight={600} color="secondary.main">
                  {entry.value} DB$
                </Typography>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
