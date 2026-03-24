import { useReducer, useCallback } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useApp } from '../../../context/AppContext';
import { Modal } from '../../ui/Modal';
import { Step0Identity } from './Step0Identity';
import { Step1Castle } from './Step1Castle';
import { Step2Token } from './Step2Token';
import { Step3Launch } from './Step3Launch';
import * as api from '../../../lib/api';
import { type CreateClanState, defaultCreateState, type CastleStyle } from '../../../types';

type Action = { k: keyof CreateClanState; v: any };

function reducer(state: CreateClanState, action: Action): CreateClanState {
  return { ...state, [action.k]: action.v };
}

const STEP_TITLES = ['Clan Identity', 'Style', 'Token', 'Launch'];

export function CreateClanModal() {
  const { state: appState, dispatch: appDispatch, toast } = useApp();
  const { wallets } = useWallets();
  const [cs, dispatch] = useReducer(reducer, defaultCreateState());

  const open  = appState.modals.create;
  const user  = appState.user;
  const embedded = wallets.find((w: any) => w.walletClientType === 'privy');

  const set = useCallback((k: keyof CreateClanState, v: any) =>
    dispatch({ k, v }), []);

  const close = () => appDispatch({ type: 'CLOSE_CREATE' });
  const next  = () => set('step', Math.min(3, cs.step + 1) as any);
  const prev  = () => set('step', Math.max(0, cs.step - 1) as any);

  async function handleLaunchDone(mintAddress: string) {
    if (!user) return;

    const castleStyle: CastleStyle = {
      wallColor: cs.wallColor,
      towerStyle: cs.towerStyle,
      sky: cs.sky,
      stars: cs.stars,
      torches: cs.torches,
      flag: cs.flag,
    };

    try {
      const { clanId } = await api.createClan({
        userId:            user.id,
        name:              cs.name,
        emoji:             cs.emoji,
        color:             cs.color,
        motto:             cs.motto,
        minTokensRequired: cs.minTokens,
        telegramGroup:     cs.telegram,
        castleStyle,
        tokenMint:         mintAddress,
      });

      // Confirm launch with clanId
      await api.confirmLaunch({
        clanId,
        userId:    user.id,
        mint:      mintAddress,
        signature: '',
      });

      // Load fresh clan + leaderboard
      const [full, board] = await Promise.all([
        api.getClan(clanId, user.id),
        api.getLeaderboard(),
      ]);

      appDispatch({ type: 'SET_CLAN', payload: full });
      appDispatch({ type: 'SET_LEADERBOARD', payload: board });
      appDispatch({ type: 'SET_USER', payload: { ...user, clanId, clanRole: 'founder' } });

      close();
      appDispatch({ type: 'SET_PAGE', payload: 'myclan' });
      toast(`⚔️ "${cs.name}" is live! Share $${cs.ticker} to fill your ranks.`);
    } catch (e: any) {
      toast('❌ ' + e.message);
    }
  }

  const stepBar = (
    <div className="wizard-steps">
      {STEP_TITLES.map((t, i) => (
        <div key={i} className={`wizard-step${i === cs.step ? ' active' : i < cs.step ? ' done' : ''}`}>
          {t}
        </div>
      ))}
    </div>
  );

  const steps: Record<number, React.ReactNode> = {
    0: <Step0Identity state={cs} set={set} onNext={next} />,
    1: <Step1Castle   state={cs} set={set} onNext={next} onPrev={prev} />,
    2: <Step2Token    state={cs} set={set} onNext={next} onPrev={prev} />,
    3: <Step3Launch
         state={cs}
         set={set}
         onDone={handleLaunchDone}
         onPrev={prev}
         userId={user?.id ?? ''}
         walletAddr={embedded?.address ?? user?.walletAddress ?? ''}
       />,
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={STEP_TITLES[cs.step]}
      xl
      headerExtra={
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
          Step {cs.step + 1} / 4
        </span>
      }
    >
      <div className="modal-body">
        {stepBar}
        {steps[cs.step]}
      </div>
    </Modal>
  );
}