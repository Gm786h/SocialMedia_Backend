// Runs the app against an in-memory SQLite database so tests need no MySQL server.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'sqlite::memory:';

const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/db');
require('../Model');

async function resetDb() {
  await sequelize.sync({ force: true });
}

async function registerUser(name) {
  const email = `${name.toLowerCase()}@example.com`;
  const reg = await request(app).post('/api/users/register').send({ name, email, password: 'password123' });
  const login = await request(app).post('/api/users/login').send({ email, password: 'password123' });
  return { id: reg.body.user.id, token: login.body.token };
}

module.exports = { app, sequelize, request, resetDb, registerUser };
