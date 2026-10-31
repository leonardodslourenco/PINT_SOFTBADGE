import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

export default function AreaAtuacao({ selectedAreaId, onChange, layout = 'grid' }) {
  const { t } = useTranslation();

  const [learningPaths, setLearningPaths] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);
  const [areas, setAreas] = useState([]);

  const [selectedLp, setSelectedLp] = useState('');
  const [selectedSl, setSelectedSl] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [loading, setLoading] = useState(true);

  // Carregar dados de LPs, SLs e Áreas (apenas uma vez na montagem)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [resLp, resSl, resArea] = await Promise.all([
          api.get('/learning_path?ativo=true'),
          api.get('/service_line?ativo=true'),
          api.get('/area?ativo=true')
        ]);

        const listLp = resLp.data?.success ? resLp.data.data : [];
        const listSl = resSl.data?.success ? resSl.data.data : [];
        const listArea = resArea.data?.success ? resArea.data.data : [];

        setLearningPaths(listLp);
        setServiceLines(listSl);
        setAreas(listArea);
      } catch (err) {
        console.error('Erro ao carregar dados de área de atuação:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Se a prop selectedAreaId mudar externamente (por exemplo ao trocar de utilizador editado)
  useEffect(() => {
    if (areas.length > 0) {
      if (selectedAreaId) {
        const targetArea = areas.find(a => String(a.id_area) === String(selectedAreaId));
        if (targetArea) {
          setSelectedArea(String(selectedAreaId));
          const targetSL = serviceLines.find(s => String(s.id_service_line) === String(targetArea.id_service_line));
          if (targetSL) {
            setSelectedSl(String(targetSL.id_service_line));
            setSelectedLp(String(targetSL.id_learning_path));
          }
        }
      } else {
        setSelectedLp('');
        setSelectedSl('');
        setSelectedArea('');
      }
    }
  }, [selectedAreaId, areas, serviceLines]);

  const handleLpChange = (val) => {
    setSelectedLp(val);
    setSelectedSl('');
    setSelectedArea('');
    if (onChange) onChange('');
  };

  const handleSlChange = (val) => {
    setSelectedSl(val);
    setSelectedArea('');
    if (onChange) onChange('');
  };

  const handleAreaChange = (val) => {
    setSelectedArea(val);
    if (onChange) onChange(val);
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2 p-1">
        <div className="users-spinner-sm" />
        <span className="text-muted small">A carregar área de atuação...</span>
      </div>
    );
  }

  // Determinar a classe de coluna com base no layout solicitado
  const colClass = layout === 'stack' ? 'col-12' : 'col-12 col-md-4';

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

      {/* Área */}
      <div className={colClass}>
        <div className="users-form-group">
          <label className="text-muted small fw-bold mb-1">{t('areaLabel', 'Área')}</label>
          <select
            className="form-select"
            value={selectedArea}
            onChange={(e) => handleAreaChange(e.target.value)}
            disabled={!selectedSl}
            style={{ borderRadius: '8px', backgroundColor: 'var(--panel)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
          >
            <option value="">{t('selectAreaOption', 'Selecione a Área')}</option>
            {areas
              .filter(a => String(a.id_service_line) === String(selectedSl))
              .map(a => (
                <option key={a.id_area} value={a.id_area}>
                  {a.area || a.titulo}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
}
