/* ===== Trilha dos Triângulos — script compartilhado ===== */
const TOTAL_TRILHAS = 8;

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
}

document.addEventListener('DOMContentLoaded', atualizarProgressoUI);
