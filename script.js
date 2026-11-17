/* ===== Trilha dos Triângulos — script compartilhado (versão revisada) ===== */
const TOTAL_TRILHAS = 8;

/* --------------------------------------------------------------
   ENVIO OPCIONAL AO PROFESSOR
   Para receber os relatórios numa planilha Google, publique o
   script em docs/apps-script-feedback.gs (instruções no próprio
   arquivo e no Guia do Professor) e cole a URL abaixo.
   Sem URL, o site continua funcionando: o aluno pode BAIXAR ou
   COPIAR o próprio relatório e entregá-lo ao professor.
-------------------------------------------------------------- */
const APPS_SCRIPT_URL = "";

const TRILHA_TITULOS = {
  trilha1: "O que é um triângulo?",
  trilha2: "Existe ou não existe?",
  trilha3: "Sempre 180°",
  trilha4: "Triângulos não tremem!",
  trilha5: "Construindo passo a passo",
  trilha6: "Gêmeos geométricos",
  trilha7: "Parecidos, mas não iguais",
  trilha8: "A corda dos 12 nós"
};

/* Quantidade de itens de autoavaliação em cada trilha */
const TRILHA_ITENS_AUTOAVALIACAO = {
  trilha1: 5, trilha2: 6, trilha3: 5, trilha4: 5,
  trilha5: 5, trilha6: 5, trilha7: 5, trilha8: 5
};

/* ---------- Armazenamento seguro (navegação anônima pode bloquear) ---------- */
function lsGet(k, padrao){ try{ const v = localStorage.getItem(k); return v === null ? padrao : v; }catch(e){ return padrao; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); return true; }catch(e){ return false; } }

function getProgresso(){
  try{ return JSON.parse(lsGet('trilhaTriangulos_progresso', '[]')); }catch(e){ return []; }
}

function marcarTrilhaConcluida(id){
  const p = getProgresso();
  if(!p.includes(id)){
    p.push(id);
    lsSet('trilhaTriangulos_progresso', JSON.stringify(p));
  }
  atualizarProgressoUI();
}

function atualizarProgressoUI(){
  const p = getProgresso();
  document.querySelectorAll('[data-progresso-pill]').forEach(el=>{
    el.textContent = `⭐ ${p.length}/${TOTAL_TRILHAS} trilhas`;
    el.setAttribute('aria-label', `${p.length} de ${TOTAL_TRILHAS} trilhas concluídas`);
  });
  document.querySelectorAll('[data-trilha-status]').forEach(el=>{
    const id = el.getAttribute('data-trilha-status');
    if(p.includes(id)) el.textContent = 'Concluída ✔';
  });
  atualizarBlocoFeedback();
}

/* ================================================================
   Acessibilidade compartilhada
   - opções de quiz e botões respondem ao teclado (Enter/Espaço)
   - alças de arraste nos applets podem ser movidas pelas setas
================================================================ */
function melhorarAcessibilidade(){
  document.querySelectorAll('svg:not([role]):not([aria-label])').forEach(svg=>{
    if(svg.closest('.applet-card, .rigidez-stage, .jogo-triangulo-area')) return;
    svg.setAttribute('aria-hidden','true');
  });
  document.querySelectorAll('.applet-card svg, .rigidez-stage svg').forEach(svg=>{
    svg.setAttribute('role', svg.querySelector('circle.handle') || svg.id.match(/T1|T3|T4|T6|T8/) ? 'group' : 'img');
    if(!svg.getAttribute('aria-label')) svg.setAttribute('aria-label','Applet interativo: arraste os pontos laranja (no teclado, use Tab para escolher um ponto e as setas para movê-lo).');
  });
}

/* Torna as alças (círculos .handle) operáveis pelo teclado.
   Cada página chama habilitarTecladoNasAlcas(svg) após desenhar. */
