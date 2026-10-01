<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
const user = ref(null), todos = ref([]), authMode = ref('login'), loading = ref(true), error = ref('');
const auth = ref({ name: '', email: '', password: '' }); const draft = ref({ title: '', description: '', status: 'backlog' }); const adding = ref(false); const editing = ref(null);
const solvingProof = ref(false);
const authValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(auth.value.email.trim()) && auth.value.password.length >= 8 && (authMode.value === 'login' || auth.value.name.trim().length > 0));
const dragging = ref(null);
function onKeydown(event) { if (event.key === 'Escape' && adding.value) adding.value = false; }
const columns = [{ id: 'backlog', label: 'Backlog', color: 'yellow' }, { id: 'in-progress', label: 'In progress', color: 'coral' }, { id: 'done', label: 'Done', color: 'blue' }];
const api = async (url, options = {}) => { const r = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options }); const data = r.status === 204 ? null : await r.json().catch(() => ({})); if (!r.ok) { const error = new Error(data.error || 'The server returned an unexpected response.'); error.status = r.status; throw error; } return data; };
const tasks = (status) => todos.value.filter((todo) => todo.status === status).sort((a,b) => a.order - b.order);
async function load() { try { user.value = (await api('/api/v1/me')).user; todos.value = (await api('/api/v1/todos')).todos; } catch (e) { user.value = null; if (e.status !== 401) error.value = 'Unable to reach your board. Check the server and try again.'; } finally { loading.value = false; } }
function solveProof(challenge) { return new Promise((resolve, reject) => { const worker = new Worker(new URL('./pow-worker.js', import.meta.url), { type: 'module' }); worker.onmessage = ({ data }) => { worker.terminate(); resolve(data.nonce); }; worker.onerror = () => { worker.terminate(); reject(new Error('Your browser could not complete the registration proof.')); }; worker.postMessage(challenge); }); }
async function submitAuth() { error.value = ''; solvingProof.value = authMode.value === 'register'; try { let body = auth.value; if (authMode.value === 'register') { const challenge = await api('/api/v1/auth/registration-proof', { method: 'POST' }); const nonce = await solveProof(challenge); body = { ...auth.value, proof: { challenge: challenge.challenge, nonce } }; } const path = authMode.value === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register'; user.value = (await api(path, { method: 'POST', body: JSON.stringify(body) })).user; await load(); } catch (e) { error.value = e.message; } finally { solvingProof.value = false; } }
async function createTodo() { if (!draft.value.title.trim()) return; try { const { todo } = await api('/api/v1/todos', { method: 'POST', body: JSON.stringify(draft.value) }); todos.value.push(todo); draft.value = { title: '', description: '', status: 'backlog' }; adding.value = false; } catch (e) { error.value = e.message; } }
async function update(todo, changes) { try { const { todo: saved } = await api(`/api/v1/todos/${todo.id}`, { method: 'PATCH', body: JSON.stringify(changes) }); todos.value = todos.value.map((t) => t.id === saved.id ? saved : t); } catch (e) { error.value = e.message; try { todos.value = (await api('/api/v1/todos')).todos; } catch {} } }
async function drop(event, status) { const id = event.dataTransfer.getData('text/plain'); const todo = todos.value.find((t) => t.id === id); if (todo && todo.status !== status) await update(todo, { status, order: tasks(status).length }); }
function movePointer(event) { if (dragging.value) { dragging.value.x = event.clientX; dragging.value.y = event.clientY; } }
async function endPointerDrag(event) {
  const active = dragging.value; if (!active) return;
  document.body.classList.remove('is-dragging');
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-status]');
  dragging.value = null;
  if (target && target.dataset.status !== active.todo.status) await update(active.todo, { status: target.dataset.status, order: tasks(target.dataset.status).length });
}
function startPointerDrag(event, todo) {
  if (event.button !== 0 || event.target.closest('button,input,select,form')) return;
  event.preventDefault();
  const rect = event.currentTarget.getBoundingClientRect();
  dragging.value = { todo, x: event.clientX, y: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, width: rect.width };
  document.body.classList.add('is-dragging');
  window.addEventListener('pointermove', movePointer); window.addEventListener('pointerup', endPointerDrag, { once: true });
}
onBeforeUnmount(() => { document.body.classList.remove('is-dragging'); window.removeEventListener('pointermove', movePointer); window.removeEventListener('pointerup', endPointerDrag); });
async function logout() { try { await api('/api/v1/auth/logout', { method: 'POST' }); user.value = null; todos.value = []; } catch (e) { error.value = e.message; } }
onMounted(() => { window.addEventListener('keydown', onKeydown); load(); });
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <main v-if="!loading" :class="['app', { 'is-auth': !user }]">
    <section v-if="!user" class="auth-shell">
      <div class="auth-poster"><p class="stamp">PERSONAL WORK SYSTEM</p><h1>MAKE<br>IT<br>MOVE.</h1><p>YOUR TASKS. YOUR BOARD. ZERO MEETINGS.</p><div class="arrow">↘</div></div>
      <form class="auth-form" @submit.prevent="submitAuth"><div class="switch"><button class="login-tab" type="button" :class="{ active: authMode === 'login' }" @click="authMode = 'login'">LOG IN</button><button class="create-account" type="button" :class="{ active: authMode === 'register' }" @click="authMode = 'register'">CREATE ACCOUNT</button></div><h2>{{ authMode === 'login' ? 'WELCOME BACK.' : 'START A FRESH BOARD.' }}</h2><label v-if="authMode === 'register'">NAME<input v-model="auth.name" required autocomplete="name" placeholder="Your name"></label><label>EMAIL<input v-model="auth.email" required type="email" autocomplete="email" placeholder="you@example.com"></label><label>PASSWORD<input v-model="auth.password" required minlength="8" type="password" autocomplete="current-password" placeholder="8+ characters"></label><p v-if="solvingProof" class="error" aria-live="polite">SECURING YOUR ACCOUNT…</p><p v-if="error" class="error">{{ error }}</p><button class="primary" type="submit" :disabled="!authValid || solvingProof">{{ solvingProof ? 'SECURING…' : authMode === 'login' ? 'ENTER BOARD →' : 'CREATE BOARD →' }}</button></form>
    </section>
    <template v-else><header><a class="logo">TASK<span>STACK</span></a><div class="header-actions"><span class="user">{{ user.name }}</span><button class="outline" @click="logout">LOG OUT</button></div></header><section class="board-toolbar"><button class="add" @click="adding = true">+ ADD TASK</button></section><p v-if="error" class="error board-error">{{ error }}</p><section class="board"><div v-for="column in columns" :key="column.id" :data-status="column.id" :class="['column', column.color]" @pointerup="endPointerDrag"><div class="column-head"><h2>{{ column.label }}</h2><b>{{ tasks(column.id).length }}</b></div><div class="task-list"><article v-for="todo in tasks(column.id)" :key="todo.id" :class="['task', { 'drag-origin': dragging?.todo.id === todo.id }]" @pointerdown="startPointerDrag($event, todo)"><button class="move" @click="update(todo, { status: column.id === 'backlog' ? 'in-progress' : column.id === 'in-progress' ? 'done' : 'backlog' })">↗</button><h3>{{ todo.title }}</h3><p v-if="todo.description">{{ todo.description }}</p><button class="edit" @click="editing = editing === todo.id ? null : todo.id">EDIT</button><form v-if="editing === todo.id" @submit.prevent="update(todo, { title: todo.title, description: todo.description }); editing = null"><input v-model="todo.title"><input v-model="todo.description"><button>SAVE</button></form></article><p v-if="!tasks(column.id).length" class="empty">DROP A TASK HERE</p></div></div></section><article v-if="dragging" class="task drag-card" :style="{ left: `${dragging.x - dragging.offsetX}px`, top: `${dragging.y - dragging.offsetY}px`, width: `${dragging.width}px` }"><h3>{{ dragging.todo.title }}</h3><p v-if="dragging.todo.description">{{ dragging.todo.description }}</p><button class="edit">EDIT</button></article><div v-if="adding" class="modal-backdrop" @click.self="adding = false"><form class="create modal" role="dialog" aria-modal="true" aria-labelledby="add-task-title" @submit.prevent="createTodo"><button class="close" type="button" aria-label="Close add task" @click="adding = false">×</button><h2 id="add-task-title">ADD A TASK.</h2><label>TASK NAME<input v-model="draft.title" autofocus placeholder="Name the thing you need to do" required></label><label>NOTE<input v-model="draft.description" placeholder="Add a note (optional)"></label><label>COLUMN<select v-model="draft.status"><option v-for="c in columns" :value="c.id">{{ c.label }}</option></select></label><button class="primary">ADD IT →</button></form></div></template>
  </main>
</template>
