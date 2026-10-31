import { useState } from 'react';
import Swal from 'sweetalert2';

export default function SlaAdmin() {
  const [tmSla, setTmSla] = useState(5);
  const [sllSla, setSllSla] = useState(3);
  const [sendReminder, setSendReminder] = useState(true);
  const [reminderHours, setReminderHours] = useState(24);

  const handleSave = (e) => {
    e.preventDefault();
    Swal.fire({
      icon: 'success',
      title: 'Configurações de SLA Guardadas',
      text: 'Os prazos limite de resposta de auditoria foram atualizados com sucesso.',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const slaAlerts = [
    { consultor: 'Marta Queiroz', badge: 'Cloud Computing Practitioner', perfil: 'Talent Manager', diasRestantes: 2, estado: 'warn' },
    { consultor: 'Robson Ribeiro', badge: 'Outsystems Developer Associate', perfil: 'Service Line Leader', diasRestantes: 0, estado: 'danger' },
    { consultor: 'Carlos Garcia', badge: 'Kubernetes Administrator', perfil: 'Talent Manager', diasRestantes: 4, estado: 'ok' }
  ];

  return (
    <div className="users-admin-container">
      {/* Title */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Configuração de Acordo de Nível de Serviço (SLA)</h3>
        <p className="text-muted small mb-0">Defina os tempos regulamentares de resposta limite para auditoria da equipa técnica e de gestão (Etapa 5)</p>
      </div>

      <div className="row g-4">
        {/* Settings Form */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
            <h5 className="fw-bold mb-3">Definir Tempos Limite</h5>
            
            <form onSubmit={handleSave} className="d-flex flex-column gap-3">
              
              <div className="users-form-group">
                <label className="text-muted small fw-bold mb-1">
                  Tempo regulamentar para Pré-Aprovação (Talent Manager): <strong>{tmSla} dias úteis</strong>
                </label>
                <input
                  type="range"
                  className="form-range"
                  min="1"
                  max="15"
                  value={tmSla}
                  onChange={(e) => setTmSla(e.target.value)}
                />
              </div>

              <div className="users-form-group">
                <label className="text-muted small fw-bold mb-1">
                  Tempo regulamentar para Aprovação Final (Service Line Leader): <strong>{sllSla} dias úteis</strong>
                </label>
                <input
                  type="range"
                  className="form-range"
                  min="1"
                  max="10"
                  value={sllSla}
                  onChange={(e) => setSllSla(e.target.value)}
                />
              </div>

              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="sendReminderSwitch"
                  checked={sendReminder}
                  onChange={(e) => setSendReminder(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label className="form-check-label small ms-2" htmlFor="sendReminderSwitch" style={{ cursor: 'pointer' }}>
                  Enviar lembrete por e-mail quando o prazo estiver próximo de expirar
                </label>
              </div>

              {sendReminder && (
                <div className="users-form-group">
                  <label className="text-muted small fw-bold mb-1">Antecedência do lembrete (horas)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={reminderHours}
                    onChange={(e) => setReminderHours(e.target.value)}
                    style={{ borderRadius: '8px', maxWidth: '120px' }}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary fw-bold mt-3 align-self-start px-4" style={{ borderRadius: '8px' }}>
                Guardar Configurações
              </button>

            </form>
          </div>
        </div>

        {/* Real-time SLA Status Monitor */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
            <h5 className="fw-bold mb-3">Monitor de Alertas de SLA (Tempo Real)</h5>
            <p className="text-muted small mb-3">Visualização de candidaturas ativas cujo prazo de validação está a aproximar-se do limite.</p>
            
            <div className="d-flex flex-column gap-3">
              {slaAlerts.map((alert, idx) => (
                <div key={idx} className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between">
                  <div>
                    <strong className="text-dark d-block" style={{ fontSize: '0.9rem' }}>{alert.consultor}</strong>
                    <span className="text-muted small d-block">{alert.badge}</span>
                    <span className="badge bg-secondary-subtle text-secondary small mt-1" style={{ fontSize: '0.7rem' }}>
                      Pendente: {alert.perfil}
                    </span>
                  </div>

                  <div className="text-end">
                    {alert.diasRestantes === 0 ? (
                      <span className="badge bg-danger text-white fw-bold px-2 py-1" style={{ fontSize: '0.75rem' }}>
                        Expirado Hoje
                      </span>
                    ) : alert.estado === 'warn' ? (
                      <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.75rem' }}>
                        Restam {alert.diasRestantes} dias
                      </span>
                    ) : (
                      <span className="badge bg-success text-white fw-bold px-2 py-1" style={{ fontSize: '0.75rem' }}>
                        Restam {alert.diasRestantes} dias
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
