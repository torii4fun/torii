import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../lib/api';

// Polls leaderboard every 30s instead of WebSocket
export function useWebSocket() {
  const { dispatch, state } = useApp();

  useEffect(() => {
    if (!state.user) return;

    // PnL scheduler runs every 5min — no point polling faster
    const id = setInterval(async () => {
      try {
        const data = await api.getLeaderboard();
        dispatch({ type: 'SET_LEADERBOARD', payload: data });
      } catch {}
    }, 5 * 60_000);

    return () => clearInterval(id);
  }, [state.user?.id]);
}
