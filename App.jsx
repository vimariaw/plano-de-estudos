import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, X, Check, BookOpen, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

/* ---------- date helpers (local, no deps) ---------- */

function pad(n) {
  return String(n).padStart(2, "0");
}
function toKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d, n) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}
function startOfWeek(d) {
  // week starts Monday
  const nd = new Date(d);
  const dow = nd.getDay(); // 0 sun .. 6 sat
  const diff = dow === 0 ? -6 : 1 - dow;
  nd.setDate(nd.getDate() + diff);
  nd.setHours(0, 0, 0, 0);
  return nd;
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
// month grid starts on Monday, so its header must follow Mon → Sun order
const WEEKDAY_HEADER_MON_FIRST = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/* ---------- areas / colors ---------- */

const AREA_COLORS = {
  estudos: { bg: "#EAE3F8", text: "#5B3FA0", dot: "#8B6FD9" },
  ingles: { bg: "#DDEEF7", text: "#1F6E96", dot: "#4FA8D6" },
  matematica: { bg: "#FBE6DD", text: "#B14B26", dot: "#E8895A" },
  cursos: { bg: "#E2F2E0", text: "#3D7A3A", dot: "#7CB872" },
};
const EXTRA_COLORS = [
  { bg: "#FBE8EE", text: "#A8456B", dot: "#E08AA8" },
  { bg: "#FFF3D6", text: "#9C7615", dot: "#E0B23D" },
  { bg: "#E0EEF0", text: "#2D6E73", dot: "#5FAEB5" },
];
function colorForArea(id, index) {
  if (AREA_COLORS[id]) return AREA_COLORS[id];
  return EXTRA_COLORS[index % EXTRA_COLORS.length];
}

const DEFAULT_AREAS = [
  { id: "estudos", name: "Estudos" },
  { id: "ingles", name: "Inglês" },
  { id: "matematica", name: "Matemática" },
  { id: "cursos", name: "Cursos" },
];

/* Tarefas distribuídas em pares teoria → prática, seg a sex.
   Cada tema de Estudos e Matemática tem um dia de conteúdo e um dia de prática.
   Inglês e Cursos mantêm um dia cada. */
function buildDefaultTasks() {
  const today = new Date();
  const nextMon = addDays(startOfWeek(today), 7);
  let dayIndex = 0;
  const slots = [];

  // gera datas sequenciais seg-sex (pula sab=6 e dom=0)
  function nextSlot() {
    while (true) {
      const d = addDays(nextMon, dayIndex++);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) return toKey(d);
    }
  }

  let n = 0;
  const id = () => `t${++n}`;
  const task = (areaId, title) => ({ id: id(), date: nextSlot(), areaId, title, done: false });

  return [
    /* ── Semana 1 ── */
    task("estudos",    "Idade Antiga"),
    task("estudos",    "Resumo e mapa mental: Idade Antiga"),
    task("matematica", "As quatro operações matemáticas"),
    task("matematica", "Exercícios: quatro operações"),
    task("ingles",     "Vocabulário básico — apresentações"),

    /* ── Semana 2 ── */
    task("estudos",    "Idade Média"),
    task("estudos",    "Resumo e mapa mental: Idade Média"),
    task("matematica", "Frações"),
    task("matematica", "Exercícios: frações"),
    task("ingles",     "Gramática: verbo to be"),

    /* ── Semana 3 ── */
    task("estudos",    "Idade Moderna"),
    task("estudos",    "Resumo e mapa mental: Idade Moderna"),
    task("matematica", "Números decimais"),
    task("matematica", "Exercícios: números decimais"),
    task("cursos",     "Pesquisar cursos técnicos de administração"),

    /* ── Semana 4 ── */
    task("estudos",    "Continentes e oceanos do mundo"),
    task("estudos",    "Quiz: localizar países e capitais no mapa"),
    task("matematica", "Porcentagem"),
    task("matematica", "Exercícios: porcentagem aplicada"),
    task("ingles",     "Pronomes pessoais e possessivos"),

    /* ── Semana 5 ── */
    task("estudos",    "Revolução Industrial"),
    task("estudos",    "Resumo: causas e consequências da Revolução Industrial"),
    task("matematica", "Regra de três"),
    task("matematica", "Exercícios: regra de três"),
    task("ingles",     "Vocabulário: rotina diária"),

    /* ── Semana 6 ── */
    task("estudos",    "Revolução Francesa"),
    task("estudos",    "Linha do tempo: Revolução Francesa"),
    task("matematica", "MMC e MDC"),
    task("matematica", "Exercícios: MMC e MDC"),
    task("ingles",     "Preposições básicas (in, on, at)"),

    /* ── Semana 7 ── */
    task("estudos",    "Revolução Americana"),
    task("estudos",    "Comparar: Revolução Americana x Francesa"),
    task("matematica", "Potenciação"),
    task("matematica", "Exercícios: potenciação"),
    task("ingles",     "Present simple"),

    /* ── Semana 8 ── */
    task("estudos",    "Revolução Russa"),
    task("estudos",    "Resumo: surgimento da URSS"),
    task("matematica", "Radiciação"),
    task("matematica", "Exercícios: radiciação"),
    task("ingles",     "Present continuous"),

    /* ── Semana 9 ── */
    task("estudos",    "Imperialismo europeu no século XIX"),
    task("estudos",    "Mapa: países colonizadores e colonizados"),
    task("matematica", "Razão e proporção"),
    task("matematica", "Exercícios: razão e proporção"),
    task("ingles",     "Past simple"),

    /* ── Semana 10 ── */
    task("estudos",    "Primeira Guerra Mundial"),
    task("estudos",    "Linha do tempo: 1ª Guerra Mundial"),
    task("matematica", "Juros simples"),
    task("matematica", "Exercícios: juros simples"),
    task("ingles",     "Vocabulário: trabalho e escritório"),

    /* ── Semana 11 ── */
    task("estudos",    "Segunda Guerra Mundial"),
    task("estudos",    "Linha do tempo: 2ª Guerra Mundial"),
    task("matematica", "Equação do 1º grau"),
    task("matematica", "Exercícios: equação do 1º grau"),
    task("ingles",     "Como escrever um e-mail em inglês"),

    /* ── Semana 12 ── */
    task("estudos",    "Era Vargas no Brasil"),
    task("estudos",    "Resumo: o legado de Vargas"),
    task("matematica", "Sistema de equações do 1º grau"),
    task("matematica", "Exercícios: sistema de equações"),
    task("cursos",     "O que faz um assistente administrativo"),

    /* ── Semana 13 ── */
    task("estudos",    "Independência do Brasil"),
    task("estudos",    "Resumo: do Brasil Colônia à Independência"),
    task("matematica", "Equação do 2º grau (Bhaskara)"),
    task("matematica", "Exercícios: Bhaskara"),
    task("ingles",     "Phrasal verbs mais comuns"),

    /* ── Semana 14 ── */
    task("estudos",    "Proclamação da República no Brasil"),
    task("estudos",    "Comparar: Império x República no Brasil"),
    task("matematica", "Função afim (1º grau)"),
    task("matematica", "Exercícios: função afim e gráfico"),
    task("cursos",     "Noções de rotina administrativa"),

    /* ── Semana 15 ── */
    task("estudos",    "Ditadura Militar no Brasil"),
    task("estudos",    "Resumo: abertura política e redemocratização"),
    task("matematica", "Função quadrática (2º grau)"),
    task("matematica", "Exercícios: função quadrática e parábola"),
    task("cursos",     "Noções de arquivo e organização de documentos"),

    /* ── Semana 16 ── */
    task("estudos",    "Guerra Fria"),
    task("estudos",    "Comparar: capitalismo x socialismo na Guerra Fria"),
    task("matematica", "Áreas das figuras planas"),
    task("matematica", "Exercícios: áreas"),
    task("cursos",     "Atendimento ao cliente: conceitos básicos"),

    /* ── Semana 17 ── */
    task("estudos",    "Descolonização da África e Ásia"),
    task("estudos",    "Mapa: países que se tornaram independentes após 1945"),
    task("matematica", "Perímetros das figuras planas"),
    task("matematica", "Exercícios: perímetros"),
    task("cursos",     "Como fazer um currículo"),

    /* ── Semana 18 ── */
    task("estudos",    "O que é geopolítica"),
    task("estudos",    "Analisar um mapa geopolítico atual"),
    task("matematica", "Teorema de Pitágoras"),
    task("matematica", "Exercícios: Pitágoras"),
    task("cursos",     "Como se comportar numa entrevista de emprego"),

    /* ── Semana 19 ── */
    task("estudos",    "América Latina: panorama geral"),
    task("estudos",    "Comparar: principais países da América Latina"),
    task("matematica", "Volumes de sólidos geométricos"),
    task("matematica", "Exercícios: volumes"),
    task("cursos",     "Word: criação e formatação de documentos"),

    /* ── Semana 20 ── */
    task("estudos",    "Globalização: o que é e seus efeitos"),
    task("estudos",    "Debate: prós e contras da globalização"),
    task("matematica", "Estatística: média e mediana"),
    task("matematica", "Exercícios: média e mediana"),
    task("cursos",     "Excel básico: navegação e formatação"),

    /* ── Semana 21 ── */
    task("estudos",    "Blocos econômicos: União Europeia"),
    task("estudos",    "Blocos econômicos: Mercosul e BRICS"),
    task("matematica", "Estatística: moda e desvio padrão"),
    task("matematica", "Exercícios: estatística completa"),
    task("cursos",     "Excel: fórmulas essenciais (SOMA, MÉDIA, SE)"),

    /* ── Semana 22 ── */
    task("estudos",    "ONU: o que é e como funciona"),
    task("estudos",    "OTAN: o que é e por que importa"),
    task("matematica", "Juros compostos"),
    task("matematica", "Exercícios: juros compostos"),
    task("cursos",     "Introdução ao Google Workspace"),

    /* ── Semana 23 ── */
    task("estudos",    "Conflito Rússia-Ucrânia"),
    task("estudos",    "Análise: contexto histórico do conflito"),
    task("matematica", "Trigonometria: seno e cosseno"),
    task("matematica", "Exercícios: seno e cosseno"),
    task("ingles",     "Números, datas e horas em inglês"),

    /* ── Semana 24 ── */
    task("estudos",    "Conflito Israel-Palestina"),
    task("estudos",    "Análise: contexto histórico do conflito"),
    task("matematica", "Trigonometria: tangente"),
    task("matematica", "Exercícios: trigonometria completa"),
    task("estudos",    "Oriente Médio: por que é tão disputado"),

    /* ── Semana 25 ── */
    task("estudos",    "Ascensão da China como potência mundial"),
    task("estudos",    "Comparar: EUA x China hoje"),
    task("matematica", "Progressão Aritmética (PA)"),
    task("matematica", "Exercícios: PA"),
    task("estudos",    "Refugiados e migrações no mundo atual"),

    /* ── Semana 26 ── */
    task("estudos",    "Como funciona o governo no Brasil"),
    task("estudos",    "Sistema eleitoral brasileiro"),
    task("matematica", "Progressão Geométrica (PG)"),
    task("matematica", "Exercícios: PG"),
    task("estudos",    "Democracia: o que é e como funciona"),

    /* ── Semana 27 ── */
    task("estudos",    "Monarquia e ditadura: diferenças"),
    task("estudos",    "Movimentos sociais que mudaram o mundo"),
    task("matematica", "Funções exponenciais"),
    task("matematica", "Exercícios: funções exponenciais"),
    task("estudos",    "Aquecimento global e acordos climáticos"),

    /* ── Semana 28 ── */
    task("estudos",    "Mudanças climáticas"),
    task("estudos",    "Redes sociais e desinformação"),
    task("matematica", "Logaritmos"),
    task("matematica", "Exercícios: logaritmos"),
    task("matematica", "Geometria analítica: plano cartesiano"),

    /* ── Semana 29 ── */
    task("matematica", "Geometria analítica: equação da reta"),
    task("matematica", "Exercícios: geometria analítica"),
    task("matematica", "Análise combinatória: arranjo"),
    task("matematica", "Análise combinatória: combinação"),
    task("matematica", "Exercícios: combinatória"),

    /* ── Semana 30 ── */
    task("matematica", "Probabilidade"),
    task("matematica", "Exercícios: probabilidade"),
    task("matematica", "Matrizes"),
    task("matematica", "Exercícios: matrizes"),
    task("matematica", "Determinantes"),
  ];
}

