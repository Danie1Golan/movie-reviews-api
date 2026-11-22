import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app';
import { Movie } from '../../src/models/Movie';
import { Review } from '../../src/models/Review';
import { User } from '../../src/models/User';

const api = supertest(app);
let mongo: MongoMemoryServer;

const fixture = {
  title: 'Interstellar', year: 2014, genre: 'Science Fiction', director: 'Christopher Nolan',
  actors: ['Matthew McConaughey', 'Anne Hathaway'],
  description: 'A team of explorers travels beyond this galaxy.'
};

async function register(name: string, email: string) {
  const response = await api.post('/api/auth/register').send({ name, email, password: 'Secret12345!' });
  expect(response.status).toBe(201);
  return response.body as { token: string; user: { id: string; role: string } };
}

async function adminToken() {
  await User.create({
    name: 'Admin Person', email: 'admin@example.com', role: 'admin',
    passwordHash: await bcrypt.hash('Secret12345!', 10)
  });
  const result = await api.post('/api/auth/login').send({ email: 'admin@example.com', password: 'Secret12345!' });
  expect(result.status).toBe(200);
  return result.body.token as string;
}

async function createMovie(token: string) {
  const result = await api.post('/api/movies').auth(token, { type: 'bearer' }).send(fixture);
  expect(result.status).toBe(201);
  return result.body as { id: string; reviewCount: number; averageRating: number | null };
}

beforeAll(async () => {
  // On the first local run, mongodb-memory-server may need to download a MongoDB binary.
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([User.init(), Movie.init(), Review.init()]);
});

