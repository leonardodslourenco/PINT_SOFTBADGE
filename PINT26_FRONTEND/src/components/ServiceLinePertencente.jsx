import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

/**
 * ServiceLinePertencente
 * ======================
 * Componente com dropdowns de Learning Path e Service Line
 * para definir a Service Line a que o utilizador pertence.
 */
export default function ServiceLinePertencente({ selectedSlId, onChange, layout = 'grid' }) {
  const { t } = useTranslation();

  const [learningPaths, setLearningPaths] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);

  const [selectedLp, setSelectedLp] = useState('');
  const [selectedSl, setSelectedSl] = useState('');
  const [loading, setLoading] = useState(true);

  // Carregar LPs e SLs ativos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [resLp, resSl] = await Promise.all([
          api.get('/learning_path?ativo=true'),
          api.get('/service_line?ativo=true')
        ]);

        const listLp = resLp.data?.success ? resLp.data.data : [];
        const listSl = resSl.data?.success ? resSl.data.data : [];

        setLearningPaths(listLp);
        setServiceLines(listSl);
      } catch (err) {
        console.error('Erro ao carregar dados de Service Line pertencente:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Sincronizar quando selectedSlId mudar externamente
  useEffect(() => {
    if (serviceLines.length > 0) {
      if (selectedSlId) {
        const targetSL = serviceLines.find(s => String(s.id_service_line) === String(selectedSlId));
        if (targetSL) {
          setSelectedSl(String(selectedSlId));
          setSelectedLp(String(targetSL.id_learning_path));
        } else {
          setSelectedSl(String(selectedSlId));
        }
      } else {
        setSelectedLp('');
        setSelectedSl('');
      }
    }
  }, [selectedSlId, serviceLines]);

  const handleLpChange = (val) => {
    setSelectedLp(val);
    setSelectedSl('');
    if (onChange) onChange('');
  };

  const handleSlChange = (val) => {
    setSelectedSl(val);
    if (onChange) onChange(val);
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2 p-1">
        <div className="users-spinner-sm" />
        <span className="text-muted small">A carregar Service Lines...</span>
      </div>
    );
  }

  const colClass = layout === 'stack' ? 'col-12' : 'col-12 col-md-6';

  return (
    <div className="row g-3">
      {/* Learning Path */}
      <div className={colClass}>
        <div className="users-form-group">
          <label className="text-muted small fw-bold mb-1">{t('menuLearningPaths', 'Learning Path')}</label>
          <select
            className="form-select"
            value={selectedLp}
            onChange={(e) => handleLpChange(e.target.value)}
            style={{ borderRadius: '8px', backgroundColor: 'var(--panel)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
          >
            <option value="">{t('selectLPOption', 'Selecione o Learning Path')}</option>
            {learningPaths.map(lp => (
              <option key={lp.id_learning_path} value={lp.id_learning_path}>
                {lp.learning_path}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Service Line */}
      <div className={colClass}>
        <div className="users-form-group">
          <label className="text-muted small fw-bold mb-1">{t('serviceLine', 'Service Line')}</label>
          <select
            className="form-select"
            value={selectedSl}
            onChange={(e) => handleSlChange(e.target.value)}
            disabled={!selectedLp}
            style={{ borderRadius: '8px', backgroundColor: 'var(--panel)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
          >
            <option value="">{t('selectSLOption', 'Selecione a Service Line')}</option>
            {serviceLines
              .filter(sl => String(sl.id_learning_path) === String(selectedLp))
              .map(sl => (
                <option key={sl.id_service_line} value={sl.id_service_line}>
                  {sl.service_line || sl.titulo}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
}
