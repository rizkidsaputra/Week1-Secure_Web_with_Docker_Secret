const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('/usr/src/app/public')); // optional: serve frontend if mounted

// Read password: first try env REDIS_PASSWORD, else /run/secrets/redis_password
let redisPassword = process.env.REDIS_PASSWORD || null;
try {
  if (!redisPassword && fs.existsSync('/run/secrets/redis_password')) {
    redisPassword = fs.readFileSync('/run/secrets/redis_password', 'utf8').trim();
  }
} catch (e) {
  console.warn('Tidak dapat membaca secret file:', e.message);
}

const redisHost = process.env.REDIS_HOST || 'redis';
const redisPort = process.env.REDIS_PORT || 6379;

const client = createClient({
  socket: { host: redisHost, port: redisPort, reconnectStrategy: () => 1000 },
  password: redisPassword
});

client.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await client.connect();
})();

// We'll store todos in a Redis list as JSON: key "todos"
const TODOS_KEY = 'todos:list';

// Helper: get all todos
async function getAllTodos() {
  const items = await client.lRange(TODOS_KEY, 0, -1);
  return items.map(i => JSON.parse(i));
}

// Routes
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await getAllTodos();
    res.json(todos);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { text } = req.body;
    const todo = { id: uuidv4(), text: String(text || ''), completed: false, createdAt: new Date().toISOString() };
    await client.lPush(TODOS_KEY, JSON.stringify(todo));
    res.status(201).json(todo);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const id = req.params.id, { text } = req.body;
    const todos = await getAllTodos();
    let found = null;
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].id === id) {
        todos[i].text = text;
        found = todos[i];
        // replace entire list: simplest approach
        await client.del(TODOS_KEY);
        if (todos.length) {
          const asStrings = todos.map(t => JSON.stringify(t));
          await client.rPush(TODOS_KEY, asStrings);
        }
        break;
      }
    }
    if (!found) return res.status(404).json({ error: 'Not found' });
    res.json(found);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/todos/:id/toggle', async (req, res) => {
  try {
    const id = req.params.id;
    const todos = await getAllTodos();
    let found = null;
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].id === id) {
        todos[i].completed = !todos[i].completed;
        found = todos[i];
        await client.del(TODOS_KEY);
        const asStrings = todos.map(t => JSON.stringify(t));
        if (asStrings.length) await client.rPush(TODOS_KEY, asStrings);
        break;
      }
    }
    if (!found) return res.status(404).json({ error: 'Not found' });
    res.json(found);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const todos = await getAllTodos();
    const filtered = todos.filter(t => t.id !== id);
    await client.del(TODOS_KEY);
    if (filtered.length) {
      const asStrings = filtered.map(t => JSON.stringify(t));
      await client.rPush(TODOS_KEY, asStrings);
    }
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend jalan di port ${port}`));
