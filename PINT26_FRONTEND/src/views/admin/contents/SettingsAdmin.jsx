import { useState } from 'react';
import Swal from 'sweetalert2';

export default function SettingsAdmin() {
  const [rgpdText, setRgpdText] = useState(
    'Ao aceitar estes termos, autorizo a Softinsa a proceder ao tratamento dos meus dados pessoais fornecidos nesta plataforma (incluindo nome, email, avatar, percurso profissional e progresso de badges) para efeitos de gestão e atribuição de competências. Tenho direito ao acesso, retificação e oposição dos meus dados nos termos da legislação RGPD em vigor.'
  );
  
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [forceChangePass, setForceChangePass] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    Swal.fire({
      icon: 'success',
      title: 'Definições Gerais Guardadas',
      text: 'Todos os parâmetros e políticas de proteção de dados foram gravados.',
      timer: 2000,
      showConfirmButton: false
    });
  };

  return (
    <div className="users-admin-container">
      {/* Title */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Definições Gerais do Sistema</h3>
        <p className="text-muted small mb-0">Configure os parâmetros globais da plataforma, políticas de RGPD e integrações institucionais (Etapa 5)</p>
      </div>

      <form onSubmit={handleSave} className="d-flex flex-column gap-4">
        
        {/* RGPD Policy Card */}
        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
          <h5 className="fw-bold mb-2">Termos e Consentimento RGPD</h5>
          <p className="text-muted small mb-3">Este texto é apresentado aos novos colaboradores aquando do primeiro início de sessão na plataforma.</p>
          <div className="users-form-group">
            <textarea
              className="form-control"
              rows="4"
              value={rgpdText}
              onChange={(e) => setRgpdText(e.target.value)}
              style={{ fontSize: '0.9rem', borderRadius: '8px' }}
            />
          </div>
        </div>

        {/* Security / Sessions Card */}
        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
          <h5 className="fw-bold mb-3">Políticas de Acesso e Segurança</h5>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="users-form-group">
                <label className="text-muted small fw-bold mb-1">Tempo limite de sessão ativa (minutos)</label>
                <input
                  type="number"
                  className="form-control"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  style={{ borderRadius: '8px' }}
                />
              </div>
            </div>
            
            <div className="col-12 col-md-6 d-flex align-items-end pb-2">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="forcePassSwitch"
                  checked={forceChangePass}
                  onChange={(e) => setForceChangePass(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label className="form-check-label small ms-2" htmlFor="forcePassSwitch" style={{ cursor: 'pointer' }}>
                  Forçar alteração de password no primeiro acesso
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SMTP Mail Server Configuration */}
        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
          <h5 className="fw-bold mb-3">Servidor de E-mail (SMTP)</h5>
          <div className="row g-3">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="users-form-group">
                <label className="text-muted small fw-bold mb-1">Servidor SMTP Host</label>
                <input type="text" className="form-control" placeholder="smtp.softinsa.pt" defaultValue="smtp.softinsa.pt" disabled style={{ borderRadius: '8px' }} />
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-2">
              <div className="users-form-group">
                <label className="text-muted small fw-bold mb-1">Porta SMTP</label>
                <input type="number" className="form-control" placeholder="587" defaultValue="587" disabled style={{ borderRadius: '8px' }} />
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="users-form-group">
                <label className="text-muted small fw-bold mb-1">Utilizador Autenticação</label>
                <input type="text" className="form-control" placeholder="noreply@softinsa.pt" defaultValue="noreply@softinsa.pt" disabled style={{ borderRadius: '8px' }} />
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="users-form-group">
                <label className="text-muted small fw-bold mb-1">Segurança de Ligação</label>
                <input type="text" className="form-control" defaultValue="STARTTLS" disabled style={{ borderRadius: '8px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="d-flex justify-content-start">
          <button type="submit" className="btn btn-primary fw-bold px-4 py-2" style={{ borderRadius: '8px' }}>
            Guardar Definições
          </button>
        </div>

      </form>
    </div>
  );
}
