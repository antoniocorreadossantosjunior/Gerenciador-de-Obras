let obras = [];
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalFields = document.getElementById("modal-fields");
const modalForm = document.getElementById("modal-form");

// ======== TEMA ========
const body = document.body;
const toggleThemeBtn = document.getElementById('toggle-theme');
const savedTheme = localStorage.getItem('theme') || 'light';
body.classList.add(savedTheme);
toggleThemeBtn.textContent = savedTheme === 'dark' ? '☀️ Tema' : '🌙 Tema';

toggleThemeBtn.addEventListener('click', () => {
  body.classList.toggle('dark');
  body.classList.toggle('light');
  const theme = body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  toggleThemeBtn.textContent = theme === 'dark' ? '☀️ Tema' : '🌙 Tema';
});

// ======== UTIL ========
function gerarId() { return Date.now() + Math.floor(Math.random() * 1000); }
function calcularProgressoGeral(obra) {
  if (!obra.etapas || !obra.etapas.length) return obra.progresso || 0;
  let total = 0;
  obra.etapas.forEach(e => {
    const status = (e.status || "").toLowerCase();
    if (status === 'concluída') total += 100;
    else if (status === 'em andamento') total += 50;
  });
  return Math.round(total / obra.etapas.length);
}

// ======== RENDER ========
function exibirObras() {
  const lista = document.getElementById("lista-obras");
  lista.innerHTML = "";
  if (!obras.length) { lista.innerHTML = "<p>Nenhuma obra cadastrada.</p>"; return; }

  obras.forEach(obra => {
    const div = document.createElement("div");
    div.className = "obra";
    const progressoSafe = calcularProgressoGeral(obra);
    div.innerHTML = `
      <h3>${obra.nome}</h3>
      <p><strong>Localização:</strong> ${obra.localizacao}</p>
      <p><strong>Responsável:</strong> ${obra.responsavel || "-"}</p>
      <p><strong>Status:</strong> ${obra.status}</p>
      <div class="barra"><div class="progresso" style="width:${progressoSafe}%">${progressoSafe}%</div></div>
      <button class="btn-editar" onclick="editarObra(${obra.id})">Editar</button>
      <button class="btn-excluir" onclick="excluirObra(${obra.id})">Excluir</button>
      <h4>Etapas</h4><div id="etapas-${obra.id}"></div>
      <button onclick="abrirModalAdicionarEtapa(${obra.id})">Adicionar Etapa</button>
    `;
    lista.appendChild(div);
    exibirEtapas(obra);
  });
}

function exibirEtapas(obra) {
  const div = document.getElementById(`etapas-${obra.id}`);
  div.innerHTML = "";
  (obra.etapas || []).forEach(etapa => {
    const eDiv = document.createElement("div");
    eDiv.className = "etapa";
    eDiv.innerHTML = `
      <strong>${etapa.nome}</strong> (Status: ${etapa.status}) 
      <button onclick="editarEtapa(${obra.id},${etapa.id})">Editar</button>
      <button onclick="excluirEtapa(${obra.id},${etapa.id})">Excluir</button>
      <div id="materiais-${obra.id}-${etapa.id}"></div>
      <button onclick="abrirModalAdicionarMaterial(${obra.id},${etapa.id})">Adicionar Material</button>
    `;
    div.appendChild(eDiv);
    exibirMateriais(obra, etapa);
  });
}

function exibirMateriais(obra, etapa) {
  const div = document.getElementById(`materiais-${obra.id}-${etapa.id}`);
  div.innerHTML = "";
  (etapa.materiais || []).forEach(mat => {
    const mDiv = document.createElement("div");
    mDiv.className = "material";
    mDiv.innerHTML = `
      ${mat.nome} - Qtd: ${mat.quantidade} - Custo: ${mat.custoUnit.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
      <button onclick="excluirMaterial(${obra.id},${etapa.id},${mat.id})">Excluir</button>
    `;
    div.appendChild(mDiv);
  });
}

// ======== MODAL ========
function abrirModal(titulo, campos, onSubmit) {
  modalTitle.textContent = titulo;
  modalFields.innerHTML = campos;
  modal.style.display = "flex";
  modal.classList.add("show");
  modalForm.onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(modalForm));
    onSubmit(data);
    fecharModal();
  };
}

function fecharModal() {
  modal.classList.remove("show");
  setTimeout(() => modal.style.display = "none", 300);
}

// ======== CRUD via BACKEND ========
async function carregarObras() {
  const res = await fetch("/obras");
  obras = await res.json();
  exibirObras();
}

document.getElementById("form-obra").addEventListener("submit", async e => {
  e.preventDefault();
  const novaObra = {
    nome: document.getElementById("nome").value,
    localizacao: document.getElementById("localizacao").value,
    responsavel: document.getElementById("responsavel").value,
    status: document.getElementById("status").value,
    progresso: parseInt(document.getElementById("progresso").value)
  };
  const res = await fetch("/obras", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(novaObra)
  });
  const obraCriada = await res.json();
  obras.push(obraCriada);
  exibirObras();
  e.target.reset();
});

async function excluirObra(id) {
  if (!confirm("Tem certeza que deseja excluir esta obra?")) return;
  await fetch(`/obras/${id}`, { method: "DELETE" });
  await carregarObras();
}

async function editarObra(id) {
  const obra = obras.find(o => o.id === id);
  abrirModal("Editar Obra", `
    <label>Nome:</label><input type="text" name="nome" value="${obra.nome}" required>
    <label>Localização:</label><input type="text" name="localizacao" value="${obra.localizacao}" required>
    <label>Responsável:</label><input type="text" name="responsavel" value="${obra.responsavel || ""}">
    <label>Status:</label>
    <select name="status">
      <option ${obra.status==="Inicial"?"selected":""}>Inicial</option>
      <option ${obra.status==="Em andamento"?"selected":""}>Em andamento</option>
      <option ${obra.status==="Concluída"?"selected":""}>Concluída</option>
    </select>
    <label>Progresso (%):</label><input type="number" name="progresso" min="0" max="100" value="${obra.progresso}">
  `, async data => {
    await fetch(`/obras/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: data.nome,
        localizacao: data.localizacao,
        responsavel: data.responsavel,
        status: data.status,
        progresso: parseInt(data.progresso)
      })
    });
    await carregarObras();
  });
}

// ======== INICIALIZAÇÃO ========
carregarObras();