const STORAGE_KEY = "tasks-and-areas-v2";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* Extracts a short keyword/label from a task title for compact display
   (e.g. month calendar cells). Skips common short connector words and
   picks the first meaningful word, stripping punctuation. */
const SKIP_WORDS = new Set([
  "a", "o", "as", "os", "de", "do", "da", "dos", "das", "e", "em", "no", "na",
  "nos", "nas", "que", "para", "com", "ao", "aos", "à", "às", "um", "uma",
]);
function keyword(title) {
  if (!title) return "";
  const words = title
    .replace(/[().,:;]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const main = words.find((w) => !SKIP_WORDS.has(w.toLowerCase())) || words[0] || "";
  return main.length > 12 ? main.slice(0, 11) + "…" : main;
}

/* ---------- main component ---------- */

export default function StudyPlanner() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [areas, setAreas] = useState(DEFAULT_AREAS);
  const [tasks, setTasks] = useState(buildDefaultTasks);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("hoje"); // hoje | semana | mes

  const [selectedDate, setSelectedDate] = useState(toKey(today)); // used by "hoje" + month-day-detail
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(today));
  const [monthAnchor, setMonthAnchor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [monthDetailDate, setMonthDetailDate] = useState(null); // key or null

  const [filterArea, setFilterArea] = useState("all");
  const [addingFor, setAddingFor] = useState(null); // date key while add form open
  const [editingId, setEditingId] = useState(null); // task id being edited
  const [editTitle, setEditTitle] = useState("");
  const [editArea, setEditArea] = useState("estudos");
  const [newTitle, setNewTitle] = useState("");
  const [newArea, setNewArea] = useState("estudos");
  const [showAreaManager, setShowAreaManager] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          if (parsed.areas && parsed.tasks) {
            setAreas(parsed.areas);
            setTasks(parsed.tasks);
          }
        }
      } catch (e) {
        /* no saved data yet */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify({ areas, tasks }));
        setSaveState("saved");
      } catch (e) {
        setSaveState("idle");
      }
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [areas, tasks, loaded]);

  function toggleTask(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }
  function updateTask(id, changes) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  }
  function addTask(dateKey) {
    if (!newTitle.trim()) return;
    setTasks((prev) => [...prev, { id: uid(), date: dateKey, areaId: newArea, title: newTitle.trim(), done: false }]);
    setNewTitle("");
    setAddingFor(null);
  }
  function addArea() {
    if (!newAreaName.trim()) return;
    const id = uid();
    setAreas((prev) => [...prev, { id, name: newAreaName.trim() }]);
    setNewAreaName("");
  }
  function deleteArea(id) {
    setAreas((prev) => prev.filter((a) => a.id !== id));
    setTasks((prev) => prev.filter((t) => t.areaId !== id));
    if (filterArea === id) setFilterArea("all");
  }

  const tasksByDate = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    return map;
  }, [tasks]);

  const totalAll = tasks.length;
  const doneAll = tasks.filter((t) => t.done).length;

  function filterByArea(list) {
    return filterArea === "all" ? list : list.filter((t) => t.areaId === filterArea);
  }

  const areaName = (id) => areas.find((a) => a.id === id)?.name || "—";
  const areaColor = (id) => {
    const idx = areas.findIndex((a) => a.id === id);
    return colorForArea(id, idx === -1 ? 0 : idx);
  };

  /* ---------- render helpers shared by tabs ---------- */

  function startEditing(t) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditArea(t.areaId);
  }
  function saveEditing() {
    if (!editTitle.trim()) return;
    updateTask(editingId, { title: editTitle.trim(), areaId: editArea });
    setEditingId(null);
  }

  function TaskRow({ t }) {
    const c = areaColor(t.areaId);
    const isEditing = editingId === t.id;
    const [confirmDelete, setConfirmDelete] = useState(false);

    if (isEditing) {
      return (
        <li style={styles.taskItemEditing}>
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={styles.editInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEditing();
              if (e.key === "Escape") setEditingId(null);
            }}
          />
          <div style={styles.addRow}>
            <select value={editArea} onChange={(e) => setEditArea(e.target.value)} style={styles.addSelect}>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <div style={styles.addActions}>
              <button onClick={() => setEditingId(null)} style={styles.btnGhost}>
                Cancelar
              </button>
              <button onClick={saveEditing} style={styles.btnPrimary}>
                Salvar
              </button>
            </div>
          </div>
        </li>
      );
    }

    if (confirmDelete) {
      return (
        <li style={styles.taskItemConfirm}>
          <span style={styles.confirmText}>Remover "{t.title}"?</span>
          <div style={styles.confirmActions}>
            <button onClick={() => setConfirmDelete(false)} style={styles.btnGhost}>
              Cancelar
            </button>
            <button onClick={() => deleteTask(t.id)} style={styles.btnDanger}>
              Remover
            </button>
          </div>
        </li>
      );
    }

    return (
      <li style={styles.taskItem}>
        <button
          onClick={() => toggleTask(t.id)}
          style={{
            ...styles.checkbox,
            background: t.done ? "#2B2622" : "#fff",
            borderColor: t.done ? "#2B2622" : "#D8D0C2",
          }}
          aria-label={t.done ? "Marcar como não feito" : "Marcar como feito"}
        >
          {t.done && <Check size={12} strokeWidth={3} color="#fff" />}
        </button>
        <button onClick={() => startEditing(t)} style={styles.taskBody} aria-label="Editar tema">
          <span style={{ ...styles.taskTitle, ...(t.done ? styles.taskTitleDone : {}) }}>{t.title}</span>
          <span style={{ ...styles.taskBadge, background: c.bg, color: c.text }}>{areaName(t.areaId)}</span>
        </button>
        <button onClick={() => setConfirmDelete(true)} style={styles.taskDelete} aria-label="Excluir">
          <X size={14} />
        </button>
      </li>
    );
  }

  function AddForm({ dateKey, compact }) {
    const isOpen = addingFor === dateKey;
    if (!isOpen) {
      return (
        <button onClick={() => setAddingFor(dateKey)} style={compact ? styles.addTriggerCompact : styles.addTrigger}>
          <Plus size={14} strokeWidth={2.3} />
          {compact ? "Adicionar" : "Adicionar tema"}
        </button>
      );
    }
    return (
      <div style={styles.addForm}>
        <input
          autoFocus
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Ex: Revisar verbos irregulares"
          style={styles.addInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTask(dateKey);
            if (e.key === "Escape") setAddingFor(null);
          }}
        />
        <div style={styles.addRow}>
          <select value={newArea} onChange={(e) => setNewArea(e.target.value)} style={styles.addSelect}>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <div style={styles.addActions}>
            <button onClick={() => setAddingFor(null)} style={styles.btnGhost}>
              Cancelar
            </button>
            <button onClick={() => addTask(dateKey)} style={styles.btnPrimary}>
              Adicionar
            </button>
          </div>
        </div>
      </div>
    );
  }

  function AreaChips() {
    return (
      <div style={styles.chipRow} className="chip-scroll">
        <button
          onClick={() => setFilterArea("all")}
          style={{ ...styles.chip, background: filterArea === "all" ? "#2B2622" : "#F1ECE4", color: filterArea === "all" ? "#fff" : "#6B6258" }}
        >
          Todas
        </button>
        {areas.map((a, i) => {
          const c = colorForArea(a.id, i);
          const active = filterArea === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setFilterArea(a.id)}
              style={{ ...styles.chip, background: active ? c.dot : c.bg, color: active ? "#fff" : c.text }}
            >
              {a.name}
            </button>
          );
        })}
        <button onClick={() => setShowAreaManager(true)} style={styles.chipManage} aria-label="Gerenciar áreas">
          <Plus size={13} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  /* ---------- HOJE tab ---------- */

  function HojeTab() {
    const dateObj = fromKey(selectedDate);
    const isToday = isSameDay(dateObj, today);
    const list = filterByArea(tasksByDate[selectedDate] || []);
    const dayTotal = (tasksByDate[selectedDate] || []).length;
    const dayDone = (tasksByDate[selectedDate] || []).filter((t) => t.done).length;
    const pct = dayTotal ? Math.round((dayDone / dayTotal) * 100) : 0;

    return (
      <>
        <div style={styles.hojeDateRow}>
          <button onClick={() => setSelectedDate(toKey(addDays(dateObj, -1)))} style={styles.navArrow}>
            <ChevronLeft size={16} />
          </button>
          <div style={styles.hojeDateCenter}>
            <span style={styles.hojeDateLabel}>
              {WEEKDAY_FULL[dateObj.getDay()]}
              {isToday && <span style={styles.todayTag}>hoje</span>}
            </span>
            <span style={styles.hojeDateSub}>
              {dateObj.getDate()} de {MONTH_NAMES[dateObj.getMonth()]}
            </span>
          </div>
          <button onClick={() => setSelectedDate(toKey(addDays(dateObj, 1)))} style={styles.navArrow}>
            <ChevronRight size={16} />
          </button>
        </div>

        {!isToday && (
          <button onClick={() => setSelectedDate(toKey(today))} style={styles.backToToday}>
            voltar para hoje
          </button>
        )}

        <div style={styles.progressWrap}>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${pct}%` }} />
          </div>
          <span style={styles.progressLabel}>
            {dayDone}/{dayTotal} concluídas {dayTotal ? `· ${pct}%` : ""}
          </span>
        </div>

        <AreaChips />

        <div style={{ marginTop: 16 }}>
          {list.length === 0 && (
            <div style={styles.empty}>
              <p style={styles.emptyText}>Nada por aqui ainda.</p>
              <p style={styles.emptySub}>Adicione um tema de estudo pra esse dia.</p>
            </div>
          )}
          <ul style={styles.taskList}>
            {list.map((t) => (
              <TaskRow key={t.id} t={t} />
            ))}
          </ul>
          <div style={{ marginTop: 12 }}>
            <AddForm dateKey={selectedDate} />
          </div>
        </div>
      </>
    );
  }

  /* ---------- SEMANA tab ---------- */

  function SemanaTab() {
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i));
    const weekEnd = days[6];
    const weekTotal = days.reduce((sum, d) => sum + (tasksByDate[toKey(d)] || []).length, 0);
    const weekDone = days.reduce((sum, d) => sum + (tasksByDate[toKey(d)] || []).filter((t) => t.done).length, 0);

    return (
      <>
        <div style={styles.hojeDateRow}>
          <button onClick={() => setWeekAnchor(addDays(weekAnchor, -7))} style={styles.navArrow}>
            <ChevronLeft size={16} />
          </button>
          <div style={styles.hojeDateCenter}>
            <span style={styles.hojeDateLabel}>
              {days[0].getDate()} {MONTH_NAMES[days[0].getMonth()].slice(0, 3)} – {weekEnd.getDate()} {MONTH_NAMES[weekEnd.getMonth()].slice(0, 3)}
            </span>
            <span style={styles.hojeDateSub}>
              {weekDone}/{weekTotal} concluídas na semana
            </span>
          </div>
          <button onClick={() => setWeekAnchor(addDays(weekAnchor, 7))} style={styles.navArrow}>
            <ChevronRight size={16} />
          </button>
        </div>

        {toKey(weekAnchor) !== toKey(startOfWeek(today)) && (
          <button onClick={() => setWeekAnchor(startOfWeek(today))} style={styles.backToToday}>
            voltar para semana atual
          </button>
        )}

        <AreaChips />

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          {days.map((d) => {
            const key = toKey(d);
            const list = filterByArea(tasksByDate[key] || []);
            const isToday = isSameDay(d, today);
            return (
              <div key={key} style={styles.weekDayBlock}>
                <div style={styles.weekDayHeader}>
                  <span style={{ ...styles.weekDayLabel, ...(isToday ? styles.weekDayLabelToday : {}) }}>
                    {WEEKDAY_SHORT[d.getDay()]} {d.getDate()}
                  </span>
                  {isToday && <span style={styles.todayDot} />}
                </div>
                {list.length === 0 ? (
                  <p style={styles.weekEmptyText}>Sem temas ainda.</p>
                ) : (
                  <ul style={styles.taskList}>
                    {list.map((t) => (
                      <TaskRow key={t.id} t={t} />
                    ))}
                  </ul>
                )}
                <div style={{ marginTop: 8 }}>
                  <AddForm dateKey={key} compact />
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  /* ---------- MES tab ---------- */

  function MesTab() {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startGrid = startOfWeek(firstOfMonth);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(startGrid, i));
    // trim trailing empty row if entire last week is outside month and prior weeks already cover month
    const lastUsedIndex = (() => {
      for (let i = cells.length - 1; i >= 0; i--) {
        if (cells[i].getMonth() === month) return i;
      }
      return 41;
    })();
    const rows = Math.ceil((lastUsedIndex + 1) / 7);
    const visibleCells = cells.slice(0, rows * 7);

    const detailKey = monthDetailDate;
    const detailList = detailKey ? filterByArea(tasksByDate[detailKey] || []) : [];

    return (
      <>
        <div style={styles.hojeDateRow}>
          <button
            onClick={() => {
              setMonthAnchor(new Date(year, month - 1, 1));
              setMonthDetailDate(null);
            }}
            style={styles.navArrow}
          >
            <ChevronLeft size={16} />
          </button>
          <div style={styles.hojeDateCenter}>
            <span style={styles.hojeDateLabel}>
              {MONTH_NAMES[month]} {year}
            </span>
          </div>
          <button
            onClick={() => {
              setMonthAnchor(new Date(year, month + 1, 1));
              setMonthDetailDate(null);
            }}
            style={styles.navArrow}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {!(year === today.getFullYear() && month === today.getMonth()) && (
          <button
            onClick={() => {
              setMonthAnchor(new Date(today.getFullYear(), today.getMonth(), 1));
              setMonthDetailDate(null);
            }}
            style={styles.backToToday}
          >
            voltar para mês atual
          </button>
        )}

        <AreaChips />

        <div style={styles.monthGridHeader}>
          {WEEKDAY_HEADER_MON_FIRST.map((w) => (
            <span key={w} style={styles.monthGridHeaderCell}>
              {w.slice(0, 3)}
            </span>
          ))}
        </div>
        <div style={{ ...styles.monthGrid, gridTemplateRows: `repeat(${rows}, auto)` }}>
          {visibleCells.map((d) => {
            const key = toKey(d);
            const inMonth = d.getMonth() === month;
            const list = filterByArea(tasksByDate[key] || []);
            const isToday = isSameDay(d, today);
            const isSelected = monthDetailDate === key;
            return (
              <button
                key={key}
                onClick={() => setMonthDetailDate(isSelected ? null : key)}
                style={{
                  ...styles.monthCell,
                  opacity: inMonth ? 1 : 0.35,
                  ...(isSelected ? styles.monthCellSelected : {}),
                }}
              >
                <span style={{ ...styles.monthCellNum, ...(isToday ? styles.monthCellNumToday : {}) }}>{d.getDate()}</span>
                <div style={styles.monthCellTasks}>
                  {list.slice(0, 3).map((t) => {
                    const c = areaColor(t.areaId);
                    return (
                      <span
                        key={t.id}
                        style={{
                          ...styles.monthCellTag,
                          background: c.bg,
                          color: c.text,
                          opacity: t.done ? 0.45 : 1,
                          textDecoration: t.done ? "line-through" : "none",
                        }}
                      >
                        {keyword(t.title)}
                      </span>
                    );
                  })}
                  {list.length > 3 && <span style={styles.monthCellMore}>+{list.length - 3}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {detailKey && (
          <div style={styles.monthDetail}>
            <div style={styles.weekDayHeader}>
              <span style={styles.weekDayLabel}>
                {WEEKDAY_FULL[fromKey(detailKey).getDay()]}, {fromKey(detailKey).getDate()} de {MONTH_NAMES[fromKey(detailKey).getMonth()]}
              </span>
            </div>
            {detailList.length === 0 ? (
              <p style={styles.weekEmptyText}>Sem temas ainda.</p>
            ) : (
              <ul style={styles.taskList}>
                {detailList.map((t) => (
                  <TaskRow key={t.id} t={t} />
                ))}
              </ul>
            )}
            <div style={{ marginTop: 8 }}>
              <AddForm dateKey={detailKey} compact />
            </div>
          </div>
        )}
      </>
    );
  }

  /* ---------- layout ---------- */

  return (
    <div style={styles.page}>
      <style>{globalCss}</style>

      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.brandRow}>
            <div style={styles.brandMark}>
              <BookOpen size={18} strokeWidth={2.2} color="#fff" />
            </div>
            <div>
              <h1 style={styles.brandTitle}>Plano de Estudos</h1>
              <p style={styles.brandSub}>
                {doneAll}/{totalAll} concluídas no total
              </p>
            </div>
          </div>
          <span style={styles.saveTag}>{saveState === "saving" ? "salvando…" : "salvo"}</span>
        </div>
      </header>

      <nav style={styles.tabNav}>
        {[
          { key: "hoje", label: "Hoje" },
          { key: "semana", label: "Semana" },
          { key: "mes", label: "Mês" },
        ].map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            style={{ ...styles.tabBtn, ...(tab === tb.key ? styles.tabBtnActive : {}) }}
          >
            {tb.label}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {tab === "hoje" && <HojeTab />}
        {tab === "semana" && <SemanaTab />}
        {tab === "mes" && <MesTab />}
      </main>

      {showAreaManager && (
        <div style={styles.modalOverlay} onClick={() => setShowAreaManager(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Áreas</h3>
              <button onClick={() => setShowAreaManager(false)} style={styles.modalClose}>
                <X size={16} />
              </button>
            </div>
            <ul style={styles.areaList}>
              {areas.map((a, i) => {
                const c = colorForArea(a.id, i);
                return (
                  <li key={a.id} style={styles.areaItem}>
                    <span style={{ ...styles.areaDot, background: c.dot }} />
                    <span style={styles.areaName}>{a.name}</span>
                    <button onClick={() => deleteArea(a.id)} style={styles.areaDelete}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div style={styles.addAreaRow}>
              <input
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Nova área (ex: Informática)"
                style={styles.addAreaInput}
                onKeyDown={(e) => e.key === "Enter" && addArea()}
              />
              <button onClick={addArea} style={styles.btnPrimary}>
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const globalCss = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  .chip-scroll::-webkit-scrollbar { display: none; }
  .chip-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  button { font-family: inherit; cursor: pointer; }
  input, select { font-family: inherit; }
  input:focus, select:focus, button:focus-visible {
    outline: 2px solid #B89B6A;
    outline-offset: 1px;
  }
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
`;

const styles = {
  page: {
    minHeight: "100vh",
    background: "#FAF7F1",
    fontFamily: "'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
    color: "#2B2622",
    paddingBottom: 40,
    maxWidth: 480,
    margin: "0 auto",
  },
  header: { padding: "20px 18px 14px", borderBottom: "1px solid #ECE5D8" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  brandRow: { display: "flex", gap: 10, alignItems: "center" },
  brandMark: {
    width: 34, height: 34, borderRadius: 9, background: "#2B2622",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  brandTitle: { margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" },
  brandSub: { margin: 0, fontSize: 11.5, color: "#9A8F7D", fontFamily: "'SF Mono', Menlo, monospace" },
  saveTag: { fontSize: 10, fontFamily: "'SF Mono', Menlo, monospace", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9A8F7D", marginTop: 4 },

  tabNav: { display: "flex", gap: 4, padding: "12px 18px 0" },
  tabBtn: {
    flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid #ECE5D8",
    background: "#fff", fontSize: 13, fontWeight: 700, color: "#9A8F7D",
  },
  tabBtnActive: { background: "#2B2622", borderColor: "#2B2622", color: "#fff" },

  main: { padding: "16px 18px 0" },

  hojeDateRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  hojeDateCenter: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  hojeDateLabel: { fontSize: 15, fontWeight: 700, color: "#2B2622", display: "flex", alignItems: "center", gap: 6 },
  hojeDateSub: { fontSize: 11.5, color: "#9A8F7D", marginTop: 2, fontFamily: "'SF Mono', Menlo, monospace" },
  todayTag: {
    fontSize: 9, fontWeight: 700, background: "#B89B6A", color: "#fff",
    padding: "2px 6px", borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.03em",
  },
  navArrow: {
    width: 30, height: 30, borderRadius: "50%", border: "1px solid #ECE5D8",
    background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B6258",
  },
  backToToday: {
    display: "block", margin: "8px auto 0", border: "none", background: "transparent",
    color: "#B89B6A", fontSize: 11.5, fontWeight: 700, textDecoration: "underline",
  },

  progressWrap: { marginTop: 14 },
  progressTrack: { height: 6, borderRadius: 4, background: "#ECE5D8", overflow: "hidden" },
  progressFill: { height: "100%", background: "#B89B6A", borderRadius: 4, transition: "width 0.3s ease" },
  progressLabel: { display: "block", marginTop: 6, fontSize: 11.5, color: "#9A8F7D", fontFamily: "'SF Mono', Menlo, monospace" },

  chipRow: { display: "flex", gap: 7, padding: "14px 0 0", overflowX: "auto" },
  chip: { flexShrink: 0, padding: "6px 13px", borderRadius: 100, border: "none", fontSize: 12.5, fontWeight: 600, transition: "all 0.15s ease" },
  chipManage: {
    flexShrink: 0, width: 28, height: 28, borderRadius: "50%", border: "1px dashed #C9BFAD",
    background: "transparent", color: "#8A7F6E", display: "flex", alignItems: "center", justifyContent: "center",
  },

  empty: { padding: "24px 0", textAlign: "center" },
  emptyText: { margin: 0, fontSize: 14, fontWeight: 600, color: "#6B6258" },
  emptySub: { margin: "4px 0 0", fontSize: 12.5, color: "#A89C87" },

  taskList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 },
  taskItem: { display: "flex", alignItems: "flex-start", gap: 10, background: "#fff", border: "1px solid #ECE5D8", borderRadius: 12, padding: "11px 12px" },
  taskItemEditing: { display: "flex", flexDirection: "column", gap: 9, background: "#fff", border: "1.5px solid #B89B6A", borderRadius: 12, padding: "11px 12px" },
  taskItemConfirm: { display: "flex", flexDirection: "column", gap: 9, background: "#FFF5F5", border: "1.5px solid #E8A0A0", borderRadius: 12, padding: "11px 12px" },
  confirmText: { fontSize: 13, fontWeight: 600, color: "#7A3030", lineHeight: 1.35 },
  confirmActions: { display: "flex", gap: 6, justifyContent: "flex-end" },
  btnDanger: { border: "none", background: "#C0392B", color: "#fff", fontSize: 12.5, fontWeight: 700, padding: "8px 14px", borderRadius: 8 },
  editInput: { width: "100%", border: "1px solid #ECE5D8", borderRadius: 9, padding: "8px 10px", fontSize: 14, color: "#2B2622", background: "#FAF7F1" },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, border: "1.5px solid #D8D0C2",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.15s ease",
  },
  taskBody: { flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0, background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: "pointer" },
  taskTitle: { fontSize: 14, lineHeight: 1.35, color: "#2B2622" },
  taskTitleDone: { textDecoration: "line-through", color: "#B5AC9C" },
  taskBadge: { alignSelf: "flex-start", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 100, fontFamily: "'SF Mono', Menlo, monospace", letterSpacing: "0.02em" },
  taskDelete: { background: "transparent", border: "none", color: "#C9BFAD", padding: 4, flexShrink: 0 },

  addTrigger: {
    width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px dashed #D8D0C2",
    background: "transparent", color: "#8A7F6E", fontSize: 13.5, fontWeight: 600,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  addTriggerCompact: {
    width: "100%", padding: "8px 10px", borderRadius: 9, border: "1.5px dashed #D8D0C2",
    background: "transparent", color: "#A89C87", fontSize: 12, fontWeight: 600,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
  },
  addForm: { background: "#fff", border: "1px solid #ECE5D8", borderRadius: 12, padding: 12 },
  addInput: { width: "100%", border: "1px solid #ECE5D8", borderRadius: 9, padding: "9px 11px", fontSize: 14, color: "#2B2622", marginBottom: 9 },
  addRow: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  addSelect: { flex: "1 1 120px", border: "1px solid #ECE5D8", borderRadius: 9, padding: "8px 9px", fontSize: 12.5, color: "#4A4338", background: "#FAF7F1" },
  addActions: { display: "flex", gap: 6, marginLeft: "auto" },
  btnGhost: { border: "none", background: "transparent", color: "#9A8F7D", fontSize: 12.5, fontWeight: 600, padding: "8px 10px" },
  btnPrimary: { border: "none", background: "#2B2622", color: "#fff", fontSize: 12.5, fontWeight: 700, padding: "8px 14px", borderRadius: 8 },

  weekDayBlock: { background: "#FFFDFA", border: "1px solid #ECE5D8", borderRadius: 14, padding: 12 },
  weekDayHeader: { display: "flex", alignItems: "center", gap: 6, marginBottom: 9 },
  weekDayLabel: { fontSize: 13, fontWeight: 700, color: "#6B6258", textTransform: "uppercase", letterSpacing: "0.03em" },
  weekDayLabelToday: { color: "#2B2622" },
  todayDot: { width: 6, height: 6, borderRadius: "50%", background: "#B89B6A" },
  weekEmptyText: { margin: "0 0 9px", fontSize: 12.5, color: "#B5AC9C", fontStyle: "italic" },

  monthGridHeader: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginTop: 14, marginBottom: 4 },
  monthGridHeaderCell: { textAlign: "center", fontSize: 10.5, fontWeight: 700, color: "#A89C87", textTransform: "uppercase" },
  monthGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  monthCell: {
    border: "1px solid #ECE5D8", borderRadius: 9, background: "#fff", padding: "5px 3px",
    minHeight: 64, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
  },
  monthCellSelected: { borderColor: "#B89B6A", borderWidth: 1.5, background: "#FFF9EF" },
  monthCellNum: { fontSize: 11, fontWeight: 700, color: "#6B6258" },
  monthCellNumToday: { color: "#fff", background: "#B89B6A", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 },
  monthCellTasks: { marginTop: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: "100%" },
  monthCellTag: {
    fontSize: 7.5, lineHeight: 1.2, fontWeight: 700, padding: "1.5px 5px", borderRadius: 5,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%",
  },
  monthCellMore: { fontSize: 7.5, color: "#A89C87", fontWeight: 700, marginTop: 1 },

  monthDetail: { marginTop: 16, background: "#FFFDFA", border: "1px solid #ECE5D8", borderRadius: 14, padding: 12 },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(43,38,34,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 },
  modal: { width: "100%", maxWidth: 480, background: "#FAF7F1", borderRadius: "18px 18px 0 0", padding: 18, maxHeight: "70vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { margin: 0, fontSize: 16, fontWeight: 700 },
  modalClose: { border: "none", background: "#ECE5D8", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", color: "#6B6258" },
  areaList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 },
  areaItem: { display: "flex", alignItems: "center", gap: 9, background: "#fff", border: "1px solid #ECE5D8", borderRadius: 10, padding: "9px 11px" },
  areaDot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 },
  areaName: { flex: 1, fontSize: 13.5, fontWeight: 600, color: "#2B2622" },
  areaDelete: { border: "none", background: "transparent", color: "#C9BFAD", padding: 4 },
  addAreaRow: { display: "flex", gap: 8, marginTop: 12 },
  addAreaInput: { flex: 1, border: "1px solid #ECE5D8", borderRadius: 9, padding: "9px 11px", fontSize: 13.5, background: "#fff" },
};
