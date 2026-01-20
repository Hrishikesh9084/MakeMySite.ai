import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoute.js';
import { stripWebhook } from './controllers/stripWebhook.js';

const app = express();

const port = 3000;

const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(',')?.filter(Boolean)?.length
        ? process.env.TRUSTED_ORIGINS.split(',')
        : ['https://make-my-site-ai.vercel.app'],
    credentials: true,
};

app.use(cors(corsOptions));

// Mount Better Auth routes (Express wildcard)
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json({ limit: '50mb' }));

// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth


app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripWebhook);




app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});