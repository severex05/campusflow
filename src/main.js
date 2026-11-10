import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://sthprreysfvzkaqnwkea.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aHBycmV5c2Z2emthcW53a2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMzQyNTUsImV4cCI6MjEwOTgxMDI1NX0.cCx1jDHaJqGCEPwMs88WVaOzf8rZeYs6twZhn5B706A'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const app = document.getElementById('app')

const state = { session: null, profile: null }

const DISCIPLINA_CORES = ['#E8623A', '#1B2A4A', '#2E8B57', '#D98C2B', '#6D5EF8', '#C0392B', '#2980B9']

// ===== Ícones (SVG inline, estilo stroke) =====
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5V4.5Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18"/><path d="M8 2.5v4M16 2.5v4"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 11h6M9 15h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  listChecks: '<path d="M4 6h2m0 0 1.5 1.5L10 5M4 12h2m0 0 1.5 1.5L10 11M4 18h2m0 0 1.5 1.5L10 17"/><path d="M14 6h6M14 12h6M14 18h6"/>',
  graduation: '<path d="M2 9l10-5 10 5-10 5-10-5Z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.3 2.3 4.7-4.7"/>',
  xCircle: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  paperclip: '<path d="M21 11.5 12.5 20a4.5 4.5 0 0 1-6.4-6.4L14.8 5a3 3 0 0 1 4.2 4.2l-8.4 8.4a1.5 1.5 0 0 1-2.1-2.1l7.8-7.8"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
  download: '<path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  upload: '<path d="M12 20V8"/><path d="M7 13l5-5 5 5"/><path d="M4 20h16"/>',
  chat: '<path d="M4 4h16v12H8l-4 4V4Z"/>',
  send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/>',
}
function icon(name, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`
}

// ===== API helper =====
async function api(path, { method = 'GET', body } = {}) {
  const token = state.session?.access_token
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Erro inesperado')
  return data
}

function toast(msg, isError = false) {
  const el = document.createElement('div')
  el.className = `toast ${isError ? 'error' : ''}`
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3200)
}

function fmtData(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function diasRestantes(iso) {
  const diff = new Date(iso).getTime() - Date.now()
  const dias = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (dias < 0) return 'Atrasado'
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Amanhã'
  return `Em ${dias} dias`
}

function toLocalInputValue(iso) {
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

// ===== Router =====
const routes = {
  '/login': renderAuth,
  '/onboarding': renderOnboarding,
  '/painel': renderPainel,
  '/disciplinas': renderDisciplinas,
  '/calendario': renderCalendario,
  '/simulados': renderSimulados,
  '/tutor': renderTutor,
}

function navigate(path) {
  window.location.hash = path
}

async function router() {
  document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove())
  const path = window.location.hash.replace('#', '') || '/painel'

  if (!state.session) {
    if (path !== '/login') return navigate('/login')
    return renderAuth()
  }

  if (!state.profile?.onboarding_completo) {
    if (path !== '/onboarding') return navigate('/onboarding')
    return renderOnboarding()
  }

  if (path === '/login' || path === '/onboarding') return navigate('/painel')

  const base = '/' + path.split('/')[1]
  const view = routes[base] || renderPainel
  await view(path)
}

window.addEventListener('hashchange', router)

// ===== Auth =====
function renderAuth() {
  let mode = 'login'
  draw()

  function draw() {
    app.innerHTML = `
      <div class="auth-screen">
        <div class="auth-card">
          <h1>CampusFlow</h1>
          <p class="sub">Sua faculdade organizada em um só lugar.</p>
          <form id="auth-form">
            <div class="field">
              <label>E-mail</label>
              <input type="email" id="email" required />
            </div>
            <div class="field">
              <label>Senha</label>
              <input type="password" id="password" required minlength="6" />
            </div>
            <button type="submit" class="btn-accent" style="width:100%">${mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
          </form>
          <div class="auth-switch">
            ${mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
            <span id="switch">${mode === 'login' ? 'Criar conta' : 'Entrar'}</span>
          </div>
        </div>
      </div>
    `
    document.getElementById('switch').onclick = () => { mode = mode === 'login' ? 'signup' : 'login'; draw() }
    document.getElementById('auth-form').onsubmit = async (e) => {
      e.preventDefault()
      const email = document.getElementById('email').value.trim()
      const password = document.getElementById('password').value
      try {
        if (mode === 'login') {
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
        } else {
          const { error } = await supabase.auth.signUp({ email, password })
          if (error) throw error
          toast('Conta criada! Entrando...')
        }
      } catch (err) {
        toast(err.message, true)
      }
    }
  }
}

// ===== Onboarding =====
function renderOnboarding() {
  app.innerHTML = `
    <div class="auth-screen">
      <div class="auth-card" style="max-width:460px">
        <h1>Vamos te conhecer</h1>
        <p class="sub">Isso ajuda a personalizar seu painel.</p>
        <form id="onboarding-form">
          <div class="field"><label>Seu nome</label><input id="nome" required /></div>
          <div class="field"><label>Faculdade</label><input id="faculdade" required /></div>
          <div class="field"><label>Curso</label><input id="curso" required /></div>
          <div class="field"><label>Período / semestre atual</label><input id="periodo" type="number" min="1" max="20" required /></div>
          <button type="submit" class="btn-accent" style="width:100%">Começar a usar</button>
        </form>
      </div>
    </div>
  `
  document.getElementById('onboarding-form').onsubmit = async (e) => {
    e.preventDefault()
    try {
      const profile = await api('/api/onboarding', {
        method: 'POST',
        body: {
          nome: document.getElementById('nome').value.trim(),
          faculdade: document.getElementById('faculdade').value.trim(),
          curso: document.getElementById('curso').value.trim(),
          periodo: Number(document.getElementById('periodo').value),
        },
      })
      state.profile = profile
      navigate('/painel')
    } catch (err) {
      toast(err.message, true)
    }
  }
}

// ===== App shell =====
function shell(activePath, contentHtml) {
  const links = [
    { path: '/painel', label: 'Início', icon: 'home' },
    { path: '/disciplinas', label: 'Minha faculdade', icon: 'graduation' },
    { path: '/calendario', label: 'Calendário', icon: 'calendar' },
    { path: '/simulados', label: 'Simulados', icon: 'clipboard' },
    { path: '/tutor', label: 'Tutor', icon: 'chat' },
  ]
  const nome = state.profile?.nome || 'Você'
  const inicial = nome.trim().charAt(0).toUpperCase() || 'V'
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="logo-badge">CF</div>
          <div>
            <div class="logo">CampusFlow</div>
            <div class="tagline">Sua faculdade organizada</div>
          </div>
        </div>
        <nav>
          ${links.map((l) => `<a href="#${l.path}" class="${activePath.startsWith(l.path) ? 'active' : ''}">${icon(l.icon)}<span>${l.label}</span></a>`).join('')}
        </nav>
        <div class="user-card">
          <div class="user-avatar">${inicial}</div>
          <div class="user-info">
            <div class="user-name">${nome}</div>
            <div class="logout" id="logout">Sair</div>
          </div>
        </div>
      </aside>
      <main class="main-content">${contentHtml}</main>
    </div>
  `
  document.getElementById('logout').onclick = async (e) => {
    e.preventDefault()
    await supabase.auth.signOut()
  }
}

function openModal(innerHtml) {
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop'
  backdrop.innerHTML = `<div class="modal">${innerHtml}</div>`
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove() }
  document.body.appendChild(backdrop)
  return backdrop
}

// ===== Painel (dashboard) =====
async function renderPainel() {
  shell('/painel', `<div class="empty-state">Carregando...</div>`)
  let dashboard
  try {
    dashboard = await api('/api/dashboard')
  } catch (err) {
    return shell('/painel', `<div class="empty-state">${err.message}</div>`)
  }

  const { proximosEventos, tarefasPendentes, disciplinasAtencao, totalDisciplinas } = dashboard

  shell('/painel', `
    <h1 class="page-title">Olá, ${state.profile?.nome?.split(' ')[0] || ''} 👋</h1>
    <p class="page-sub">O que você precisa fazer hoje?</p>

    <div class="grid-3" style="margin-bottom:24px">
      <div class="stat-tile"><div class="stat-icon c-accent">${icon('calendar', 20)}</div><div class="num">${proximosEventos.length}</div><div class="label">Provas/trabalhos nos próximos 7 dias</div></div>
      <div class="stat-tile"><div class="stat-icon c-primary">${icon('listChecks', 20)}</div><div class="num">${tarefasPendentes.length}</div><div class="label">Tarefas pendentes</div></div>
      <div class="stat-tile"><div class="stat-icon c-success">${icon('graduation', 20)}</div><div class="num">${totalDisciplinas}</div><div class="label">Disciplinas cadastradas</div></div>
    </div>

    ${disciplinasAtencao.length ? `
      <div class="card" style="border-left:4px solid var(--danger)">
        <h3>⚠️ Atenção com faltas</h3>
        ${disciplinasAtencao.map((d) => `
          <div class="list-row">
            <span>${d.nome}</span>
            <span class="badge badge-danger">${d.faltas_usadas}/${d.faltas_permitidas} faltas usadas</span>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="grid-2">
      <div class="card">
        <h3>Próximos compromissos</h3>
        ${proximosEventos.length === 0 ? '<div class="empty-state">Nada nos próximos 7 dias. 🎉</div>' : proximosEventos.map((ev) => `
          <div class="event-row">
            <div class="event-dot" style="background:${ev.disciplinas?.cor || 'var(--accent)'}"></div>
            <div class="event-meta">
              <div class="event-title">${ev.titulo}</div>
              <div class="event-sub">${ev.disciplinas?.nome || ''} · ${fmtData(ev.data_hora)}</div>
            </div>
            <span class="badge ${diasRestantes(ev.data_hora) === 'Hoje' || diasRestantes(ev.data_hora) === 'Amanhã' ? 'badge-warn' : ''}">${diasRestantes(ev.data_hora)}</span>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <h3>Tarefas pendentes</h3>
        ${tarefasPendentes.length === 0 ? '<div class="empty-state">Tudo em dia. ✅</div>' : tarefasPendentes.slice(0, 8).map((t) => `
          <div class="task-row">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;flex:1">
              <input type="checkbox" data-task="${t.id}" style="width:auto" />
              <span>${t.titulo}${t.disciplinas?.nome ? ` <span class="event-sub">· ${t.disciplinas.nome}</span>` : ''}</span>
            </label>
          </div>
        `).join('')}
        <form id="quick-task-form" style="display:flex;gap:8px;margin-top:12px">
          <input id="quick-task-input" placeholder="Nova tarefa rápida..." />
          <button type="submit" class="btn-ghost btn-sm">+ Add</button>
        </form>
      </div>
    </div>
  `)

  app.querySelectorAll('[data-task]').forEach((cb) => {
    cb.onchange = async () => {
      try {
        await api(`/api/tarefas/${cb.dataset.task}`, { method: 'PUT', body: { concluida: true } })
        renderPainel()
      } catch (err) { toast(err.message, true) }
    }
  })

  document.getElementById('quick-task-form').onsubmit = async (e) => {
    e.preventDefault()
    const input = document.getElementById('quick-task-input')
    const titulo = input.value.trim()
    if (!titulo) return
    try {
      await api('/api/tarefas', { method: 'POST', body: { titulo } })
      renderPainel()
    } catch (err) { toast(err.message, true) }
  }
}

// ===== Disciplinas =====
async function renderDisciplinas() {
  shell('/disciplinas', `<div class="empty-state">Carregando...</div>`)
  let disciplinas, materiais
  try {
    ;[disciplinas, materiais] = await Promise.all([api('/api/disciplinas'), api('/api/materiais')])
  } catch (err) {
    return shell('/disciplinas', `<div class="empty-state">${err.message}</div>`)
  }

  shell('/disciplinas', `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <h1 class="page-title">Minha faculdade</h1>
        <p class="page-sub">${state.profile?.faculdade || ''} · ${state.profile?.curso || ''} · ${state.profile?.periodo ? state.profile.periodo + 'º período' : ''}</p>
      </div>
      <button class="btn-accent" id="add-disciplina">+ Disciplina</button>
    </div>

    ${disciplinas.length === 0 ? '<div class="empty-state">Nenhuma disciplina cadastrada ainda.</div>' : `
      <div class="grid-2">
        ${disciplinas.map((d) => {
          const pct = d.faltas_permitidas ? Math.min(100, Math.round((d.faltas_usadas / d.faltas_permitidas) * 100)) : 0
          const barColor = pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warn)' : 'var(--success)'
          return `
            <div class="card disciplina-card" style="border-top-color:${d.cor}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div style="display:flex;gap:12px;align-items:flex-start">
                  <div class="disciplina-icon" style="background:${d.cor}22;color:${d.cor}">${icon('book', 20)}</div>
                  <div>
                    <h3 style="margin-bottom:2px">${d.nome}</h3>
                    <div class="event-sub">${d.professor || 'Professor não informado'}${d.horario ? ' · ' + d.horario : ''}</div>
                  </div>
                </div>
                <div class="row-actions">
                  <button class="btn-ghost btn-sm" data-edit="${d.id}">Editar</button>
                  <button class="btn-danger btn-sm" data-del="${d.id}">Excluir</button>
                </div>
              </div>
              ${d.faltas_permitidas ? `
                <div style="margin-top:14px">
                  <div class="event-sub">Faltas: ${d.faltas_usadas}/${d.faltas_permitidas}</div>
                  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${barColor}"></div></div>
                </div>
                <button class="btn-ghost btn-sm" style="margin-top:10px" data-falta="${d.id}">+ Registrar falta</button>
              ` : ''}
              <button class="btn-ghost btn-sm" style="margin-top:10px" data-materiais="${d.id}">${icon('paperclip', 14)} Materiais (${materiais.filter((m) => m.disciplina_id === d.id).length})</button>
              ${d.boletim ? `
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
                  ${d.boletim.notaAtualPonderada != null ? `<div class="event-sub">Média ponderada até agora: <strong>${d.boletim.notaAtualPonderada.toFixed(1)}</strong></div>` : ''}
                  ${d.boletim.notaNecessaria != null ? `
                    <div class="event-sub" style="margin-top:4px">
                      Pra alcançar a média ${d.nota_minima}, você precisa de
                      <strong style="color:${d.boletim.notaNecessaria > 10 ? 'var(--danger)' : 'var(--ink)'}">${d.boletim.notaNecessaria.toFixed(1)}</strong>
                      nas ${d.boletim.avaliacoesPendentes} avaliação(ões) restante(s)
                      ${d.boletim.notaNecessaria > 10 ? ' <span class="badge badge-danger">matematicamente impossível com o peso atual</span>' : ''}
                    </div>
                  ` : (d.boletim.avaliacoesPendentes === 0 && d.boletim.notaAtualPonderada != null ? `<div class="event-sub" style="margin-top:4px">Todas as avaliações já lançadas.</div>` : '')}
                </div>
              ` : ''}
            </div>
          `
        }).join('')}
      </div>
    `}
  `)

  document.getElementById('add-disciplina').onclick = () => disciplinaModal()
  app.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => disciplinaModal(disciplinas.find((d) => d.id === b.dataset.edit)))
  app.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
    if (!confirm('Excluir esta disciplina? Isso remove também provas e tarefas ligadas a ela.')) return
    try { await api(`/api/disciplinas/${b.dataset.del}`, { method: 'DELETE' }); renderDisciplinas() } catch (err) { toast(err.message, true) }
  })
  app.querySelectorAll('[data-falta]').forEach((b) => b.onclick = async () => {
    const d = disciplinas.find((x) => x.id === b.dataset.falta)
    try { await api(`/api/disciplinas/${d.id}`, { method: 'PUT', body: { faltas_usadas: d.faltas_usadas + 1 } }); renderDisciplinas() } catch (err) { toast(err.message, true) }
  })
  app.querySelectorAll('[data-materiais]').forEach((b) => b.onclick = () => {
    const d = disciplinas.find((x) => x.id === b.dataset.materiais)
    materiaisModal(d, materiais.filter((m) => m.disciplina_id === d.id))
  })
}

function fmtBytes(n) {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function materiaisModal(disciplina, itens) {
  const backdrop = openModal('')
  function draw() {
    backdrop.querySelector('.modal').innerHTML = `
      <h2>Materiais · ${disciplina.nome}</h2>
      <p class="event-sub" style="margin-bottom:14px">Arquivos que o professor te passou — só você vê, não é compartilhado com ninguém.</p>
      ${itens.length === 0 ? '<div class="empty-state">Nenhum arquivo ainda.</div>' : itens.map((m) => `
        <div class="list-row">
          <div class="event-meta">
            <div class="event-title">${m.nome}</div>
            <div class="event-sub">${fmtBytes(m.tamanho)}</div>
          </div>
          <div class="row-actions">
            <button class="btn-ghost btn-sm" data-download="${m.id}">${icon('download', 14)}</button>
            <button class="btn-danger btn-sm" data-remove="${m.id}">${icon('trash', 14)}</button>
          </div>
        </div>
      `).join('')}
      <div class="field" style="margin-top:16px">
        <label>Adicionar arquivo</label>
        <input type="file" id="file-input" multiple />
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-ghost" id="close">Fechar</button>
      </div>
    `
    backdrop.querySelector('#close').onclick = () => backdrop.remove()
    backdrop.querySelectorAll('[data-download]').forEach((b) => b.onclick = async () => {
      const win = window.open('', '_blank')
      try {
        const { url } = await api(`/api/materiais/${b.dataset.download}/url`)
        if (win) win.location.href = url
        else toast('Seu navegador bloqueou a abertura do arquivo. Permita pop-ups e tente de novo.', true)
      } catch (err) {
        if (win) win.close()
        toast(err.message, true)
      }
    })
    backdrop.querySelectorAll('[data-remove]').forEach((b) => b.onclick = async () => {
      if (!confirm('Excluir este arquivo?')) return
      try {
        await api(`/api/materiais/${b.dataset.remove}`, { method: 'DELETE' })
        itens = itens.filter((m) => m.id !== b.dataset.remove)
        draw()
        renderDisciplinas()
      } catch (err) { toast(err.message, true) }
    })
    backdrop.querySelector('#file-input').onchange = async (e) => {
      const files = Array.from(e.target.files)
      e.target.value = ''
      if (!files.length) return
      const userId = state.session.user.id
      for (const file of files) {
        // Supabase Storage rejeita chaves com acento/espaço ("Invalid key") --
        // sanitiza só o nome usado no caminho, mantém o nome original (`nome`)
        // pra exibição.
        const safeName = file.name
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const path = `${userId}/${disciplina.id}/${Date.now()}_${safeName}`
        try {
          const { error: upErr } = await supabase.storage.from('materiais').upload(path, file, { contentType: file.type || 'application/octet-stream' })
          if (upErr) throw upErr
          const novo = await api('/api/materiais', {
            method: 'POST',
            body: { disciplina_id: disciplina.id, nome: file.name, storage_path: path, tipo: file.type, tamanho: file.size },
          })
          itens = [novo, ...itens]
        } catch (err) { toast(`${file.name}: ${err.message || 'erro ao enviar'}`, true) }
      }
      draw()
      renderDisciplinas()
    }
  }
  draw()
}

function disciplinaModal(d) {
  const backdrop = openModal(`
    <h2>${d ? 'Editar disciplina' : 'Nova disciplina'}</h2>
    <form id="disciplina-form">
      <div class="field"><label>Nome</label><input id="d-nome" value="${d?.nome || ''}" required /></div>
      <div class="field"><label>Professor</label><input id="d-professor" value="${d?.professor || ''}" /></div>
      <div class="field"><label>Horário (ex: Seg/Qua 08h-10h)</label><input id="d-horario" value="${d?.horario || ''}" /></div>
      <div class="grid-2">
        <div class="field"><label>Faltas permitidas no semestre</label><input id="d-faltas" type="number" min="0" value="${d?.faltas_permitidas ?? 0}" /></div>
        <div class="field"><label>Nota mínima p/ aprovação</label><input id="d-nota-min" type="number" step="0.1" value="${d?.nota_minima ?? 6}" /></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-ghost" id="cancel">Cancelar</button>
        <button type="submit" class="btn-accent">Salvar</button>
      </div>
    </form>
  `)
  backdrop.querySelector('#cancel').onclick = () => backdrop.remove()
  backdrop.querySelector('#disciplina-form').onsubmit = async (e) => {
    e.preventDefault()
    const body = {
      nome: document.getElementById('d-nome').value.trim(),
      professor: document.getElementById('d-professor').value.trim(),
      horario: document.getElementById('d-horario').value.trim(),
      faltas_permitidas: Number(document.getElementById('d-faltas').value) || 0,
      nota_minima: Number(document.getElementById('d-nota-min').value) || 6,
      cor: d?.cor || DISCIPLINA_CORES[Math.floor(Math.random() * DISCIPLINA_CORES.length)],
    }
    try {
      if (d) await api(`/api/disciplinas/${d.id}`, { method: 'PUT', body })
      else await api('/api/disciplinas', { method: 'POST', body })
      backdrop.remove()
      renderDisciplinas()
    } catch (err) { toast(err.message, true) }
  }
}

// ===== Calendário =====
async function renderCalendario() {
  shell('/calendario', `<div class="empty-state">Carregando...</div>`)
  let eventos, disciplinas, tarefas
  try {
    ;[eventos, disciplinas, tarefas] = await Promise.all([api('/api/eventos'), api('/api/disciplinas'), api('/api/tarefas')])
  } catch (err) {
    return shell('/calendario', `<div class="empty-state">${err.message}</div>`)
  }

  const pendentes = eventos.filter((e) => !e.concluido)
  const concluidos = eventos.filter((e) => e.concluido)
  const tarefasPorEvento = (eventoId) => tarefas.filter((t) => t.evento_id === eventoId)
  const expandido = new Set()

  function eventoRow(ev, opaco) {
    const subtarefas = tarefasPorEvento(ev.id)
    const feitas = subtarefas.filter((t) => t.concluida).length
    return `
      <div style="border-bottom:1px solid var(--border);padding:12px 0;${opaco ? 'opacity:0.6' : ''}">
        <div class="event-row" style="border:none;padding:0">
          <div class="event-dot" style="background:${ev.disciplinas?.cor || 'var(--accent)'}"></div>
          <div class="event-meta">
            <div class="event-title">${ev.titulo} <span class="badge">${ev.tipo}</span> ${ev.peso ? `<span class="badge">peso ${ev.peso}</span>` : ''} ${ev.nota != null ? `<span class="badge badge-warn">nota ${ev.nota}</span>` : ''}</div>
            <div class="event-sub">${ev.disciplinas?.nome || 'Sem disciplina'} · ${fmtData(ev.data_hora)} ${!opaco ? '· ' + diasRestantes(ev.data_hora) : ''}</div>
          </div>
          <div class="row-actions">
            <button class="btn-ghost btn-sm" data-toggle-sub="${ev.id}">Tarefas${subtarefas.length ? ` (${feitas}/${subtarefas.length})` : ''}</button>
            ${!opaco ? `<button class="btn-ghost btn-sm" data-edit="${ev.id}">Editar</button>` : ''}
            ${!opaco ? `<button class="btn-ghost btn-sm" data-done="${ev.id}">Concluir</button>` : ''}
            ${opaco && (ev.tipo === 'prova' || ev.tipo === 'trabalho') && ev.nota == null ? `<button class="btn-ghost btn-sm" data-nota="${ev.id}">Informar nota</button>` : ''}
            <button class="btn-danger btn-sm" data-del="${ev.id}">Excluir</button>
          </div>
        </div>
        <div data-sub-container="${ev.id}" style="display:${expandido.has(ev.id) ? 'block' : 'none'};margin:10px 0 0 24px">
          ${subtarefas.map((t) => `
            <div class="task-row" style="padding:6px 0">
              <label style="display:flex;align-items:center;gap:10px;cursor:pointer;flex:1">
                <input type="checkbox" data-task="${t.id}" ${t.concluida ? 'checked' : ''} style="width:auto" />
                <span style="${t.concluida ? 'text-decoration:line-through;opacity:0.6' : ''}">${t.titulo}</span>
              </label>
              <button class="btn-ghost btn-sm" data-del-task="${t.id}">✕</button>
            </div>
          `).join('')}
          <form data-task-form="${ev.id}" style="display:flex;gap:8px;margin-top:6px">
            <input placeholder="+ Nova etapa..." style="font-size:13px;padding:6px 10px" />
            <button type="submit" class="btn-ghost btn-sm">Add</button>
          </form>
        </div>
      </div>
    `
  }

  function draw() {
    shell('/calendario', `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><h1 class="page-title">Calendário</h1><p class="page-sub">Provas, trabalhos e prazos</p></div>
        <button class="btn-accent" id="add-evento">+ Novo</button>
      </div>

      <div class="card">
        <h3>Pendentes</h3>
        ${pendentes.length === 0 ? '<div class="empty-state">Nada pendente.</div>' : pendentes.map((ev) => eventoRow(ev, false)).join('')}
      </div>

      ${concluidos.length ? `
        <div class="card">
          <h3>Concluídos</h3>
          ${concluidos.map((ev) => eventoRow(ev, true)).join('')}
        </div>
      ` : ''}
    `)

    document.getElementById('add-evento').onclick = () => eventoModal(disciplinas, null, renderCalendario)
    app.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => eventoModal(disciplinas, eventos.find((e) => e.id === b.dataset.edit), renderCalendario))
    app.querySelectorAll('[data-done]').forEach((b) => b.onclick = async () => {
      try { await api(`/api/eventos/${b.dataset.done}`, { method: 'PUT', body: { concluido: true } }); renderCalendario() } catch (err) { toast(err.message, true) }
    })
    app.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
      if (!confirm('Excluir este evento? Isso também remove as tarefas ligadas a ele.')) return
      try { await api(`/api/eventos/${b.dataset.del}`, { method: 'DELETE' }); renderCalendario() } catch (err) { toast(err.message, true) }
    })
    app.querySelectorAll('[data-nota]').forEach((b) => b.onclick = async () => {
      const nota = prompt('Qual nota você tirou nessa avaliação?')
      if (nota === null || nota.trim() === '') return
      try { await api(`/api/eventos/${b.dataset.nota}`, { method: 'PUT', body: { nota: Number(nota.replace(',', '.')) } }); renderCalendario() } catch (err) { toast(err.message, true) }
    })
    app.querySelectorAll('[data-toggle-sub]').forEach((b) => b.onclick = () => {
      const id = b.dataset.toggleSub
      if (expandido.has(id)) expandido.delete(id); else expandido.add(id)
      draw()
    })
    app.querySelectorAll('[data-task]').forEach((cb) => cb.onchange = async () => {
      try { await api(`/api/tarefas/${cb.dataset.task}`, { method: 'PUT', body: { concluida: cb.checked } }); const t = tarefas.find((x) => x.id === cb.dataset.task); t.concluida = cb.checked; draw() } catch (err) { toast(err.message, true) }
    })
    app.querySelectorAll('[data-del-task]').forEach((b) => b.onclick = async () => {
      try { await api(`/api/tarefas/${b.dataset.delTask}`, { method: 'DELETE' }); tarefas = tarefas.filter((t) => t.id !== b.dataset.delTask); draw() } catch (err) { toast(err.message, true) }
    })
    app.querySelectorAll('[data-task-form]').forEach((f) => f.onsubmit = async (e) => {
      e.preventDefault()
      const eventoId = f.dataset.taskForm
      const input = f.querySelector('input')
      const titulo = input.value.trim()
      if (!titulo) return
      try {
        const nova = await api('/api/tarefas', { method: 'POST', body: { titulo, evento_id: eventoId } })
        tarefas.push(nova)
        expandido.add(eventoId)
        draw()
      } catch (err) { toast(err.message, true) }
    })
  }
  draw()
}

function eventoModal(disciplinas, ev, onSaved) {
  const backdrop = openModal(`
    <h2>${ev ? 'Editar compromisso' : 'Novo compromisso'}</h2>
    <form id="evento-form">
      <div class="field"><label>Título</label><input id="e-titulo" value="${ev?.titulo || ''}" required /></div>
      <div class="grid-2">
        <div class="field">
          <label>Tipo</label>
          <select id="e-tipo">
            <option value="prova" ${ev?.tipo === 'prova' ? 'selected' : ''}>Prova</option>
            <option value="trabalho" ${ev?.tipo === 'trabalho' ? 'selected' : ''}>Trabalho</option>
            <option value="seminario" ${ev?.tipo === 'seminario' ? 'selected' : ''}>Seminário</option>
            <option value="outro" ${!ev || ev?.tipo === 'outro' ? 'selected' : ''}>Outro</option>
          </select>
        </div>
        <div class="field">
          <label>Disciplina</label>
          <select id="e-disciplina">
            <option value="">—</option>
            ${disciplinas.map((d) => `<option value="${d.id}" ${ev?.disciplina_id === d.id ? 'selected' : ''}>${d.nome}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field"><label>Data e hora</label><input id="e-data" type="datetime-local" value="${ev ? toLocalInputValue(ev.data_hora) : ''}" required /></div>
      <div class="grid-2">
        <div class="field"><label>Peso na média (opcional)</label><input id="e-peso" type="number" step="0.1" value="${ev?.peso ?? ''}" placeholder="ex: 30" /></div>
        <div class="field"><label>Nota obtida (se já corrigida)</label><input id="e-nota" type="number" step="0.1" value="${ev?.nota ?? ''}" /></div>
      </div>
      <div class="field"><label>Descrição (opcional)</label><textarea id="e-descricao" rows="2">${ev?.descricao || ''}</textarea></div>
      <div class="modal-actions">
        <button type="button" class="btn-ghost" id="cancel">Cancelar</button>
        <button type="submit" class="btn-accent">Salvar</button>
      </div>
    </form>
  `)
  backdrop.querySelector('#cancel').onclick = () => backdrop.remove()
  backdrop.querySelector('#evento-form').onsubmit = async (e) => {
    e.preventDefault()
    const pesoVal = document.getElementById('e-peso').value
    const notaVal = document.getElementById('e-nota').value
    const body = {
      titulo: document.getElementById('e-titulo').value.trim(),
      tipo: document.getElementById('e-tipo').value,
      disciplina_id: document.getElementById('e-disciplina').value || null,
      data_hora: new Date(document.getElementById('e-data').value).toISOString(),
      descricao: document.getElementById('e-descricao').value.trim(),
      peso: pesoVal === '' ? null : Number(pesoVal),
      nota: notaVal === '' ? null : Number(notaVal),
    }
    try {
      if (ev) await api(`/api/eventos/${ev.id}`, { method: 'PUT', body })
      else await api('/api/eventos', { method: 'POST', body })
      backdrop.remove()
      onSaved?.()
    } catch (err) { toast(err.message, true) }
  }
}

// ===== Simulados =====
async function renderSimulados(path) {
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 2) return renderSimuladoDetalhe(parts[1])

  shell('/simulados', `<div class="empty-state">Carregando...</div>`)
  let simulados, disciplinas, materiais
  try {
    ;[simulados, disciplinas, materiais] = await Promise.all([api('/api/simulados'), api('/api/disciplinas'), api('/api/materiais')])
  } catch (err) {
    return shell('/simulados', `<div class="empty-state">${err.message}</div>`)
  }

  shell('/simulados', `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><h1 class="page-title">Simulados</h1><p class="page-sub">Teste o que você já sabe antes da prova</p></div>
      <div class="row-actions">
        <button class="btn-ghost" id="add-ia">✨ Gerar com IA</button>
        <button class="btn-accent" id="add-manual">+ Criar manual</button>
      </div>
    </div>

    ${simulados.length === 0 ? '<div class="empty-state">Nenhum simulado ainda. Crie um manualmente ou gere a partir de um material de estudo.</div>' : `
      <div class="grid-2">
        ${simulados.map((s) => `
          <div class="card">
            <h3>${s.titulo} ${s.origem === 'ia' ? '<span class="badge">✨ IA</span>' : ''} ${s.origem === 'ia' && s.estrito ? '<span class="badge badge-warn">📘 Fiel ao material</span>' : ''}</h3>
            <div class="event-sub">${s.disciplinas?.nome || 'Sem disciplina'}</div>
            <button class="btn-accent btn-sm" style="margin-top:12px" data-start="${s.id}">Fazer simulado</button>
          </div>
        `).join('')}
      </div>
    `}
  `)

  document.getElementById('add-manual').onclick = () => simuladoManualModal(disciplinas)
  document.getElementById('add-ia').onclick = () => simuladoIaModal(disciplinas, materiais)
  app.querySelectorAll('[data-start]').forEach((b) => b.onclick = () => navigate(`/simulados/${b.dataset.start}`))
}

function simuladoManualModal(disciplinas) {
  let questoes = [{ enunciado: '', alternativas: ['', '', '', ''], resposta_correta: 0 }]
  let titulo = ''
  let disciplinaId = ''

  const backdrop = openModal('')
  function draw() {
    backdrop.querySelector('.modal').innerHTML = `
      <h2>Criar simulado manual</h2>
      <form id="sim-form">
        <div class="field"><label>Título</label><input id="s-titulo" value="${titulo}" required /></div>
        <div class="field">
          <label>Disciplina</label>
          <select id="s-disciplina"><option value="">—</option>${disciplinas.map((d) => `<option value="${d.id}" ${d.id === disciplinaId ? 'selected' : ''}>${d.nome}</option>`).join('')}</select>
        </div>
        <hr style="border:none;border-top:1px solid var(--border);margin:16px 0" />
        ${questoes.map((q, i) => `
          <div class="field" style="background:var(--bg);padding:12px;border-radius:10px">
            <label>Questão ${i + 1}</label>
            <input data-q="${i}" data-f="enunciado" value="${q.enunciado}" placeholder="Enunciado" style="margin-bottom:8px" />
            ${q.alternativas.map((alt, j) => `
              <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
                <input type="radio" name="correta-${i}" data-q="${i}" data-correta="${j}" ${q.resposta_correta === j ? 'checked' : ''} style="width:auto" />
                <input data-q="${i}" data-alt="${j}" value="${alt}" placeholder="Alternativa ${j + 1}" />
              </div>
            `).join('')}
          </div>
        `).join('')}
        <button type="button" class="btn-ghost btn-sm" id="add-q" style="margin-top:8px">+ Adicionar questão</button>
        <div class="modal-actions">
          <button type="button" class="btn-ghost" id="cancel">Cancelar</button>
          <button type="submit" class="btn-accent">Criar simulado</button>
        </div>
      </form>
    `
    backdrop.querySelector('#cancel').onclick = () => backdrop.remove()
    backdrop.querySelector('#s-titulo').oninput = (e) => { titulo = e.target.value }
    backdrop.querySelector('#s-disciplina').onchange = (e) => { disciplinaId = e.target.value }
    backdrop.querySelector('#add-q').onclick = () => {
      sync()
      questoes.push({ enunciado: '', alternativas: ['', '', '', ''], resposta_correta: 0 })
      draw()
    }
    backdrop.querySelectorAll('[data-f]').forEach((inp) => inp.oninput = () => { questoes[inp.dataset.q][inp.dataset.f] = inp.value })
    backdrop.querySelectorAll('[data-alt]').forEach((inp) => inp.oninput = () => { questoes[inp.dataset.q].alternativas[inp.dataset.alt] = inp.value })
    backdrop.querySelectorAll('[data-correta]').forEach((r) => r.onchange = () => { questoes[r.dataset.q].resposta_correta = Number(r.dataset.correta) })
    backdrop.querySelector('#sim-form').onsubmit = async (e) => {
      e.preventDefault()
      sync()
      try {
        await api('/api/simulados', {
          method: 'POST',
          body: {
            titulo: titulo.trim(),
            disciplina_id: disciplinaId || null,
            questoes,
          },
        })
        backdrop.remove()
        renderSimulados('/simulados')
      } catch (err) { toast(err.message, true) }
    }
  }
  function sync() {
    titulo = backdrop.querySelector('#s-titulo').value
    disciplinaId = backdrop.querySelector('#s-disciplina').value
    backdrop.querySelectorAll('[data-f]').forEach((inp) => { questoes[inp.dataset.q][inp.dataset.f] = inp.value })
    backdrop.querySelectorAll('[data-alt]').forEach((inp) => { questoes[inp.dataset.q].alternativas[inp.dataset.alt] = inp.value })
  }
  draw()
}

function simuladoIaModal(disciplinas, materiais) {
  let fonte = materiais.length ? 'arquivo' : 'texto'
  const backdrop = openModal('')

  function draw() {
    backdrop.querySelector('.modal').innerHTML = `
      <h2>✨ Gerar simulado com IA</h2>
      <p class="event-sub" style="margin-bottom:14px">A partir de um PDF já salvo em Materiais, ou de um texto colado — a IA monta as questões.</p>
      <form id="sim-ia-form">
        <div class="field"><label>Título (opcional)</label><input id="si-titulo" placeholder="ex: Revisão Cálculo I - Derivadas" /></div>
        <div class="field">
          <label>Disciplina</label>
          <select id="si-disciplina"><option value="">—</option>${disciplinas.map((d) => `<option value="${d.id}">${d.nome}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Número de questões</label><input id="si-num" type="number" min="3" max="15" value="5" /></div>

        <div class="field" style="display:flex;gap:8px">
          <button type="button" class="btn-sm ${fonte === 'arquivo' ? 'btn-primary' : 'btn-ghost'}" id="tab-arquivo">📎 Usar arquivo salvo</button>
          <button type="button" class="btn-sm ${fonte === 'texto' ? 'btn-primary' : 'btn-ghost'}" id="tab-texto">Colar texto</button>
        </div>

        ${fonte === 'arquivo' ? `
          ${materiais.length === 0 ? `<p class="event-sub">Você ainda não tem nenhum arquivo em Materiais. Vá em Minha faculdade → Materiais e envie um PDF primeiro, ou cole o texto diretamente.</p>` : `
            <div class="field">
              <label>Arquivo</label>
              <select id="si-material-id" required>
                <option value="">Selecione...</option>
                ${materiais.map((m) => `<option value="${m.id}">${m.nome}</option>`).join('')}
              </select>
            </div>
          `}
        ` : `
          <div class="field"><label>Material de estudo</label><textarea id="si-material" rows="8" required placeholder="Cole aqui seu resumo ou anotações..."></textarea></div>
        `}

        <div class="field">
          <label>Fonte das respostas</label>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
            <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;font-weight:400">
              <input type="radio" name="modo" id="modo-estrito" value="estrito" checked style="width:auto;margin-top:3px" />
              <span><strong>Seguir só o material enviado</strong><br/><span class="event-sub">Recomendado pra matérias que mudam (direito, legislação, normas) — a IA não mistura com informação atual, só usa o que está no seu material, mesmo que esteja desatualizado em relação à realidade.</span></span>
            </label>
            <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;font-weight:400">
              <input type="radio" name="modo" id="modo-flexivel" value="flexivel" style="width:auto;margin-top:3px" />
              <span><strong>Pode complementar com conhecimento geral</strong><br/><span class="event-sub">A IA usa o material como base mas pode enriquecer com contexto adicional que ela já sabe.</span></span>
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-ghost" id="cancel">Cancelar</button>
          <button type="submit" class="btn-accent" id="submit-ia">Gerar simulado</button>
        </div>
      </form>
    `
    backdrop.querySelector('#cancel').onclick = () => backdrop.remove()
    backdrop.querySelector('#tab-arquivo').onclick = () => { fonte = 'arquivo'; draw() }
    backdrop.querySelector('#tab-texto').onclick = () => { fonte = 'texto'; draw() }
    backdrop.querySelector('#sim-ia-form').onsubmit = async (e) => {
      e.preventDefault()
      const btn = document.getElementById('submit-ia')
      const body = {
        titulo: document.getElementById('si-titulo').value.trim(),
        disciplina_id: document.getElementById('si-disciplina').value || null,
        num_questoes: Number(document.getElementById('si-num').value),
        estrito: document.getElementById('modo-estrito').checked,
      }
      if (fonte === 'arquivo') {
        const materialId = document.getElementById('si-material-id')?.value
        if (!materialId) return toast('Selecione um arquivo', true)
        body.material_id = materialId
      } else {
        body.material = document.getElementById('si-material').value.trim()
      }
      btn.disabled = true
      btn.textContent = 'Gerando...'
      try {
        await api('/api/simulados/gerar-ia', { method: 'POST', body })
        backdrop.remove()
        renderSimulados('/simulados')
      } catch (err) {
        toast(err.message, true)
        btn.disabled = false
        btn.textContent = 'Gerar simulado'
      }
    }
  }
  draw()
}

async function renderSimuladoDetalhe(id) {
  shell('/simulados', `<div class="empty-state">Carregando...</div>`)
  let simulado, historico
  try {
    ;[simulado, historico] = await Promise.all([api(`/api/simulados/${id}`), api(`/api/simulados/${id}/tentativas`)])
  } catch (err) {
    return shell('/simulados', `<div class="empty-state">${err.message}</div>`)
  }

  const respostas = new Array(simulado.questoes.length).fill(null)
  let enviado = false
  let resultado = null

  function draw() {
    shell('/simulados', `
      <a href="#/simulados" style="color:var(--ink-soft);font-size:13px">← Voltar aos simulados</a>
      <h1 class="page-title" style="margin-top:12px">${simulado.titulo}</h1>
      <p class="page-sub">${simulado.disciplinas?.nome || ''}</p>

      ${resultado ? `
        <div class="card" style="text-align:center">
          <h3 style="font-size:20px">Você acertou ${resultado.acertos} de ${resultado.total} (${Math.round((resultado.acertos / resultado.total) * 100)}%)</h3>
        </div>
      ` : ''}

      ${simulado.questoes.map((q, i) => `
        <div class="card">
          <h3>${i + 1}. ${q.enunciado}</h3>
          ${q.alternativas.map((alt, j) => {
            let cls = 'quiz-option'
            let iconHtml = ''
            if (respostas[i] === j) cls += ' selected'
            if (enviado) {
              if (j === q.resposta_correta) { cls += ' correct'; iconHtml = `<span class="quiz-icon">${icon('checkCircle', 18)}</span>` }
              else if (respostas[i] === j) { cls += ' wrong'; iconHtml = `<span class="quiz-icon">${icon('xCircle', 18)}</span>` }
            }
            return `<button type="button" class="${cls}" data-qi="${i}" data-alt="${j}" ${enviado ? 'disabled' : ''}><span>${alt}</span>${iconHtml}</button>`
          }).join('')}
          ${enviado && q.explicacao ? `<p class="event-sub" style="margin-top:8px">💡 ${q.explicacao}</p>` : ''}
        </div>
      `).join('')}

      ${!enviado ? `<button class="btn-accent" id="enviar" style="width:100%">Corrigir simulado</button>` : `<button class="btn-ghost" id="refazer" style="width:100%">Fazer de novo</button>`}

      ${historico.length ? `
        <div class="card" style="margin-top:16px">
          <h3>Histórico de tentativas</h3>
          ${historico.map((h) => `
            <div class="list-row">
              <span class="event-sub">${new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} às ${new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <span class="badge ${h.acertos / h.total >= 0.7 ? '' : h.acertos / h.total >= 0.5 ? 'badge-warn' : 'badge-danger'}">${h.acertos}/${h.total} (${Math.round((h.acertos / h.total) * 100)}%)</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `)

    if (!enviado) {
      app.querySelectorAll('[data-qi]').forEach((b) => b.onclick = () => {
        respostas[b.dataset.qi] = Number(b.dataset.alt)
        draw()
      })
      document.getElementById('enviar').onclick = async () => {
        if (respostas.includes(null)) return toast('Responda todas as questões antes de corrigir', true)
        try {
          resultado = await api(`/api/simulados/${id}/tentativa`, { method: 'POST', body: { respostas } })
          historico = [resultado, ...historico]
          enviado = true
          draw()
        } catch (err) { toast(err.message, true) }
      }
    } else {
      document.getElementById('refazer').onclick = () => renderSimuladoDetalhe(id)
    }
  }
  draw()
}

// ===== Tutor (tirar dúvidas, baseado no material) =====
async function renderTutor(path) {
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 2) return renderTutorChat(parts[1])

  shell('/tutor', `<div class="empty-state">Carregando...</div>`)
  let conversas, disciplinas, materiais
  try {
    ;[conversas, disciplinas, materiais] = await Promise.all([api('/api/tutor/conversas'), api('/api/disciplinas'), api('/api/materiais')])
  } catch (err) {
    return shell('/tutor', `<div class="empty-state">${err.message}</div>`)
  }

  shell('/tutor', `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><h1 class="page-title">Tutor</h1><p class="page-sub">Tire dúvidas sobre a matéria — explicação baseada no que você já cadastrou</p></div>
      <button class="btn-accent" id="nova-conversa">+ Nova conversa</button>
    </div>

    ${conversas.length === 0 ? '<div class="empty-state">Nenhuma conversa ainda. Comece uma pra tirar sua primeira dúvida.</div>' : `
      <div class="chat-list">
        ${conversas.map((c) => `
          <div class="chat-item">
            <div>
              <div class="chat-item-title">${c.titulo}</div>
              <div class="event-sub">${c.disciplinas?.nome || 'Sem disciplina'}${c.materiais?.nome ? ' · ' + c.materiais.nome : ''} ${c.estrito ? '<span class="badge badge-warn">📘 Fiel ao material</span>' : ''}</div>
            </div>
            <div class="row-actions">
              <button class="btn-accent btn-sm" data-open="${c.id}">Continuar</button>
              <button class="btn-danger btn-sm" data-del-conversa="${c.id}">Excluir</button>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `)

  document.getElementById('nova-conversa').onclick = () => novaConversaModal(disciplinas, materiais)
  app.querySelectorAll('[data-open]').forEach((b) => b.onclick = () => navigate(`/tutor/${b.dataset.open}`))
  app.querySelectorAll('[data-del-conversa]').forEach((b) => b.onclick = async () => {
    if (!confirm('Excluir esta conversa?')) return
    try { await api(`/api/tutor/conversas/${b.dataset.delConversa}`, { method: 'DELETE' }); renderTutor('/tutor') } catch (err) { toast(err.message, true) }
  })
}

function novaConversaModal(disciplinas, materiais) {
  let disciplinaId = ''
  const backdrop = openModal('')

  function draw() {
    const materiaisFiltrados = disciplinaId ? materiais.filter((m) => m.disciplina_id === disciplinaId) : materiais
    backdrop.querySelector('.modal').innerHTML = `
      <h2>Nova conversa com o Tutor</h2>
      <form id="conversa-form">
        <div class="field"><label>Título (opcional)</label><input id="c-titulo" placeholder="ex: Dúvidas sobre PIS/COFINS" /></div>
        <div class="field">
          <label>Disciplina</label>
          <select id="c-disciplina">
            <option value="">—</option>
            ${disciplinas.map((d) => `<option value="${d.id}" ${d.id === disciplinaId ? 'selected' : ''}>${d.nome}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Material de referência (opcional)</label>
          <select id="c-material">
            <option value="">Nenhum — só conversa livre</option>
            ${materiaisFiltrados.map((m) => `<option value="${m.id}">${m.nome}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Fonte das respostas</label>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
            <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;font-weight:400">
              <input type="radio" name="modo" id="c-modo-estrito" value="estrito" checked style="width:auto;margin-top:3px" />
              <span><strong>Seguir só o material enviado</strong><br/><span class="event-sub">Recomendado pra matérias que mudam (direito, legislação, normas).</span></span>
            </label>
            <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;font-weight:400">
              <input type="radio" name="modo" id="c-modo-flexivel" value="flexivel" style="width:auto;margin-top:3px" />
              <span><strong>Pode complementar com conhecimento geral</strong></span>
            </label>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-ghost" id="cancel">Cancelar</button>
          <button type="submit" class="btn-accent">Começar conversa</button>
        </div>
      </form>
    `
    backdrop.querySelector('#cancel').onclick = () => backdrop.remove()
    backdrop.querySelector('#c-disciplina').onchange = (e) => { disciplinaId = e.target.value; draw() }
    backdrop.querySelector('#conversa-form').onsubmit = async (e) => {
      e.preventDefault()
      try {
        const conversa = await api('/api/tutor/conversas', {
          method: 'POST',
          body: {
            titulo: document.getElementById('c-titulo').value.trim(),
            disciplina_id: document.getElementById('c-disciplina').value || null,
            material_id: document.getElementById('c-material').value || null,
            estrito: document.getElementById('c-modo-estrito').checked,
          },
        })
        backdrop.remove()
        navigate(`/tutor/${conversa.id}`)
      } catch (err) { toast(err.message, true) }
    }
  }
  draw()
}

async function renderTutorChat(id) {
  shell('/tutor', `<div class="empty-state">Carregando...</div>`)
  let conversas, mensagens
  try {
    ;[conversas, mensagens] = await Promise.all([api('/api/tutor/conversas'), api(`/api/tutor/conversas/${id}/mensagens`)])
  } catch (err) {
    return shell('/tutor', `<div class="empty-state">${err.message}</div>`)
  }
  const conversa = conversas.find((c) => c.id === id)
  if (!conversa) return shell('/tutor', `<div class="empty-state">Conversa não encontrada.</div>`)

  let enviando = false

  function draw() {
    shell('/tutor', `
      <a href="#/tutor" style="color:var(--ink-soft);font-size:13px">← Voltar às conversas</a>
      <h1 class="page-title" style="margin-top:12px">${conversa.titulo}</h1>
      <p class="page-sub">${conversa.disciplinas?.nome || 'Sem disciplina'}${conversa.materiais?.nome ? ' · ' + conversa.materiais.nome : ''} ${conversa.estrito ? '<span class="badge badge-warn">📘 Fiel ao material</span>' : ''}</p>

      <div class="chat-window">
        <div class="chat-messages" id="chat-messages">
          ${mensagens.length === 0 ? '<div class="empty-state">Manda sua primeira dúvida aí embaixo.</div>' : mensagens.map((m) => `
            <div class="chat-bubble ${m.role}">${m.conteudo}</div>
          `).join('')}
          ${enviando ? `<div class="chat-typing">Tutor está digitando...</div>` : ''}
        </div>
        <form class="chat-input-row" id="chat-form">
          <textarea id="chat-input" rows="1" placeholder="Digite sua dúvida..." ${enviando ? 'disabled' : ''}></textarea>
          <button type="submit" class="btn-accent" ${enviando ? 'disabled' : ''}>${icon('send', 16)}</button>
        </form>
      </div>
    `)
    const msgsEl = document.getElementById('chat-messages')
    msgsEl.scrollTop = msgsEl.scrollHeight

    document.getElementById('chat-form').onsubmit = async (e) => {
      e.preventDefault()
      if (enviando) return
      const input = document.getElementById('chat-input')
      const texto = input.value.trim()
      if (!texto) return
      mensagens.push({ role: 'user', conteudo: texto })
      enviando = true
      draw()
      try {
        const { assistantMsg } = await api(`/api/tutor/conversas/${id}/mensagens`, { method: 'POST', body: { texto } })
        mensagens.push(assistantMsg)
      } catch (err) {
        toast(err.message, true)
        mensagens.pop()
      } finally {
        enviando = false
        draw()
      }
    }
    document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        document.getElementById('chat-form').requestSubmit()
      }
    })
  }
  draw()
}

// ===== Boot =====
supabase.auth.onAuthStateChange(async (_event, session) => {
  state.session = session
  if (session) {
    try {
      state.profile = await api('/api/profile')
    } catch {
      state.profile = null
    }
  } else {
    state.profile = null
  }
  router()
})

supabase.auth.getSession().then(({ data }) => {
  state.session = data.session
  router()
})

// ===== PWA: registro do service worker + toast de atualização =====
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller
  navigator.serviceWorker.register('/sw.js').catch(() => {})
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return
    const t = document.createElement('div')
    t.className = 'toast'
    t.innerHTML = 'Nova versão disponível <button class="btn-sm btn-ghost" style="margin-left:10px;color:#fff;border-color:rgba(255,255,255,0.4)" id="pwa-reload">Atualizar</button>'
    document.body.appendChild(t)
    t.querySelector('#pwa-reload').onclick = () => location.reload()
    setTimeout(() => t.remove(), 15000)
  })
}
