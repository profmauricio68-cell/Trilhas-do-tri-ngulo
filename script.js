/* ===== Trilha dos Triângulos — script compartilhado ===== */
const TOTAL_TRILHAS = 8;

/* --------------------------------------------------------------
   URL do Google Apps Script publicado (feedback ao professor).
-------------------------------------------------------------- */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwb_4Wo5CbtkkIvWlqrotVltBR3JsRipA_P3EGa1s6N-UfbD8XuCt9Gdegebe1QsZBa/exec";

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

/* Quantidade de itens de autoavaliação em cada trilha (usado para
   calcular a porcentagem do mesmo jeito que a própria trilha calcula). */
const TRILHA_ITENS_AUTOAVALIACAO = {
  trilha1: 7,
  trilha2: 6,
  trilha3: 5,
  trilha4: 5,
  trilha5: 5,
  trilha6: 5,
  trilha7: 5,
  trilha8: 5
};

function getProgresso(){
  try{
    return JSON.parse(localStorage.getItem('trilhaTriangulos_progresso') || '[]');
  }catch(e){ return []; }
}

function marcarTrilhaConcluida(id){
  const p = getProgresso();
  if(!p.includes(id)){
    p.push(id);
    localStorage.setItem('trilhaTriangulos_progresso', JSON.stringify(p));
  }
  atualizarProgressoUI();
}

function atualizarProgressoUI(){
  const p = getProgresso();
  document.querySelectorAll('[data-progresso-pill]').forEach(el=>{
    el.textContent = `⭐ ${p.length}/${TOTAL_TRILHAS} trilhas`;
  });
  document.querySelectorAll('[data-trilha-status]').forEach(el=>{
    const id = el.getAttribute('data-trilha-status');
    if(p.includes(id)){
      el.textContent = 'Concluída ✔';
    }
  });
  atualizarBlocoFeedback();
}

/* ================================================================
   Feedback ao professor — envia um resumo do progresso do aluno
   para a planilha do professor via Google Apps Script.
================================================================ */

function getNomeAluno(){
  return localStorage.getItem('trilhaTriangulos_aluno') || '';
}

function pedirNomeAluno(){
  let nome = getNomeAluno();
  const digitado = window.prompt('Qual é o seu nome completo? (isso identifica seu envio para o professor)', nome || '');
  if(digitado && digitado.trim()){
    nome = digitado.trim();
    localStorage.setItem('trilhaTriangulos_aluno', nome);
  }
  return nome;
}

function coletarFeedback(nome){
  const progresso = getProgresso();
  const detalhes = Object.keys(TRILHA_TITULOS).map(id=>{
    let autoavaliacaoPct = null;
    try{
      const stars = JSON.parse(localStorage.getItem(id + '-autoavaliacao') || '{}');
      const totalItens = TRILHA_ITENS_AUTOAVALIACAO[id] || 0;
      if(totalItens > 0){
        let soma = 0;
        Object.values(stars).forEach(v => soma += (v || 0));
        autoavaliacaoPct = Math.round((soma / (totalItens * 5)) * 100);
      }
    }catch(e){}
    const reflexao = localStorage.getItem(id + '-reflexao') || '';
    return {
      trilha: id,
      titulo: TRILHA_TITULOS[id],
      concluida: progresso.includes(id),
      autoavaliacaoPct,
      reflexao
    };
  });

  return {
    aluno: nome,
    dataEnvio: new Date().toISOString(),
    trilhasConcluidas: progresso.length,
    totalTrilhas: TOTAL_TRILHAS,
    detalhes
  };
}

function atualizarBlocoFeedback(){
  const status = document.getElementById('feedbackEnvioStatus');
  if(!status) return;
  const nome = getNomeAluno();
  const p = getProgresso();
  if(nome){
    status.textContent = `Aluno(a) identificado(a) como "${nome}". Progresso atual: ${p.length}/${TOTAL_TRILHAS} trilhas.`;
  } else {
    status.textContent = `Progresso atual: ${p.length}/${TOTAL_TRILHAS} trilhas. Clique no botão para se identificar e enviar.`;
  }
}

async function enviarFeedbackProfessor(){
  const status = document.getElementById('feedbackEnvioStatus');
  if(!APPS_SCRIPT_URL){
    if(status){
      status.textContent = '⚠️ O envio ainda não foi configurado pelo professor (falta a URL do Google Apps Script em script.js).';
      status.style.color = '#C43F6E';
    }
    return;
  }

  const nome = pedirNomeAluno();
  if(!nome){
    if(status){ status.textContent = 'Envio cancelado: é preciso informar seu nome.'; status.style.color = '#C43F6E'; }
    return;
  }

  const payload = coletarFeedback(nome);

  if(status){ status.textContent = 'Enviando...'; status.style.color = '#5B2EE0'; }

  try{
    // Content-Type "text/plain" evita o preflight de CORS no Apps Script.
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    if(status){
      status.textContent = `✅ Feedback enviado! Seu progresso foi registrado para o professor.`;
      status.style.color = '#039073';
    }
  }catch(e){
    if(status){
      status.textContent = '❌ Não foi possível enviar agora. Verifique sua internet e tente de novo.';
      status.style.color = '#C43F6E';
    }
  }
}

document.addEventListener('DOMContentLoaded', atualizarProgressoUI);
