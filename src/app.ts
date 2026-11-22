import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import openapi from '../docs/openapi.json';
import { authRouter } from './routes/auth.routes';
import { movieRouter } from './routes/movie.routes';
import { reviewRouter } from './routes/review.routes';
import { userRouter } from './routes/user.routes';
import { errorHandler, notFound } from './middleware/errorHandler';

export const app = express();
app.use(helmet({ contentSecurityPolicy: false })); // Swagger UI needs inline styles/scripts
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.get('/api/docs.json', (_req, res) => res.json(openapi));
app.use('/api/auth', authRouter);
app.use('/api/movies', movieRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/users', userRouter);
app.use(notFound);
app.use(errorHandler);
