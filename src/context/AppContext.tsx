import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import type { User, Clan, LeaderboardClan, Toast } from '../types';

export type Page = 'rank' | 'clans' | 'myclan';

interface State {
  user:        User | null;
  clan:        Clan | null;
  leaderboard: LeaderboardClan[];
  page:        Page;
  modals:      { auth: boolean; join: string | null; create: boolean };
  toasts:      Toast[];
  clanIdx:     number;
}

type Action =
  | { type: 'SET_USER';        payload: User | null }
  | { type: 'SET_CLAN';        payload: Clan | null }
  | { type: 'SET_LEADERBOARD'; payload: LeaderboardClan[] }
  | { type: 'SET_PAGE';        payload: Page }
  | { type: 'OPEN_AUTH' }
  | { type: 'CLOSE_AUTH' }
  | { type: 'OPEN_JOIN';       payload: string }
  | { type: 'CLOSE_JOIN' }
  | { type: 'OPEN_CREATE' }
  | { type: 'CLOSE_CREATE' }
  | { type: 'TOAST';           payload: Toast }
  | { type: 'REMOVE_TOAST';    payload: string }
  | { type: 'SET_CLAN_IDX';    payload: number }
  | { type: 'UPDATE_PNL';      payload: { clanId: string; pnlPct: number } };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER':        return { ...state, user: action.payload };
    case 'SET_CLAN':        return { ...state, clan: action.payload };
    case 'SET_LEADERBOARD': return { ...state, leaderboard: action.payload };
    case 'SET_PAGE':        return { ...state, page: action.payload };
    case 'OPEN_AUTH':       return { ...state, modals: { ...state.modals, auth: true } };
    case 'CLOSE_AUTH':      return { ...state, modals: { ...state.modals, auth: false } };
    case 'OPEN_JOIN':       return { ...state, modals: { ...state.modals, join: action.payload } };
    case 'CLOSE_JOIN':      return { ...state, modals: { ...state.modals, join: null } };
    case 'OPEN_CREATE':     return { ...state, modals: { ...state.modals, create: true } };
    case 'CLOSE_CREATE':    return { ...state, modals: { ...state.modals, create: false } };
    case 'TOAST':           return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':    return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'SET_CLAN_IDX':    return { ...state, clanIdx: action.payload };
    case 'UPDATE_PNL':
      return {
        ...state,
        leaderboard: state.leaderboard.map(c =>
          c.clanId === action.payload.clanId
            ? { ...c, totalPnlPct: action.payload.pnlPct }
            : c
        ),
        clan: state.clan?.id === action.payload.clanId
          ? { ...state.clan, cachedPnlPct: action.payload.pnlPct }
          : state.clan,
      };
    default: return state;
  }
}

interface CtxValue {
  state:    State;
  dispatch: React.Dispatch<Action>;
  toast:    (msg: string) => void;
}

const AppCtx = createContext<CtxValue>(null!);
export const useApp = () => useContext(AppCtx);

const initialState: State = {
  user: null, clan: null, leaderboard: [],
  page: 'rank',
  modals: { auth: false, join: null, create: false },
  toasts: [],
  clanIdx: 0,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastId = useRef(0);

  const toast = useCallback((msg: string) => {
    const id = String(++toastId.current);
    dispatch({ type: 'TOAST', payload: { id, message: msg } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3000);
  }, []);

  return <AppCtx.Provider value={{ state, dispatch, toast }}>{children}</AppCtx.Provider>;
}
