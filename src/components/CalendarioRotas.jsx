import React, { useState } from 'react';
import { utilitarios } from '../utilitarios';

export function CalendarioRotasComponent({ banco, onReagendar }) {
  const [dataSelecionada, setDataSelecionada] = useState('2026-07-30');
  const [filtroBairro, setFiltroBairro] = useState('TODOS');

  // Eventos de Rotas e Colheitas
  const eventos = [
    { id: 1, data: '2026-07-30', tipo: 'ROTA', idCaminhao: 'CAM-01', bairro: 'Cará-Cará', horario: '14:00 - 17:00', status: 'EM_ANDAMENTO', motorista: 'Carlos Eduardo' },
    { id: 2, data: '2026-07-30', tipo: 'ROTA', idCaminhao: 'CAM-02', bairro: 'Uvaranas', horario: '14:30 - 17:30', status: 'EM_ANDAMENTO', motorista: 'Marcos Vinícius' },
    { id: 3, data: '2026-07-30', tipo: 'COLHEITA', produtor: 'Sítio Sol Nascente', alimento: 'Batata Inglesa', qtdKg: 500, status: 'ENTREGUE' },
    { id: 4, data: '2026-07-31', tipo: 'ROTA', idCaminhao: 'CAM-03', bairro: 'Nova Rússia', horario: '08:30 - 11:30', status: 'AGENDADO', motorista: 'Roberto Alves' },
    { id: 5, data: '2026-07-31', tipo: 'COLHEITA', produtor: 'Cooperativa FrutaSul', alimento: 'Tomate Orgânico', qtdKg: 300, status: 'CONFIRMADO' },
    { id: 6, data: '2026-08-01', tipo: 'ROTA', idCaminhao: 'CAM-04', bairro: 'Oficinas', horario: '09:00 - 12:00', status: 'AGENDADO', motorista: 'Fernando Lima' }
  ];

  const eventosFiltrados = eventos.filter(e => {
    const bateData = e.data === dataSelecionada;
    const bateBairro = filtroBairro === 'TODOS' || (e.bairro && e.bairro.includes(filtroBairro));
    return bateData && bateBairro;
  });

  return (
    <div>
      {/* Cabeçalho do Calendário */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-calendar-days" style={{ color: 'var(--cor-primaria)' }}></i>
              Calendário de Rotas & Colheitas (API Sync)
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginTop: '2px' }}>
              Sincronização em tempo real via API com os caminhões e produtores locais
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => utilitarios.mostrarNotificacao('API de Calendário sincronizada com sucesso!', 'info')}
          >
            <i className="fa-solid fa-rotate"></i> Sincronizar API
          </button>
        </div>
      </div>

      {/* Filtros por Data e Bairro */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0, flex: '1', minWidth: '200px' }}>
            <label className="form-label">Data da Rota / Colheita</label>
            <input
              type="date"
              className="form-control"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0, flex: '1', minWidth: '200px' }}>
            <label className="form-label">Filtrar por Região</label>
            <select
              className="form-control"
              value={filtroBairro}
              onChange={(e) => setFiltroBairro(e.target.value)}
            >
              <option value="TODOS">Todas as Regiões</option>
              <option value="Cará-Cará">Cará-Cará</option>
              <option value="Uvaranas">Uvaranas</option>
              <option value="Nova Rússia">Nova Rússia</option>
              <option value="Oficinas">Oficinas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Eventos do Dia */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <i className="fa-solid fa-clock"></i> Agendamentos para {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR')}
          </h3>
          <span className="badge badge-info">{eventosFiltrados.length} Eventos</span>
        </div>

        {eventosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--cor-texto-secundario)' }}>
            <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}></i>
            <p>Nenhuma rota ou colheita agendada para esta data nesta região.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {eventosFiltrados.map(ev => (
              <div
                key={ev.id}
                style={{
                  background: ev.tipo === 'ROTA' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${ev.tipo === 'ROTA' ? 'var(--cor-borda-destaque)' : 'rgba(245, 158, 11, 0.3)'}`,
                  padding: '14px 18px',
                  borderRadius: 'var(--raio-m)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className={`badge ${ev.tipo === 'ROTA' ? 'badge-success' : 'badge-warning'}`}>
                      <i className={`fa-solid ${ev.tipo === 'ROTA' ? 'fa-truck' : 'fa-wheat-awn'}`}></i> {ev.tipo}
                    </span>
                    <strong style={{ fontSize: '0.95rem' }}>
                      {ev.tipo === 'ROTA' ? `Caminhão ${ev.idCaminhao} — ${ev.bairro}` : `${ev.alimento} (${ev.qtdKg} kg)`}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-secundario)' }}>
                    {ev.tipo === 'ROTA' ? `Horário: ${ev.horario} | Motorista: ${ev.motorista}` : `Produtor: ${ev.produtor}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge ${ev.status === 'EM_ANDAMENTO' ? 'badge-success' : 'badge-info'}`}>
                    {ev.status === 'EM_ANDAMENTO' ? 'Em Rota' : ev.status === 'ENTREGUE' ? 'Concluído' : 'Agendado'}
                  </span>

                  {ev.tipo === 'ROTA' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onReagendar && onReagendar(banco.caminhoes.find(c => c.id === ev.idCaminhao) || banco.caminhoes[0])}
                    >
                      <i className="fa-solid fa-clock-rotate-left"></i> Reagendar Improviso
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
