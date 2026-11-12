const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, sequelize, request, resetDb, registerUser } = require('./helpers');

let alice;
let bob;
let postId;
const auth = (u) => ({ Authorization: `Bearer ${u.token}` });

before(async () => {
  await resetDb();
  alice = await registerUser('Alice');
  bob = await registerUser('Bob');
});

after(() => sequelize.close());

test('health check', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
});

test('register validates input and rejects duplicates', async () => {
  let res = await request(app).post('/api/users/register').send({ email: 'x@example.com' });
  assert.equal(res.status, 400);
  res = await request(app)
    .post('/api/users/register')
    .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
  assert.equal(res.status, 409);
});

test('login', async () => {
  assert.ok(alice.token);
  const res = await request(app).post('/api/users/login').send({ email: 'alice@example.com', password: 'nope' });
  assert.equal(res.status, 401);
});

test('current user and profile', async () => {
  let res = await request(app).get('/api/users/me');
  assert.equal(res.status, 401);
  res = await request(app).get('/api/users/me').set(auth(alice));
  assert.equal(res.body.name, 'Alice');
  assert.equal(res.body.password, undefined);
  res = await request(app).get('/api/users/profile').set(auth(alice));
  assert.equal(res.body.email, 'alice@example.com');
});

test('posts: create, list, get', async () => {
  let res = await request(app).post('/api/posts').set(auth(alice)).field('content', ' ');
  assert.equal(res.status, 400);

  res = await request(app).post('/api/posts').set(auth(alice)).field('content', 'Hello world');
  assert.equal(res.status, 201);
  postId = res.body.post.id;

  res = await request(app).get('/api/posts');
  assert.equal(res.body.totalPosts, 1);
  assert.equal(res.body.posts[0].User.name, 'Alice');

  res = await request(app).get(`/api/posts/${postId}`);
  assert.equal(res.body.content, 'Hello world');
  res = await request(app).get('/api/posts/9999');
  assert.equal(res.status, 404);
});

test('comments', async () => {
  let res = await request(app).post('/api/comments').set(auth(bob)).send({ postId, content: 'Nice!' });
  assert.equal(res.status, 201);
  res = await request(app).post('/api/comments').set(auth(bob)).send({ postId: 9999, content: 'x' });
  assert.equal(res.status, 404);
  res = await request(app).get(`/api/comments/${postId}`);
  assert.equal(res.body[0].User.name, 'Bob');
});

test('likes toggle', async () => {
  let res = await request(app).post('/api/likes/like').set(auth(bob)).send({ postId });
  assert.equal(res.status, 201);
  res = await request(app).get(`/api/likes/check/${postId}`).set(auth(bob));
  assert.equal(res.body.liked, true);
  res = await request(app).get(`/api/likes/${postId}`);
  assert.equal(res.body.length, 1);
  res = await request(app).post('/api/likes/like').set(auth(bob)).send({ postId });
  assert.equal(res.body.message, 'Post unliked');
});

test('friends: send, receive, accept, list, unfriend', async () => {
  let res = await request(app).post('/api/friends/send').set(auth(alice)).send({ receiverId: String(alice.id) });
  assert.equal(res.status, 400);

  res = await request(app).post('/api/friends/send').set(auth(alice)).send({ receiverId: bob.id });
  assert.equal(res.status, 201);
  const requestId = res.body.request.id;

  res = await request(app).get('/api/friends/search?query=ali').set(auth(bob));
  assert.equal(res.body[0].status, 'request_received');

  res = await request(app).get('/api/friends/received').set(auth(bob));
  assert.equal(res.body[0].sender.name, 'Alice');

  res = await request(app).post(`/api/friends/accept/${requestId}`).set(auth(bob));
  assert.equal(res.status, 200);
  res = await request(app).post(`/api/friends/accept/${requestId}`).set(auth(bob));
  assert.equal(res.status, 404);

  res = await request(app).get('/api/friends/list').set(auth(alice));
  assert.deepEqual(res.body.friends.map((f) => f.name), ['Bob']);

  res = await request(app).post('/api/friends/send').set(auth(bob)).send({ receiverId: alice.id });
  assert.equal(res.body.message, 'You are already friends.');

  res = await request(app).delete(`/api/friends/unfriend/${bob.id}`).set(auth(alice));
  assert.equal(res.status, 200);
});

test('friends: mutual requests and cancel', async () => {
  await request(app).post('/api/friends/send').set(auth(alice)).send({ receiverId: bob.id });
  let res = await request(app).post('/api/friends/cancel').set(auth(alice)).send({ receiverId: bob.id });
  assert.equal(res.status, 200);

  await request(app).post('/api/friends/send').set(auth(alice)).send({ receiverId: bob.id });
  res = await request(app).post('/api/friends/send').set(auth(bob)).send({ receiverId: alice.id });
  assert.match(res.body.message, /now friends/);
});

test('messages', async () => {
  let res = await request(app).post('/api/messages/send').set(auth(alice)).send({ receiverId: bob.id, content: 'Hi' });
  assert.equal(res.status, 201);
  await request(app).post('/api/messages/send').set(auth(bob)).send({ receiverId: alice.id, content: 'Hey' });

  res = await request(app).get(`/api/messages/${alice.id}`).set(auth(bob));
  assert.deepEqual(res.body.map((m) => m.content), ['Hey', 'Hi']);

  res = await request(app).post('/api/messages/send').set(auth(alice)).send({ receiverId: 9999, content: 'x' });
  assert.equal(res.status, 404);
});

test('unknown routes return 404 JSON', async () => {
  const res = await request(app).get('/api/nope');
  assert.equal(res.status, 404);
});