beforeEach(async () => {
  // Preserve indexes, including the unique (movieId, userId) index.
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('authentication API', () => {
  it('registers users, logs them in and returns /me without a password hash', async () => {
    const registered = await register('Alice Doe', 'ALICE@EXAMPLE.COM');
    expect(registered.user.role).toBe('user');
    const login = await api.post('/api/auth/login').send({ email: 'alice@example.com', password: 'Secret12345!' });
    expect(login.status).toBe(200);
    const me = await api.get('/api/users/me').auth(registered.token, { type: 'bearer' });
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('alice@example.com');
    expect(me.text).not.toContain('passwordHash');
  });

  it('rejects duplicate emails, bad passwords and missing tokens', async () => {
    await register('Alice Doe', 'alice@example.com');
    expect((await api.post('/api/auth/register').send({
      name: 'Alice Again', email: 'alice@example.com', password: 'Secret12345!'
    })).status).toBe(409);
    expect((await api.post('/api/auth/login').send({
      email: 'alice@example.com', password: 'wrongPassword'
    })).status).toBe(401);
    expect((await api.get('/api/users/me')).status).toBe(401);
    expect((await api.get('/api/users/me').set('Authorization', 'Bearer not-a-jwt')).status).toBe(401);
  });
});

describe('movies and ratings API', () => {
  it('enforces admin-only creation and exposes public movie details', async () => {
    const user = await register('Regular User', 'user@example.com');
    expect((await api.post('/api/movies').send(fixture)).status).toBe(401);
    expect((await api.post('/api/movies').auth(user.token, { type: 'bearer' }).send(fixture)).status).toBe(403);
    const admin = await adminToken();
    const movie = await createMovie(admin);
    expect(movie).toMatchObject({ reviewCount: 0, averageRating: null });
    const detail = await api.get(`/api/movies/${movie.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.title).toBe('Interstellar');
    expect(detail.body.actors).toContain('Anne Hathaway');
  });

  it('filters movies by title, genre, director and year with pagination', async () => {
    const admin = await adminToken();
    await createMovie(admin);
    await api.post('/api/movies').auth(admin, { type: 'bearer' }).send({
      ...fixture, title: 'Another Film', genre: 'Comedy', year: 2020
    });
    const results = await api.get('/api/movies').query({
      search: 'inter', genre: 'science', director: 'Nolan', year: 2014, page: 1, limit: 5
    });
    expect(results.status).toBe(200);
    expect(results.body.data).toHaveLength(1);
    expect(results.body.pagination.total).toBe(1);
    expect((await api.get('/api/movies').query({ page: 0 })).status).toBe(400);
    expect((await api.get('/api/movies').query({ search: '.*' })).body.data).toHaveLength(0);
  });

  it('creates, updates and removes reviews; recomputes count and average', async () => {
    const admin = await adminToken();
    const movie = await createMovie(admin);
    const alice = await register('Alice Doe', 'alice@example.com');
    const bob = await register('Bob Doe', 'bob@example.com');
    const a = await api.post(`/api/movies/${movie.id}/reviews`).auth(alice.token, { type: 'bearer' })
      .send({ rating: 8, text: 'Very good movie' });
    expect(a.status).toBe(201);
    const b = await api.post(`/api/movies/${movie.id}/reviews`).auth(bob.token, { type: 'bearer' })
      .send({ rating: 9, text: 'Amazing soundtrack' });
    expect(b.status).toBe(201);
    const details = await api.get(`/api/movies/${movie.id}`);
    expect(details.body).toMatchObject({ reviewCount: 2, averageRating: 8.5 });
    const all = await api.get(`/api/movies/${movie.id}/reviews`);
    expect(all.body.data).toHaveLength(2);
    const update = await api.patch(`/api/reviews/${a.body.id}`).auth(alice.token, { type: 'bearer' })
      .send({ rating: 10 });
    expect(update.status).toBe(200);
    expect((await api.get(`/api/movies/${movie.id}`)).body.averageRating).toBe(9.5);
    expect((await api.delete(`/api/reviews/${b.body.id}`).auth(bob.token, { type: 'bearer' })).status).toBe(204);
    expect((await api.get(`/api/movies/${movie.id}`)).body).toMatchObject({ reviewCount: 1, averageRating: 10 });
  });

  it('prevents duplicate reviews and editing another user review', async () => {
    const admin = await adminToken();
    const movie = await createMovie(admin);
    const alice = await register('Alice Doe', 'alice@example.com');
    const bob = await register('Bob Doe', 'bob@example.com');
    const review = await api.post(`/api/movies/${movie.id}/reviews`).auth(alice.token, { type: 'bearer' })
      .send({ rating: 8, text: 'Good movie' });
    expect(review.status).toBe(201);
    expect((await api.post(`/api/movies/${movie.id}/reviews`).auth(alice.token, { type: 'bearer' })
      .send({ rating: 9, text: 'Review again' })).status).toBe(409);
    expect((await api.patch(`/api/reviews/${review.body.id}`).auth(bob.token, { type: 'bearer' })
      .send({ rating: 2 })).status).toBe(403);
    expect((await api.delete(`/api/reviews/${review.body.id}`).auth(bob.token, { type: 'bearer' })).status).toBe(403);
    expect((await api.post(`/api/movies/${movie.id}/reviews`).auth(bob.token, { type: 'bearer' })
      .send({ rating: 11, text: 'Bad rating' })).status).toBe(400);
  });

  it('updates and deletes a movie; deletion removes linked reviews', async () => {
    const admin = await adminToken();
    const movie = await createMovie(admin);
    const user = await register('Alice Doe', 'alice@example.com');
    await api.post(`/api/movies/${movie.id}/reviews`).auth(user.token, { type: 'bearer' })
      .send({ rating: 7, text: 'Interesting story' });
    const update = await api.patch(`/api/movies/${movie.id}`).auth(admin, { type: 'bearer' })
      .send({ title: 'Interstellar (2014)' });
    expect(update.status).toBe(200);
    expect(update.body.reviewCount).toBe(1);
    expect((await api.delete(`/api/movies/${movie.id}`).auth(admin, { type: 'bearer' })).status).toBe(204);
    expect((await api.get(`/api/movies/${movie.id}`)).status).toBe(404);
    expect((await api.get(`/api/movies/${movie.id}/reviews`)).status).toBe(404);
    expect(await Review.countDocuments()).toBe(0);
  });

  it('handles invalid IDs, absent data and bad JSON safely', async () => {
    expect((await api.get('/api/movies/not-an-id')).status).toBe(400);
    expect((await api.get('/api/movies/507f1f77bcf86cd799439011')).status).toBe(404);
    expect((await api.get('/does-not-exist')).status).toBe(404);
    expect((await api.post('/api/auth/login').set('Content-Type', 'application/json').send('{bad json')).status).toBe(400);
  });
});

describe('user management API', () => {
  it('permits only admins to list users and change roles', async () => {
    const admin = await adminToken();
    const alice = await register('Alice Doe', 'alice@example.com');
    expect((await api.get('/api/users').auth(alice.token, { type: 'bearer' })).status).toBe(403);
    const list = await api.get('/api/users').auth(admin, { type: 'bearer' });
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(2);
    const promote = await api.patch(`/api/users/${alice.user.id}/role`).auth(admin, { type: 'bearer' })
      .send({ role: 'admin' });
    expect(promote.status).toBe(200);
    expect(promote.body.role).toBe('admin');
    expect((await api.patch(`/api/users/${alice.user.id}/role`).auth(alice.token, { type: 'bearer' })
      .send({ role: 'user' })).status).toBe(403);
    expect((await api.patch(`/api/users/${alice.user.id}/role`).auth(admin, { type: 'bearer' })
      .send({ role: 'user' })).status).toBe(200);
    expect((await api.get('/api/users/me').auth(alice.token, { type: 'bearer' })).body.user.role).toBe('user');
  });

  it('deletes a user and their reviews, not the acting admin', async () => {
    const admin = await adminToken();
    const movie = await createMovie(admin);
    const user = await register('Alice Doe', 'alice@example.com');
    await api.post(`/api/movies/${movie.id}/reviews`).auth(user.token, { type: 'bearer' })
      .send({ rating: 5, text: 'Average movie' });
    const deleted = await api.delete(`/api/users/${user.user.id}`).auth(admin, { type: 'bearer' });
    expect(deleted.status).toBe(204);
    expect((await api.get('/api/users/me').auth(user.token, { type: 'bearer' })).status).toBe(401);
    expect((await api.get(`/api/movies/${movie.id}`)).body.reviewCount).toBe(0);
  });
});

describe('documentation', () => {
  it('exposes OpenAPI and health endpoints', async () => {
    expect((await api.get('/health')).body.status).toBe('ok');
    const docs = await api.get('/api/docs.json');
    expect(docs.status).toBe(200);
    expect(docs.body.openapi).toMatch(/^3\./);
    expect(docs.body.paths['/api/movies/{id}'].get).toBeDefined();
  });
});
