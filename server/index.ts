import express from 'express';
import cors    from 'cors';
import path    from 'path';
import 'dotenv/config';

import usersRouter from './routes/users';
import clansRouter from './routes/clans';
import launchRouter from './routes/launch';
import { startPnlScheduler } from './lib/pnlScheduler';

const app  = express();
const DIST = path.resolve(process.cwd(), 'dist');

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));

app.use('/api/users',  usersRouter);
app.use('/api/clans',  clansRouter);
app.use('/api/launch', launchRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(express.static(DIST));
app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`✅ Warps on port ${PORT}`);
  startPnlScheduler().catch(e => console.error('[PnL] Scheduler failed:', e.message));
});
