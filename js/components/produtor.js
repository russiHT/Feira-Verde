/* FeiraVerde Digital - Componente do Portal do Produtor Rural */

window.componenteProdutor = {
  render(banco) {
    const totalEntregueKg = banco.estoqueCentral.reduce((soma, item) => soma + item.qtdKg, 0);
    const demandasAtivas = banco.demandasUrgentesProdutos.filter(d => d.status === 'ABERTO');

    return `
      <!-- Banner de Cabeçalho -->
      <div class="card" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.9)); border: 1px solid rgba(245, 158, 11, 0.3); margin-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="width:54px; height:54px; border-radius:14px; background:#d97706; color:#fff; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:800;">
              <i class="fa-solid fa-wheat-awn"></i>
            </div>
            <div>
              <h2 style="font-size: 1.25rem; margin:0;">Portal da Agricultura Familiar & Produtores Rurais</h2>
              <p style="font-size: 0.85rem; color: var(--cor-texto-secundario); margin-top:2px;">
                Programa de Abastecimento Direto da Prefeitura Municipal de Ponta Grossa
              </p>
            </div>
          </div>

          <div style="display:flex; gap:16px;">
            <div style="text-align:right;">
              <div style="font-size:0.8rem; color:var(--cor-texto-secundario);">Volume Entregue na Semana</div>
              <div style="font-family:var(--fonte-titulo); font-size:1.3rem; font-weight:800; color:var(--cor-destaque);">
                ${totalEntregueKg} kg
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Seção de Alertas de Demanda Urgente de Suprimento -->
      <div class="card" style="margin-bottom: 24px; border: 1px solid var(--cor-destaque-brilho); background: rgba(245, 158, 11, 0.04);">
        <div class="card-header">
          <h3 class="card-title" style="color:var(--cor-destaque);">
            <i class="fa-solid fa-bell-exclamation"></i> ALERTAS DE DEMANDA URGENTE (Solicitações da Prefeitura)
          </h3>
          <span class="badge badge-warning">${demandasAtivas.length} Pedidos Abertos</span>
        </div>

        <p style="font-size: 0.85rem; color: var(--cor-texto-secundario); margin-bottom: 16px;">
          A Secretaria Municipal identificou falta destes hortifrútis para atender as rotas da Feira Verde hoje. Escolha qual produto você pode enviar!
        </p>

        <div class="grid-2">
          ${banco.demandasUrgentesProdutos.map(demanda => {
            const porcentagem = Math.min(100, Math.round((demanda.kgAtendidos / demanda.kgSolicitados) * 100));
            const ehConcluido = demanda.status === 'CONCLUIDO';

            return `
              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid ${ehConcluido ? 'var(--cor-borda)' : 'rgba(245, 158, 11, 0.4)'}; padding: 16px; border-radius: var(--raio-m);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 8px;">
                  <div>
                    <h4 style="font-size: 1.05rem; color:#fff; margin:0;">${demanda.nomeAlimento}</h4>
                    <div style="font-size: 0.8rem; color: var(--cor-texto-secundario); margin-top:2px;">
                      Prazo: <strong>${demanda.prazo}</strong>
                    </div>
                  </div>
                  <span class="badge ${ehConcluido ? 'badge-success' : 'badge-warning'}">${ehConcluido ? 'Atendido' : 'Urgente'}</span>
                </div>

                <div style="font-size:0.85rem; color:#cbd5e1; margin-bottom: 12px; background:rgba(0,0,0,0.2); padding:8px 12px; border-radius:6px;">
                  <i class="fa-solid fa-info-circle" style="color:var(--cor-destaque);"></i> ${demanda.motivo}
                </div>

                <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                  <span>Meta de Atendimento:</span>
                  <strong>${demanda.kgAtendidos} kg / ${demanda.kgSolicitados} kg (${porcentagem}%)</strong>
                </div>
                <div class="progress-bar-bg" style="margin-bottom: 16px;">
                  <div class="progress-bar-fill" style="width: ${porcentagem}%; background: linear-gradient(90deg, #f59e0b, #10b981);"></div>
                </div>

                ${!ehConcluido ? `
                  <div style="display:flex; gap:8px;">
                    <input type="number" min="1" max="${demanda.kgSolicitados - demanda.kgAtendidos}" class="form-control" id="producer-offer-${demanda.id}" placeholder="Qtd kg para enviar">
                    <button class="btn btn-primary" style="white-space:nowrap;" onclick="window.componenteProdutor.atenderDemanda(${demanda.id})">
                      <i class="fa-solid fa-truck-ramp-box"></i> Enviar este Alimento
                    </button>
                  </div>
                ` : `
                  <div style="text-align:center; font-size:0.85rem; color:var(--cor-primaria); font-weight:700;">
                    <i class="fa-solid fa-circle-check"></i> Demanda Totalmente Atendida!
                  </div>
                `}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="grid-2">
        <!-- Formulário de Nova Entrega -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fa-solid fa-truck-field"></i> Registrar Nova Entrega de Rotina</h3>
            <span class="badge badge-success">Sua Cooperativa</span>
          </div>

          <form onsubmit="window.componenteProdutor.enviarColheita(event)">
            <div class="form-group">
              <label class="form-label">Nome do Produtor / Cooperativa</label>
              <input type="text" id="producer-name" class="form-control" value="Sítio Sol Nascente (Família Oliveira)" required>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Tipo de Alimento</label>
                <select id="producer-item" class="form-control">
                  ${banco.estoqueCentral.map(item => `
                    <option value="${item.id}">${item.nome} (${item.categoria})</option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Quantidade Entregue (kg)</label>
                <input type="number" id="producer-qty" class="form-control" placeholder="ex: 300" required min="1">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Data de Colheita / Lote</label>
              <input type="date" id="producer-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              <i class="fa-solid fa-plus-circle"></i> Confirmar Entrada no Almoxarifado
            </button>
          </form>
        </div>

        <!-- Histórico de Entregas -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fa-solid fa-clipboard-list"></i> Entregas Recentes no Almoxarifado</h3>
            <span class="badge badge-info">PEPS Ativo</span>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Alimento</th>
                  <th>Quantidade</th>
                  <th>Fornecedor</th>
                  <th>Data Lote</th>
                </tr>
              </thead>
              <tbody>
                ${banco.estoqueCentral.map(item => `
                  <tr>
                    <td><strong>${item.nome}</strong></td>
                    <td><span class="badge badge-success">${item.qtdKg} kg</span></td>
                    <td style="font-size:0.8rem; color:var(--cor-texto-secundario);">${item.fornecedor}</td>
                    <td>${item.dataLote}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  atenderDemanda(idDemanda) {
    const campoQtd = document.getElementById(`producer-offer-${idDemanda}`);
    const qtd = parseFloat(campoQtd ? campoQtd.value : 0);

    if (!qtd || qtd <= 0) {
      window.utilitarios.mostrarNotificacao('Informe uma quantidade de kg válida para enviar.', 'warning');
      return;
    }

    const nomeProdutor = document.getElementById('producer-name') ? document.getElementById('producer-name').value : 'Cooperativa FrutaSul';
    window.appState.atenderDemandaProduto(idDemanda, nomeProdutor, qtd);
    window.utilitarios.mostrarNotificacao(`Você enviou ${qtd}kg de hortifrúti para atender o alerta de urgência! O estoque da Feira Verde foi reabastecido.`, 'success');
  },

  enviarColheita(e) {
    e.preventDefault();
    const idAlimento = document.getElementById('producer-item').value;
    const qtd = parseFloat(document.getElementById('producer-qty').value) || 0;
    const fornecedor = document.getElementById('producer-name').value;
    const dataLote = document.getElementById('producer-date').value;

    const item = window.appState.banco.estoqueCentral.find(s => s.id === idAlimento);
    if (item) {
      item.qtdKg += qtd;
      item.fornecedor = fornecedor;
      item.dataLote = dataLote;
      window.appState.salvar();
      window.utilitarios.mostrarNotificacao(`Entrega de ${qtd}kg de ${item.nome} registrada no almoxarifado!`, 'success');
      document.getElementById('producer-qty').value = '';
    }
  },

  // Aliases para retrocompatibilidade
  fulfillDemand(id) { this.atenderDemanda(id); },
  submitHarvest(e) { this.enviarColheita(e); }
};

window.producerComponent = window.componenteProdutor;
