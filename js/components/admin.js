/* FeiraVerde Digital - Componente do Painel Gestor Municipal */

window.componenteAdmin = {
  caminhaoSelecionadoParaStatus: null,

  render(banco) {
    let totalReciclavelKg = 0;
    let totalAlimentoDistribuidoKg = 0;
    banco.transacoes.forEach(t => {
      Object.values(t.reciclaveis).forEach(v => totalReciclavelKg += v);
      totalAlimentoDistribuidoKg += t.kgAlimentoGasto;
    });

    const qtdCaminhoesAtivos = banco.caminhoes.filter(t => t.status === 'EM_ANDAMENTO').length;
    const totalEstoqueCentralKg = banco.estoqueCentral.reduce((acumulador, item) => acumulador + item.qtdKg, 0);

    return `
      <!-- Cartões Indicadores (KPIs) -->
      <div class="grid-4" style="margin-bottom: 24px;">
        <div class="kpi-card" style="--kpi-accent: #10b981;">
          <div class="kpi-icon"><i class="fa-solid fa-recycle"></i></div>
          <div class="kpi-value">${(totalReciclavelKg + 845.5).toFixed(1)} kg</div>
          <div class="kpi-label">Recicláveis Recolhidos</div>
          <div class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +14.2% este mês</div>
        </div>

        <div class="kpi-card" style="--kpi-accent: #f59e0b;">
          <div class="kpi-icon"><i class="fa-solid fa-carrot"></i></div>
          <div class="kpi-value">${(totalAlimentoDistribuidoKg + 450).toFixed(0)} kg</div>
          <div class="kpi-label">Hortifrúti Distribuído</div>
          <div class="kpi-trend up"><i class="fa-solid fa-arrow-trend-up"></i> 100% Agricultura Familiar</div>
        </div>

        <div class="kpi-card" style="--kpi-accent: #3b82f6;">
          <div class="kpi-icon"><i class="fa-solid fa-truck-ramp-box"></i></div>
          <div class="kpi-value">${qtdCaminhoesAtivos} / ${banco.caminhoes.length}</div>
          <div class="kpi-label">Caminhões em Rota</div>
          <div class="kpi-trend neutral"><i class="fa-solid fa-location-dot"></i> GPS Ativo ao vivo</div>
        </div>

        <div class="kpi-card" style="--kpi-accent: #8b5cf6;">
          <div class="kpi-icon"><i class="fa-solid fa-users-viewfinder"></i></div>
          <div class="kpi-value">${banco.cidadaos.length * 480}</div>
          <div class="kpi-label">Famílias Beneficiadas</div>
          <div class="kpi-trend up"><i class="fa-solid fa-shield-halved"></i> Auditado via Gov.br</div>
        </div>
      </div>

      <!-- Banner de Alertas de Suprimento de Produtos -->
      <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95)); border: 1px solid var(--cor-borda-destaque);">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom:16px;">
          <div>
            <h3 style="font-size: 1.1rem; color: #fff; display: flex; align-items: center; gap: 10px;">
              <span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 800;">CENTRAL DE SUPRIMENTO</span>
              Emitir Alerta de Demanda Urgente de Produtos para Produtores Rurais
            </h3>
            <p style="font-size: 0.85rem; color: var(--cor-texto-secundario); margin-top: 4px;">
              Notifique a rede de agricultores familiares sobre quais alimentos estão com estoque baixo para reabastecer a Feira Verde imediatamente.
            </p>
          </div>
          <button class="btn btn-warning" style="background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff;" onclick="window.adminComponent.abrirModalAlerta()">
            <i class="fa-solid fa-bullhorn"></i> Solicitar Alimento com Urgência
          </button>
        </div>

        <!-- Lista de Demandas de Produtos Ativas -->
        <div class="grid-2">
          ${banco.demandasUrgentesProdutos.map(demanda => {
            const porcentagem = Math.min(100, Math.round((demanda.kgAtendidos / demanda.kgSolicitados) * 100));
            return `
              <div style="background: rgba(15, 23, 42, 0.6); padding: 12px 16px; border-radius: var(--raio-p); border: 1px solid var(--cor-borda);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                  <strong style="font-size:0.95rem; color:#fff;"><i class="fa-solid fa-bell-exclamation" style="color:var(--cor-destaque);"></i> ${demanda.nomeAlimento}</strong>
                  <span class="badge ${demanda.status === 'CONCLUIDO' ? 'badge-success' : 'badge-warning'}">${demanda.status === 'CONCLUIDO' ? 'Concluído' : 'Ativo / Em Aberto'}</span>
                </div>
                <div style="font-size:0.8rem; color:var(--cor-texto-secundario); margin-bottom:8px;">${demanda.motivo}</div>
                
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
                  <span>Atendido: <strong>${demanda.kgAtendidos} kg / ${demanda.kgSolicitados} kg</strong></span>
                  <span><strong>${porcentagem}%</strong></span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${porcentagem}%;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="grid-2">
        <!-- Tabela de Rotas Dinâmicas -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fa-solid fa-map-location-dot"></i> Calendário Dinâmico de Rotas (GPS)</h3>
            <span class="badge badge-info"><i class="fa-solid fa-rotate"></i> Atualização em Tempo Real</span>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Caminhão</th>
                  <th>Bairro / Ponto</th>
                  <th>Horário</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${banco.caminhoes.map(caminhao => {
                  let badgeStatus = '';
                  if (caminhao.status === 'EM_ANDAMENTO') badgeStatus = '<span class="badge badge-success"><i class="fa-solid fa-truck"></i> Em Rota</span>';
                  else if (caminhao.status === 'ATRASADO_CHUVA') badgeStatus = '<span class="badge badge-danger"><i class="fa-solid fa-cloud-showers-heavy"></i> Pausado (Chuva)</span>';
                  else if (caminhao.status === 'AGENDADO') badgeStatus = '<span class="badge badge-info"><i class="fa-solid fa-calendar"></i> Agendado</span>';
                  else badgeStatus = '<span class="badge badge-warning"><i class="fa-solid fa-check"></i> Concluído</span>';

                  return `
                    <tr>
                      <td><strong>${caminhao.id}</strong><br><small style="color:var(--cor-texto-suave);">${caminhao.motorista}</small></td>
                      <td>${caminhao.bairro}<br><small style="color:var(--cor-texto-secundario);">${caminhao.localizacao}</small></td>
                      <td>${caminhao.horarioAgendado}</td>
                      <td>${badgeStatus}</td>
                      <td>
                        <button class="btn btn-secondary btn-sm" onclick="window.adminComponent.abrirModalStatus('${caminhao.id}')">
                          <i class="fa-solid fa-pen-to-square"></i> Alterar Status
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Estoque Central PEPS -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fa-solid fa-boxes-packing"></i> Almoxarifado Central & Estoque (PEPS)</h3>
            <span class="badge badge-success">Total: ${totalEstoqueCentralKg} kg</span>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Categoria</th>
                  <th>Estoque Central</th>
                  <th>Validade / Lote</th>
                  <th>Fornecedor</th>
                </tr>
              </thead>
              <tbody>
                ${banco.estoqueCentral.map(item => `
                  <tr>
                    <td><strong>${item.nome}</strong></td>
                    <td><span class="badge badge-info">${item.categoria}</span></td>
                    <td><strong>${item.qtdKg} kg</strong></td>
                    <td>${item.dataLote}<br><small style="color:var(--cor-aviso);">Vence em ${item.diasVencimento} dias</small></td>
                    <td style="font-size:0.8rem; color:var(--cor-texto-secundario);">${item.fornecedor}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Configuração das Taxas de Troca -->
      <div class="card" style="margin-top: 24px;">
        <div class="card-header">
          <h3 class="card-title"><i class="fa-solid fa-sliders"></i> Parâmetros de Troca (Reciclável por Kg de Alimento)</h3>
          <p style="font-size:0.85rem; color:var(--cor-texto-secundario);">Defina quantos kg/unidades de reciclável equivalem a 1 kg de alimento hortifrúti</p>
        </div>

        <div class="grid-3">
          ${banco.taxasConversao.map(taxa => `
            <div style="background: rgba(15, 23, 42, 0.6); padding: 16px; border-radius: var(--raio-m); border: 1px solid var(--cor-borda);">
              <div style="display:flex; align-items:center; gap:10px; margin-bottom: 12px;">
                <div style="width:36px; height:36px; border-radius:8px; background:rgba(16, 185, 129, 0.15); color:var(--cor-primaria); display:flex; align-items:center; justify-content:center; font-size:18px;">
                  <i class="fa-solid ${taxa.icone}"></i>
                </div>
                <div>
                  <strong style="font-size:0.95rem;">${taxa.nome}</strong>
                  <div style="font-size:0.75rem; color:var(--cor-texto-secundario);">Unidade: ${taxa.unidade}</div>
                </div>
              </div>
              <div class="form-group" style="margin-bottom: 8px;">
                <label class="form-label">Quantidade para 1 kg de Alimento</label>
                <div style="display:flex; gap:8px;">
                  <input type="number" step="0.1" class="form-control" id="rate-input-${taxa.id}" value="${taxa.kgPorKgAlimento}">
                  <button class="btn btn-primary btn-sm" onclick="window.adminComponent.salvarTaxa('${taxa.id}')">Salvar</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  abrirModalAlerta() {
    window.utilitarios.abrirModal('alert-modal');
  },

  abrirModalStatus(idCaminhao) {
    this.caminhaoSelecionadoParaStatus = idCaminhao;
    const caminhao = window.appState.obterCaminhao(idCaminhao);
    if (caminhao) {
      document.getElementById('status-modal-truck-id').innerText = `${caminhao.id} (${caminhao.bairro})`;
      document.getElementById('status-select-input').value = caminhao.status;
      window.utilitarios.abrirModal('status-modal');
    }
  },

  confirmarMudancaStatus() {
    if (!this.caminhaoSelecionadoParaStatus) return;
    const novoStatus = document.getElementById('status-select-input').value;
    window.appState.atualizarStatusRota(this.caminhaoSelecionadoParaStatus, novoStatus);
    window.utilitarios.fecharModal('status-modal');
    window.utilitarios.mostrarNotificacao(`Status do caminhão ${this.caminhaoSelecionadoParaStatus} alterado com sucesso!`, 'success');
  },

  enviarAlertaUrgente() {
    const idAlimento = document.getElementById('alert-food-select').value;
    const kgSolicitados = document.getElementById('alert-qty-input').value;
    const motivo = document.getElementById('alert-msg-input').value;

    if (!kgSolicitados || parseFloat(kgSolicitados) <= 0) {
      window.utilitarios.mostrarNotificacao('Por favor, informe uma quantidade válida de hortifrúti.', 'danger');
      return;
    }

    const demanda = window.appState.adicionarDemandaUrgenteProduto(idAlimento, kgSolicitados, motivo);
    window.utilitarios.fecharModal('alert-modal');
    window.utilitarios.mostrarNotificacao(`Alerta de Urgência de ${demanda.kgSolicitados}kg de ${demanda.nomeAlimento} disparado para a rede de Produtores Rurais!`, 'warning');
  },

  salvarTaxa(idTaxa) {
    const valor = document.getElementById(`rate-input-${idTaxa}`).value;
    window.appState.atualizarTaxaConversao(idTaxa, valor);
    window.utilitarios.mostrarNotificacao(`Parâmetro de troca atualizado para ${valor}!`, 'success');
  },

  // Aliases para retrocompatibilidade de eventos HTML
  openAlertModal() { this.abrirModalAlerta(); },
  confirmStatusChange() { this.confirmarMudancaStatus(); },
  sendUrgentAlert() { this.enviarAlertaUrgente(); },
  saveRate(id) { this.salvarTaxa(id); }
};

window.adminComponent = window.componenteAdmin;
