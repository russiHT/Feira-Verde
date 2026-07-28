/* FeiraVerde Digital - Componente do Portal do Cidadão */

window.componenteCidadao = {
  pesosCalculadora: { plastico: 5, papelao: 5, vidro: 0, oleo: 2 },

  render(banco) {
    const cidadao = window.appState.obterCidadao(window.appState.cpfCidadaoAtivo);

    let simularKgAlimento = 0;
    Object.entries(this.pesosCalculadora).forEach(([id, val]) => {
      const taxa = banco.taxasConversao.find(r => r.id === id);
      if (taxa && taxa.kgPorKgAlimento > 0) {
        simularKgAlimento += (val / taxa.kgPorKgAlimento);
      }
    });

    return `
      <!-- Banner de Notificações Urgentes para Cidadãos -->
      ${banco.alertasUrgentes.length > 0 ? `
        <div class="urgent-banner" style="margin-bottom: 24px; border-radius: var(--raio-m);">
          <div class="urgent-banner-content">
            <span class="urgent-banner-tag">AVISO URGENTE</span>
            <div>
              <strong>${banco.alertasUrgentes[0].titulo}</strong> — ${banco.alertasUrgentes[0].mensagem}
            </div>
          </div>
          <span style="font-size:0.75rem; opacity:0.8;">${banco.alertasUrgentes[0].dataHora}</span>
        </div>
      ` : ''}

      <!-- Cartão de Perfil do Cidadão Gov.br -->
      <div class="card" style="background: linear-gradient(135deg, rgba(0, 71, 187, 0.2), rgba(15, 23, 42, 0.9)); border: 1px solid rgba(0, 71, 187, 0.4); margin-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="width:60px; height:60px; border-radius:50%; background:#0047bb; color:#fff; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:800; box-shadow: 0 4px 14px rgba(0,71,187,0.5);">
              <i class="fa-solid fa-user"></i>
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <h2 style="font-size: 1.3rem; margin:0;">${cidadao.nome}</h2>
                <span class="gov-badge"><i class="fa-solid fa-circle-check"></i> Conta Gov.br Prata</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--cor-texto-secundario); margin-top:4px;">
                CPF: ***.${cidadao.cpf.substr(4,7)}-** | Bairro: <strong>${cidadao.bairro}</strong>
              </p>
            </div>
          </div>

          <div style="display:flex; gap:20px; align-items:center;">
            <div style="text-align:right;">
              <div style="font-size:0.8rem; color:var(--cor-texto-secundario);">Saldo de Alimento Disponível</div>
              <div class="coin-badge" style="background: linear-gradient(135deg, #10b981, #059669); font-size:1.2rem; padding: 8px 18px;">
                <i class="fa-solid fa-basket-shopping"></i> ${cidadao.saldoAlimentoKg.toFixed(1)} kg
              </div>
            </div>

            <div style="text-align:right;">
              <div style="font-size:0.8rem; color:var(--cor-texto-secundario);">Total Já Reciclado</div>
              <div style="font-family:var(--fonte-titulo); font-size:1.3rem; font-weight:800; color:var(--cor-primaria);">
                ${cidadao.totalRecicladoKg.toFixed(1)} kg
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Calculadora Verde (Simulador de Troca) -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fa-solid fa-calculator"></i> Calculadora Verde (Simule sua Troca)</h3>
            <span class="badge badge-success">Sua Estimativa: +${simularKgAlimento.toFixed(1)} kg Alimento</span>
          </div>

          <p style="font-size: 0.85rem; color: var(--cor-texto-secundario); margin-bottom: 20px;">
            Insira a quantidade de recicláveis que você tem em casa e veja quantos kg de alimentos frescos poderá retirar no caminhão!
          </p>

          <div style="display:flex; flex-direction:column; gap:16px; margin-bottom: 20px;">
            ${banco.taxasConversao.map(taxa => `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom: 4px;">
                  <span><i class="fa-solid ${taxa.icone}"></i> ${taxa.nome}</span>
                  <strong>${this.pesosCalculadora[taxa.id] || 0} ${taxa.unidade}</strong>
                </div>
                <input type="range" min="0" max="30" step="0.5" 
                  value="${this.pesosCalculadora[taxa.id] || 0}" 
                  style="width:100%; accent-color: var(--cor-primaria);"
                  oninput="window.componenteCidadao.atualizarSimulacao('${taxa.id}', this.value)">
              </div>
            `).join('')}
          </div>

          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--cor-borda-destaque); padding: 16px; border-radius: var(--raio-m); text-align: center;">
            <div style="font-size:0.85rem; color:var(--cor-texto-secundario);">Com essa quantidade, você receberá aproximadamente:</div>
            <div style="font-family:var(--fonte-titulo); font-size:1.6rem; font-weight:800; color:var(--cor-primaria); margin:6px 0;">
              <i class="fa-solid fa-basket-shopping"></i> ~${simularKgAlimento.toFixed(1)} kg de Alimentos Frescos
            </div>
            <div style="font-size:0.75rem; color:var(--cor-texto-secundario);">
              (Frutas, Legumes, Verduras ou Ovos de Granja)
            </div>
          </div>
        </div>

        <!-- Itinerário & Localização ao Vivo -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fa-solid fa-map-pin"></i> Itinerário & Localização dos Caminhões</h3>
            <span class="badge badge-info"><i class="fa-solid fa-location-arrow"></i> Ao Vivo</span>
          </div>

          <p style="font-size:0.85rem; color:var(--cor-texto-secundario); margin-bottom:16px;">
            Acompanhe o percurso em tempo real. Os horários são atualizados dinamicamente pelo motorista.
          </p>

          <div style="display:flex; flex-direction:column; gap:12px;">
            ${banco.caminhoes.map(caminhao => {
              let badgeStatus = '';
              if (caminhao.status === 'EM_ANDAMENTO') badgeStatus = '<span class="badge badge-success"><i class="fa-solid fa-truck"></i> No Ponto Agora</span>';
              else if (caminhao.status === 'ATRASADO_CHUVA') badgeStatus = '<span class="badge badge-danger"><i class="fa-solid fa-cloud-showers-heavy"></i> Pausado por Chuva</span>';
              else badgeStatus = '<span class="badge badge-warning"><i class="fa-solid fa-calendar"></i> Próxima Parada</span>';

              const ehBairroDoUsuario = caminhao.bairro.includes(cidadao.bairro);

              return `
                <div style="background: ${ehBairroDoUsuario ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 23, 42, 0.6)'}; border: 1px solid ${ehBairroDoUsuario ? 'var(--cor-borda-destaque)' : 'var(--cor-borda)'}; padding: 14px; border-radius: var(--raio-m);">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                      <strong style="font-size:0.95rem; color:#fff;">${caminhao.bairro}</strong>
                      ${ehBairroDoUsuario ? '<span class="badge badge-success" style="margin-left:6px; font-size:0.65rem;">Seu Bairro</span>' : ''}
                      <div style="font-size:0.8rem; color:var(--cor-texto-secundario); margin-top:2px;">
                        <i class="fa-solid fa-location-dot" style="color:var(--cor-primaria);"></i> ${caminhao.localizacao}
                      </div>
                    </div>
                    ${badgeStatus}
                  </div>
                  <div style="margin-top:8px; font-size:0.8rem; color:var(--cor-texto-secundario); display:flex; justify-content:space-between;">
                    <span>Horário Previsto: <strong>${caminhao.horarioAgendado}</strong></span>
                    <span>Motorista: ${caminhao.motorista}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  atualizarSimulacao(idTaxa, val) {
    this.pesosCalculadora[idTaxa] = parseFloat(val) || 0;
    window.appState.notificar();
  },

  // Aliases para retrocompatibilidade
  updateSim(id, val) { this.atualizarSimulacao(id, val); }
};

window.citizenComponent = window.componenteCidadao;
