/* FeiraVerde Digital - Componente do Terminal PDV Móvel do Operador */

window.componenteOperador = {
  transacaoAtiva: {
    idCaminhaoSelecionado: 'CAM-01',
    cpfCidadao: '123.456.789-00',
    reciclaveis: { plastico: 0, papelao: 0, vidro: 0, metal: 0, oleo: 0, pneu: 0 },
    alimentosRetirados: { tomate: 0, batata: 0, cenoura: 0, maca: 0, alface: 0, ovos: 0 }
  },

  render(banco) {
    const caminhaoAtual = banco.caminhoes.find(t => t.id === this.transacaoAtiva.idCaminhaoSelecionado) || banco.caminhoes[0];
    const cidadao = banco.cidadaos.find(c => c.cpf === this.transacaoAtiva.cpfCidadao) || banco.cidadaos[0];

    // Calcular kg de alimento gerados diretamente dos recicláveis
    let kgAlimentoGerado = 0;
    Object.entries(this.transacaoAtiva.reciclaveis).forEach(([id, qtd]) => {
      const taxa = banco.taxasConversao.find(r => r.id === id);
      if (taxa && taxa.kgPorKgAlimento > 0) {
        kgAlimentoGerado += (qtd / taxa.kgPorKgAlimento);
      }
    });

    // Calcular kg de alimento gastos na cesta
    let kgAlimentoGasto = 0;
    Object.values(this.transacaoAtiva.alimentosRetirados).forEach(qtd => {
      kgAlimentoGasto += qtd;
    });

    const saldoLiquidoDisponivel = Math.max(0, (cidadao.saldoAlimentoKg + kgAlimentoGerado) - kgAlimentoGasto);

    return `
      <div style="background: linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.1)); border: 1px solid var(--cor-borda-destaque); padding: 16px 24px; border-radius: var(--raio-m); margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="width:48px; height:48px; border-radius:12px; background:var(--cor-primaria); color:#000; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800;">
            <i class="fa-solid fa-truck-front"></i>
          </div>
          <div>
            <h3 style="font-size: 1.1rem; margin:0;">Terminal do Caminhão ${caminhaoAtual.id} (${caminhaoAtual.motorista})</h3>
            <p style="font-size:0.85rem; color:var(--cor-texto-secundario); margin:0;">
              Ponto Atual: <strong>${caminhaoAtual.bairro}</strong> - ${caminhaoAtual.localizacao}
            </p>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:12px;">
          <label class="form-label" style="margin:0; white-space:nowrap;">Seletor de Caminhão:</label>
          <select class="form-control" style="width:auto;" onchange="window.componenteOperador.selecionarCaminhao(this.value)">
            ${banco.caminhoes.map(t => `
              <option value="${t.id}" ${t.id === caminhaoAtual.id ? 'selected' : ''}>${t.id} - ${t.bairro}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="grid-2">
        <!-- Passo 1 & 2: Identificação do Munícipe & Pesagem -->
        <div>
          <!-- Cartão de Identificação do Cidadão -->
          <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
              <h3 class="card-title"><i class="fa-solid fa-id-card"></i> 1. Identificar Munícipe (Gov.br)</h3>
              <span class="gov-badge"><i class="fa-solid fa-shield-halved"></i> Autenticado Gov.br</span>
            </div>

            <div class="form-group">
              <label class="form-label">CPF ou Leitura de Cartão Social / QR Code</label>
              <div style="display:flex; gap:8px;">
                <select class="form-control" onchange="window.componenteOperador.selecionarCidadao(this.value)">
                  ${banco.cidadaos.map(c => `
                    <option value="${c.cpf}" ${c.cpf === cidadao.cpf ? 'selected' : ''}>${c.nome} (CPF: ${c.cpf}) - Saldo: ${c.saldoAlimentoKg.toFixed(1)} kg Alimento</option>
                  `).join('')}
                </select>
                <button class="btn btn-secondary" onclick="window.utilitarios.mostrarNotificacao('Simulador de Câmera QR Code ativo. Cidadão identificado!', 'info')">
                  <i class="fa-solid fa-qrcode"></i> Leitor
                </button>
              </div>
            </div>

            <div style="background: rgba(15, 23, 42, 0.6); padding: 12px 16px; border-radius: var(--raio-p); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 0.95rem; color: #fff;">${cidadao.nome}</strong>
                <div style="font-size: 0.8rem; color: var(--cor-texto-secundario);">Bairro: ${cidadao.bairro} | Histórico: ${cidadao.totalRecicladoKg.toFixed(1)} kg reciclados</div>
              </div>
              <div class="coin-badge">
                <i class="fa-solid fa-basket-shopping"></i> Saldo: ${cidadao.saldoAlimentoKg.toFixed(1)} kg
              </div>
            </div>
          </div>

          <!-- Entradas de Pesagem dos Recicláveis -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i class="fa-solid fa-scale-balanced"></i> 2. Pesagem de Recicláveis (Entrada)</h3>
              <span class="badge badge-success">+${kgAlimentoGerado.toFixed(1)} kg de Alimento</span>
            </div>

            <div class="grid-2">
              ${banco.taxasConversao.map(taxa => `
                <div style="background: rgba(15,23,42,0.8); border: 1px solid var(--cor-borda); padding: 12px; border-radius: var(--raio-p);">
                  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px;">
                    <span style="font-size:0.85rem; font-weight:600;"><i class="fa-solid ${taxa.icone}"></i> ${taxa.nome}</span>
                    <span style="font-size:0.75rem; color:var(--cor-texto-secundario);">${taxa.kgPorKgAlimento} ${taxa.unidade} = 1 kg Alimento</span>
                  </div>
                  <div class="counter-box">
                    <input type="number" step="0.5" min="0" class="form-control" 
                      value="${this.transacaoAtiva.reciclaveis[taxa.id] || ''}" 
                      placeholder="0.0 ${taxa.unidade}"
                      oninput="window.componenteOperador.atualizarPesoReciclavel('${taxa.id}', this.value)">
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Passo 3 & 4: Cesta de Alimentos & Finalização -->
        <div>
          <div class="card" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="card-header">
                <h3 class="card-title"><i class="fa-solid fa-basket-shopping"></i> 3. Cesta de Hortifrúti (Saída)</h3>
                <span class="badge ${saldoLiquidoDisponivel >= 0 ? 'badge-info' : 'badge-danger'}">
                  Disponível: ${saldoLiquidoDisponivel.toFixed(1)} kg
                </span>
              </div>

              <p style="font-size: 0.85rem; color: var(--cor-texto-secundario); margin-bottom: 16px;">
                Selecione os alimentos entregues. O estoque do caminhão será abatido em tempo real.
              </p>

              <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:24px;">
                ${banco.estoqueCentral.map(alimento => {
                  const estoqueNoCaminhao = caminhaoAtual.estoqueAlimentosKg[alimento.id] || 0;
                  const selecionadoAtual = this.transacaoAtiva.alimentosRetirados[alimento.id] || 0;

                  return `
                    <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--cor-borda); padding: 12px 16px; border-radius: var(--raio-p); display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                      <div>
                        <strong style="font-size:0.95rem;">${alimento.nome}</strong>
                        <div style="font-size:0.8rem; color:var(--cor-texto-secundario);">
                          Estoque no Caminhão: <span style="color:${estoqueNoCaminhao > 10 ? 'var(--cor-primaria)' : 'var(--cor-perigo)'}; font-weight:700;">${estoqueNoCaminhao} kg</span>
                        </div>
                      </div>

                      <div class="counter-box">
                        <button class="btn-counter" onclick="window.componenteOperador.alterarQtdAlimento('${alimento.id}', -1)">-</button>
                        <span style="font-weight:800; font-size:1.05rem; min-width:40px; text-align:center;">${selecionadoAtual} kg</span>
                        <button class="btn-counter" onclick="window.componenteOperador.alterarQtdAlimento('${alimento.id}', 1)">+</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Caixa de Resumo da Transação -->
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--cor-borda-destaque); padding: 20px; border-radius: var(--raio-m);">
              <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 0.9rem;">
                <span>Crédito Gerado nesta Troca:</span>
                <strong style="color:var(--cor-primaria);">+${kgAlimentoGerado.toFixed(1)} kg de Alimento</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 12px; font-size: 0.9rem;">
                <span>Total de Hortifrúti Retirado:</span>
                <strong style="color:var(--cor-destaque);">${kgAlimentoGasto.toFixed(1)} kg</strong>
              </div>
              <div style="display:flex; justify-content:space-between; padding-top: 8px; border-top: 1px solid var(--cor-borda); font-size: 1.05rem; font-weight: 800;">
                <span>Saldo Final do Munícipe:</span>
                <span style="color:${saldoLiquidoDisponivel >= 0 ? '#34d399' : '#f87171'};">${saldoLiquidoDisponivel.toFixed(1)} kg</span>
              </div>

              <button class="btn btn-primary btn-block" style="margin-top: 16px; padding: 14px; font-size: 1rem;" 
                onclick="window.componenteOperador.finalizarTransacao()" ${saldoLiquidoDisponivel < 0 ? 'disabled' : ''}>
                <i class="fa-solid fa-circle-check"></i> Finalizar Troca & Emitir Comprovante
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  selecionarCaminhao(idCaminhao) {
    this.transacaoAtiva.idCaminhaoSelecionado = idCaminhao;
    window.appState.notificar();
  },

  selecionarCidadao(cpf) {
    this.transacaoAtiva.cpfCidadao = cpf;
    window.appState.notificar();
  },

  atualizarPesoReciclavel(idTaxa, val) {
    this.transacaoAtiva.reciclaveis[idTaxa] = parseFloat(val) || 0;
    window.appState.notificar();
  },

  alterarQtdAlimento(idAlimento, delta) {
    const atual = this.transacaoAtiva.alimentosRetirados[idAlimento] || 0;
    const proximoValor = Math.max(0, atual + delta);

    const caminhao = window.appState.obterCaminhao(this.transacaoAtiva.idCaminhaoSelecionado);
    const disponivelNoCaminhao = caminhao.estoqueAlimentosKg[idAlimento] || 0;

    if (proximoValor > disponivelNoCaminhao) {
      window.utilitarios.mostrarNotificacao(`Estoque insuficiente deste item no caminhão! (Disponível: ${disponivelNoCaminhao}kg)`, 'danger');
      return;
    }

    if (delta > 0) {
      const cidadao = window.appState.obterCidadao(this.transacaoAtiva.cpfCidadao);
      let kgAlimentoGerado = 0;
      Object.entries(this.transacaoAtiva.reciclaveis).forEach(([id, qtd]) => {
        const taxa = window.appState.banco.taxasConversao.find(r => r.id === id);
        if (taxa && taxa.kgPorKgAlimento > 0) {
          kgAlimentoGerado += (qtd / taxa.kgPorKgAlimento);
        }
      });

      let novoTotalGasto = 0;
      Object.entries(this.transacaoAtiva.alimentosRetirados).forEach(([id, qtd]) => {
        novoTotalGasto += (id === idAlimento ? proximoValor : qtd);
      });

      const saldoFuturo = (cidadao.saldoAlimentoKg + kgAlimentoGerado) - novoTotalGasto;

      if (saldoFuturo < 0) {
        window.utilitarios.mostrarNotificacao(`Saldo de alimentos do munícipe atingido! Pese mais recicláveis para retirar mais alimentos.`, 'warning');
        return;
      }
    }

    this.transacaoAtiva.alimentosRetirados[idAlimento] = proximoValor;
    window.appState.notificar();
  },

  finalizarTransacao() {
    const cidadao = window.appState.obterCidadao(this.transacaoAtiva.cpfCidadao);

    let kgAlimentoGerado = 0;
    Object.entries(this.transacaoAtiva.reciclaveis).forEach(([id, qtd]) => {
      const taxa = window.appState.banco.taxasConversao.find(r => r.id === id);
      if (taxa && taxa.kgPorKgAlimento > 0) kgAlimentoGerado += (qtd / taxa.kgPorKgAlimento);
    });

    let kgAlimentoGasto = 0;
    Object.values(this.transacaoAtiva.alimentosRetirados).forEach(qtd => kgAlimentoGasto += qtd);

    if (kgAlimentoGerado === 0 && kgAlimentoGasto === 0) {
      window.utilitarios.mostrarNotificacao('Preencha os recicláveis pesados ou os alimentos retirados.', 'warning');
      return;
    }

    const tx = {
      id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      dataHora: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      cpfCidadao: cidadao.cpf,
      nomeCidadao: cidadao.nome,
      bairro: cidadao.bairro,
      idCaminhao: this.transacaoAtiva.idCaminhaoSelecionado,
      reciclaveis: { ...this.transacaoAtiva.reciclaveis },
      kgAlimentoGerado,
      alimentosRetirados: { ...this.transacaoAtiva.alimentosRetirados },
      kgAlimentoGasto
    };

    window.appState.adicionarTransacao(tx);

    this.transacaoAtiva.reciclaveis = { plastico: 0, papelao: 0, vidro: 0, metal: 0, oleo: 0, pneu: 0 };
    this.transacaoAtiva.alimentosRetirados = { tomate: 0, batata: 0, cenoura: 0, maca: 0, alface: 0, ovos: 0 };

    const conteinerRecibo = document.getElementById('receipt-modal-content');
    if (conteinerRecibo) {
      conteinerRecibo.innerHTML = window.utilitarios.gerarHtmlRecibo(tx);
    }
    window.utilitarios.abrirModal('receipt-modal');
    window.utilitarios.mostrarNotificacao(`Troca ${tx.id} registrada e sincronizada com sucesso!`, 'success');
  },

  // Aliases para retrocompatibilidade
  selectTruck(id) { this.selecionarCaminhao(id); },
  selectCitizen(cpf) { this.selecionarCidadao(cpf); },
  updateRecyclableWeight(id, val) { this.atualizarPesoReciclavel(id, val); },
  changeFoodQty(id, delta) { this.alterarQtdAlimento(id, delta); },
  finishTransaction() { this.finalizarTransacao(); }
};

window.operatorComponent = window.componenteOperador;
