const API = '/api';

    async function fetchTodos() {
      try {
        const res = await fetch(API + '/todos');
        if (!res.ok) throw new Error('Gagal fetch todos');
        return await res.json();
      } catch (e) {
        console.error(e);
        return [];
      }
    }

    async function addTodo() {
      const input = document.getElementById('todoInput');
      const text = input.value.trim();
      if (!text) return alert('Mohon masukkan tugas yang ingin ditambahkan!');
      try {
        const res = await fetch(API + '/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error('Gagal menambah todo');
        input.value = '';
        await renderTodos();
      } catch (e) {
        console.error(e);
        alert('Error saat menambah todo');
      }
    }

    async function toggleTodo(id) {
      try {
        const res = await fetch(API + `/todos/${id}/toggle`, { method: 'PATCH' });
        if (!res.ok) throw new Error('Gagal toggle');
        await renderTodos();
      } catch (e) { console.error(e); }
    }

    async function deleteTodo(id) {
      if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;
      try {
        const res = await fetch(API + `/todos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Gagal hapus');
        await renderTodos();
      } catch (e) { console.error(e); }
    }

    async function editTodoUI(id) {
      const textEl = document.getElementById(`text-${id}`);
      const todo = (await fetchTodos()).find(t => t.id === id);
      textEl.innerHTML = `<input id="edit-input-${id}" value="${escapeHtml(todo.text)}" maxlength="200" />`;
      const inp = document.getElementById(`edit-input-${id}`);
      inp.focus(); inp.select();
      inp.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          await saveTodo(id);
        } else if (e.key === 'Escape') {
          await renderTodos();
        }
      });
    }

    async function saveTodo(id) {
      const inp = document.getElementById(`edit-input-${id}`);
      const newText = inp.value.trim();
      if (!newText) return alert('Tugas tidak boleh kosong!');
      try {
        const res = await fetch(API + `/todos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newText })
        });
        if (!res.ok) throw new Error('Gagal simpan');
        await renderTodos();
      } catch (e) { console.error(e); }
    }

    function escapeHtml(text) {
      const d = document.createElement('div'); d.textContent = text; return d.innerHTML;
    }

    async function renderTodos() {
      const todoList = document.getElementById('todoList');
      const emptyState = document.getElementById('emptyState');
      const todos = await fetchTodos();
      todoList.innerHTML = '';
      if (!todos || todos.length === 0) { emptyState.style.display = 'block'; updateStats(0,0); return; }
      emptyState.style.display = 'none';
      todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', todo.id);
        li.innerHTML = `
          <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTodo('${todo.id}')"></div>
          <div class="todo-text" id="text-${todo.id}">${escapeHtml(todo.text)}</div>
          <div class="todo-actions">
            <button class="btn-small btn-edit" onclick="editTodoUI('${todo.id}')">Edit</button>
            <button class="btn-small btn-delete" onclick="deleteTodo('${todo.id}')">Hapus</button>
          </div>
        `;
        todoList.appendChild(li);
      });
      updateStats(todos.length, todos.filter(t => t.completed).length);
    }

    function updateStats(total, completed) {
      document.getElementById('totalTodos').textContent = total;
      document.getElementById('completedTodos').textContent = completed;
      document.getElementById('pendingTodos').textContent = total - completed;
    }

    document.addEventListener('DOMContentLoaded', () => {
      renderTodos();
      document.getElementById('todoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
      });
    });