function habilitarTecladoNasAlcas(svg){
  if(!svg) return;
  svg.querySelectorAll('circle.handle').forEach((c, i)=>{
    if(c.dataset.kb) return;
    c.dataset.kb = '1';
    c.setAttribute('tabindex','0');
    c.setAttribute('role','button');
    c.setAttribute('aria-label', 'Vértice ' + (i+1) + ': use as setas para mover');
    c.addEventListener('keydown', (ev)=>{
      const passo = ev.shiftKey ? 12 : 4;
      const d = {ArrowLeft:[-passo,0], ArrowRight:[passo,0], ArrowUp:[0,-passo], ArrowDown:[0,passo]}[ev.key];
      if(!d) return;
      ev.preventDefault();
      const rect = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const cx = parseFloat(c.getAttribute('cx')) + d[0], cy = parseFloat(c.getAttribute('cy')) + d[1];
      const clientX = rect.left + (cx - vb.x) * rect.width / vb.width;
      const clientY = rect.top + (cy - vb.y) * rect.height / vb.height;
      const idx = Array.from(svg.querySelectorAll('circle.handle')).indexOf(c);
      c.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, clientX, clientY}));
      window.dispatchEvent(new PointerEvent('pointermove', {clientX, clientY}));
      window.dispatchEvent(new PointerEvent('pointerup', {clientX, clientY}));
      habilitarTecladoNasAlcas(svg);
      const nova = svg.querySelectorAll('circle.handle')[idx];
      if(nova) nova.focus();
    });
  });
}

/* Arredonda três ângulos de modo que a soma exibida continue 180°
   (método do maior resto) — evita o "179°" ou "181°" na tela. */
function arredondarAngulos(angs){
  const base = angs.map(Math.floor);
  let falta = Math.round(angs.reduce((s,x)=>s+x,0)) - base.reduce((s,x)=>s+x,0);
  const ordem = angs.map((x,i)=>[x-Math.floor(x), i]).sort((p,q)=>q[0]-p[0]);
  for(let k=0; k<falta && k<ordem.length; k++) base[ordem[k][1]]++;
  return base;
}

/* ================================================================
   Relatório do aluno — baixar, copiar ou (opcional) enviar
================================================================ */
function getNomeAluno(){ return lsGet('trilhaTriangulos_aluno', ''); }

function coletarFeedback(nome){
  const progresso = getProgresso();
  const detalhes = Object.keys(TRILHA_TITULOS).map(id=>{
    let autoavaliacaoPct = null;
    try{
      const stars = JSON.parse(lsGet(id + '-autoavaliacao', '{}'));
      const totalItens = TRILHA_ITENS_AUTOAVALIACAO[id] || 0;
      if(totalItens > 0){
        let soma = 0;
        Object.values(stars).forEach(v => soma += (v || 0));
        autoavaliacaoPct = Math.round((soma / (totalItens * 5)) * 100);
      }
    }catch(e){}
    return {
      trilha: id, titulo: TRILHA_TITULOS[id],
      concluida: progresso.includes(id),
      autoavaliacaoPct,
      reflexao: lsGet(id + '-reflexao', '')
    };
  });
  return { aluno: nome, dataEnvio: new Date().toISOString(), trilhasConcluidas: progresso.length, totalTrilhas: TOTAL_TRILHAS, detalhes };
}

function relatorioTexto(payload){
  const linhas = [
    'TRILHA DOS TRIÂNGULOS — RELATÓRIO DO ESTUDANTE',
    'Nome: ' + payload.aluno,
    'Data: ' + new Date(payload.dataEnvio).toLocaleString('pt-BR'),
    'Trilhas concluídas: ' + payload.trilhasConcluidas + '/' + payload.totalTrilhas, ''
  ];
  payload.detalhes.forEach(d=>{
    linhas.push(`[${d.concluida ? 'x' : ' '}] ${d.trilha.replace('trilha','Trilha ')} — ${d.titulo}`);
    linhas.push('    Autoavaliação: ' + (d.autoavaliacaoPct === null ? '—' : d.autoavaliacaoPct + '%'));
    if(d.reflexao) linhas.push('    Investigação: ' + d.reflexao.replace(/\s+/g,' '));
    linhas.push('');
  });
  return linhas.join('\n');
}

