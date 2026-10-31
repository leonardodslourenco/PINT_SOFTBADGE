import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const DEFAULT_NOTICES = [
  {
    id: 'notice-1',
    titulo: 'Nova Plataforma SoftBadge Iniciada!',
    mensagem: 'Seja bem-vindo à nova plataforma de progressão por Badges da Softinsa. Submeta as suas evidências para começar a ganhar pontos.',
    categoria: 'Informativo',
    publico: 'Todos',
    importante: true,
    data: '2026-07-01T10:00:00.000Z'
  },
  {
    id: 'notice-2',
    titulo: 'Prazos de Auditoria de Evidências',
    mensagem: 'Recordamos que todas as evidências submetidas até sexta-feira serão avaliadas pelo Talent Manager no ciclo semanal regulamentado pelo SLA.',
    categoria: 'Alerta',
    publico: 'Consultores',
    importante: false,
    data: '2026-07-08T15:30:00.000Z'
  },
  {
    id: 'notice-3',
    titulo: 'Formação Geral sobre AWS e Kubernetes',
    mensagem: 'Próxima formação técnica agendada para dia 25 de Julho. A presença contribui como critério nos badges de Cloud Computing.',
    categoria: 'Evento',
    publico: 'Todos',
    importante: true,
    data: '2026-07-10T09:00:00.000Z'
  }
];

