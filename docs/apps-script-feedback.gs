/**
 * Trilha dos Triângulos — receptor opcional de relatórios (Google Apps Script)
 *
 * COMO USAR
 * 1. Crie uma planilha Google. Menu Extensões > Apps Script.
 * 2. Apague o conteúdo e cole este arquivo. Salve.
 * 3. Implantar > Nova implantação > Tipo: App da Web.
 *    Executar como: Eu. Quem pode acessar: Qualquer pessoa.
 * 4. Copie a URL gerada e cole em APPS_SCRIPT_URL, no arquivo script.js do site.
 *
 * Cada envio vira uma linha na aba "Relatorios".
 * Dados coletados: nome digitado pelo estudante, data, trilhas concluídas,
 * autoavaliação (%) e textos das investigações. Informe os responsáveis (LGPD).
 */
function doPost(e) {
  var dados = JSON.parse(e.postData.contents);
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName('Relatorios') || planilha.insertSheet('Relatorios');
  if (aba.getLastRow() === 0) {
    var cab = ['Data', 'Aluno', 'Concluídas'];
    for (var i = 1; i <= 8; i++) cab.push('T' + i + ' concluída', 'T' + i + ' autoaval. (%)', 'T' + i + ' investigação');
    aba.appendRow(cab);
  }
  var linha = [new Date(dados.dataEnvio), String(dados.aluno).slice(0, 120), dados.trilhasConcluidas];
  (dados.detalhes || []).forEach(function (d) {
    linha.push(d.concluida ? 'sim' : 'não', d.autoavaliacaoPct, String(d.reflexao || '').slice(0, 5000));
  });
  aba.appendRow(linha);
  return ContentService.createTextOutput('ok');
}