function atualizarBlocoFeedback(){
  const status = document.getElementById('feedbackEnvioStatus');
  const campo = document.getElementById('feedbackNome');
  if(campo && !campo.value) campo.value = getNomeAluno();
  if(!status) return;
  const p = getProgresso();
  status.textContent = `Progresso atual: ${p.length}/${TOTAL_TRILHAS} trilhas concluídas.`;
}

function lerNomeDoCampo(status){
  const campo = document.getElementById('feedbackNome');
  const nome = campo ? campo.value.trim() : '';
  if(!nome){
    status.textContent = 'Escreva seu nome no campo acima antes de continuar.';
    status.style.color = '#C2185B';
    if(campo) campo.focus();
    return '';
  }
  lsSet('trilhaTriangulos_aluno', nome);
  return nome;
}

function baixarRelatorio(){
  const status = document.getElementById('feedbackEnvioStatus');
  const nome = lerNomeDoCampo(status); if(!nome) return;
  const texto = relatorioTexto(coletarFeedback(nome));
  const blob = new Blob([texto], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'relatorio-trilha-triangulos-' + nome.toLowerCase().replace(/[^a-z0-9à-ú]+/gi,'-') + '.txt';
  document.body.appendChild(a); a.click(); a.remove();
  status.textContent = '✅ Relatório baixado. Entregue o arquivo ao seu professor (e-mail, pendrive ou plataforma da escola).';
  status.style.color = '#047857';
}

async function copiarRelatorio(){
  const status = document.getElementById('feedbackEnvioStatus');
  const nome = lerNomeDoCampo(status); if(!nome) return;
  const texto = relatorioTexto(coletarFeedback(nome));
  try{
    await navigator.clipboard.writeText(texto);
    status.textContent = '✅ Relatório copiado. Cole no e-mail, no WhatsApp da turma ou na plataforma indicada pelo professor.';
    status.style.color = '#047857';
  }catch(e){
    status.textContent = 'Não foi possível copiar automaticamente. Use o botão "Baixar relatório".';
    status.style.color = '#C2185B';
  }
}

async function enviarFeedbackProfessor(){
  const status = document.getElementById('feedbackEnvioStatus');
  if(!APPS_SCRIPT_URL){
    status.textContent = 'O envio automático não foi configurado nesta cópia do site. Use "Baixar relatório" ou "Copiar relatório".';
    status.style.color = '#C2185B';
    return;
  }
  const nome = lerNomeDoCampo(status); if(!nome) return;
  const payload = coletarFeedback(nome);
  status.textContent = 'Enviando...'; status.style.color = '#5B2EE0';
  try{
    // "text/plain" evita o preflight de CORS no Apps Script; a resposta é opaca.
    await fetch(APPS_SCRIPT_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(payload) });
    status.textContent = '✅ Relatório enviado para a planilha do professor.';
    status.style.color = '#047857';
  }catch(e){
    status.textContent = '❌ Não foi possível enviar agora (sem internet?). Use "Baixar relatório".';
    status.style.color = '#C2185B';
  }
}

/* Embaralha as alternativas (com 3+ opções) para que a resposta certa
   não fique sempre na mesma posição. Os eventos são preservados. */
function embaralharAlternativas(){
  document.querySelectorAll('.quiz-opcoes').forEach(box=>{
    const ops = Array.from(box.children);
    if(ops.length < 3) return;
    for(let i=ops.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [ops[i],ops[j]]=[ops[j],ops[i]]; }
    ops.forEach(o=>box.appendChild(o));
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  atualizarProgressoUI();
  embaralharAlternativas();
  melhorarAcessibilidade();
  document.querySelectorAll('.applet-card svg, .rigidez-stage svg').forEach(svg=>{
    habilitarTecladoNasAlcas(svg);
    // reaplica quando o applet redesenha as alças
    new MutationObserver(()=>{ if(svg.querySelector('circle.handle:not([tabindex])')) habilitarTecladoNasAlcas(svg); })
      .observe(svg, {childList:true});
  });
});