export default function NoticesAdmin() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    mensagem: '',
    categoria: 'Informativo',
    publico: 'Todos',
    importante: false
  });

  // Load from LocalStorage or seed defaults
  useEffect(() => {
    setLoading(true);
    const stored = localStorage.getItem('softbadge_notices');
    if (stored) {
      try {
        setNotices(JSON.parse(stored));
      } catch (e) {
        setNotices(DEFAULT_NOTICES);
      }
    } else {
      localStorage.setItem('softbadge_notices', JSON.stringify(DEFAULT_NOTICES));
      setNotices(DEFAULT_NOTICES);
    }
    setLoading(false);
  }, []);

  const saveToStorage = (updatedNotices) => {
    localStorage.setItem('softbadge_notices', JSON.stringify(updatedNotices));
    setNotices(updatedNotices);
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      titulo: '',
      mensagem: '',
      categoria: 'Informativo',
      publico: 'Todos',
      importante: false
    });
    setShowModal(true);
  };

  const handleOpenEdit = (notice) => {
    setIsEditMode(true);
    setEditingId(notice.id);
    setFormData({
      titulo: notice.titulo,
      mensagem: notice.mensagem,
      categoria: notice.categoria,
      publico: notice.publico,
      importante: notice.importante
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.mensagem.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Preencha os campos obrigatórios (Título e Mensagem).'
      });
      return;
    }

    let updated;
    if (isEditMode) {
      updated = notices.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            titulo: formData.titulo,
            mensagem: formData.mensagem,
            categoria: formData.categoria,
            publico: formData.publico,
            importante: formData.importante
          };
        }
        return item;
      });
      Swal.fire({
        icon: 'success',
        title: 'Aviso Atualizado',
        text: 'O aviso foi guardado com sucesso.',
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      const newNotice = {
        id: `notice-${Date.now()}`,
        titulo: formData.titulo,
        mensagem: formData.mensagem,
        categoria: formData.categoria,
        publico: formData.publico,
        importante: formData.importante,
        data: new Date().toISOString()
      };
      updated = [newNotice, ...notices];
      Swal.fire({
        icon: 'success',
        title: 'Aviso Publicado',
        text: 'Novo aviso publicado com sucesso.',
        timer: 1500,
        showConfirmButton: false
      });
    }

    saveToStorage(updated);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Eliminar Aviso?',
      text: 'Tem a certeza que deseja eliminar este aviso? Esta ação não pode ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, eliminar!',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    const filtered = notices.filter(item => item.id !== id);
    saveToStorage(filtered);
    Swal.fire({
      icon: 'success',
      title: 'Eliminado',
      text: 'Aviso eliminado com sucesso.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="users-admin-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Gestão de Informações e Avisos</h3>
          <p className="text-muted small mb-0">Publique comunicados e notificações globais para os utilizadores da plataforma (Etapa 4)</p>
        </div>
        <button 
          className="btn btn-primary fw-semibold px-3 d-flex align-items-center gap-2" 
          style={{ borderRadius: '8px' }} 
          onClick={handleOpenCreate}
        >
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Publicar Aviso
        </button>
      </div>

      {/* Notices Table */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading">
            <div className="users-spinner" />
            <span>A carregar comunicados...</span>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Aviso / Notícia</th>
                  <th>Categoria</th>
                  <th>Destinatários</th>
                  <th>Importante?</th>
                  <th>Data de Publicação</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {notices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="users-empty-row">Nenhum aviso ou comunicado publicado de momento.</td>
                  </tr>
                ) : (
                  notices.map((notice) => (
                    <tr key={notice.id}>
                      <td style={{ maxWidth: '300px' }}>
                        <strong className="text-dark d-block mb-1">{notice.titulo}</strong>
                        <span className="text-muted small d-block text-truncate" style={{ fontSize: '0.8rem' }}>
                          {notice.mensagem}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          notice.categoria === 'Alerta' ? 'bg-danger-subtle text-danger' :
                          notice.categoria === 'Evento' ? 'bg-info-subtle text-info' :
                          'bg-primary-subtle text-primary'
                        }`} style={{ fontSize: '0.75rem' }}>
                          {notice.categoria}
                        </span>
                      </td>
                      <td>{notice.publico}</td>
                      <td>
                        {notice.importante ? (
                          <span className="text-danger fw-bold small">★ Destaque</span>
                        ) : (
                          <span className="text-muted small">Normal</span>
                        )}
                      </td>
                      <td>{formatDate(notice.data)}</td>
                      <td>
                        <div className="users-actions-cell">
                          <button className="users-action-btn edit" onClick={() => handleOpenEdit(notice)}>
                            Editar
                          </button>
                          <button className="users-action-btn block" onClick={() => handleDelete(notice.id)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Notice Form */}
      {showModal && (
        <>
          <div className="users-modal-overlay" onClick={() => setShowModal(false)} />
          <div className="users-modal" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="users-modal-header">
              <h5>{isEditMode ? 'Editar Aviso' : 'Publicar Novo Aviso'}</h5>
              <button className="users-modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '24px' }}>
              <div className="d-flex flex-column gap-3">
                
                {/* Title */}
                <div className="users-form-group">
                  <label className="text-muted small fw-bold mb-1">Título do Comunicado *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Formação Obrigatória de Segurança de Dados"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                {/* Message */}
                <div className="users-form-group">
                  <label className="text-muted small fw-bold mb-1">Mensagem / Conteúdo *</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Escreva a mensagem completa a apresentar aos utilizadores..."
                    value={formData.mensagem}
                    onChange={(e) => setFormData(prev => ({ ...prev, mensagem: e.target.value }))}
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                <div className="row g-3">
                  {/* Category */}
                  <div className="col-12 col-md-6">
                    <div className="users-form-group">
                      <label className="text-muted small fw-bold mb-1">Categoria *</label>
                      <select
                        className="form-select"
                        value={formData.categoria}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                        style={{ borderRadius: '8px' }}
                      >
                        <option value="Informativo">Informativo</option>
                        <option value="Alerta">Alerta</option>
                        <option value="Evento">Evento</option>
                      </select>
                    </div>
                  </div>
                  {/* Public Target */}
                  <div className="col-12 col-md-6">
                    <div className="users-form-group">
                      <label className="text-muted small fw-bold mb-1">Público Alvo *</label>
                      <select
                        className="form-select"
                        value={formData.publico}
                        onChange={(e) => setFormData(prev => ({ ...prev, publico: e.target.value }))}
                        style={{ borderRadius: '8px' }}
                      >
                        <option value="Todos">Todos</option>
                        <option value="Consultores">Consultores</option>
                        <option value="Managers">Managers</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Highlight toggle */}
                <div className="form-check form-switch mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="noticeImportantSwitch"
                    checked={formData.importante}
                    onChange={(e) => setFormData(prev => ({ ...prev, importante: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <label className="form-check-label small ms-2" htmlFor="noticeImportantSwitch" style={{ cursor: 'pointer' }}>
                    Destacar este aviso com prioridade máxima (Urgente/Notificação)?
                  </label>
                </div>

              </div>

              {/* Form Buttons */}
              <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                <button type="button" className="users-modal-cancel py-2" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="users-modal-submit py-2">
                  {isEditMode ? 'Atualizar' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
