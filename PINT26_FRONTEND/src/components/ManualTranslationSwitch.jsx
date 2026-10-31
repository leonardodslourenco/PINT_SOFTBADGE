import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';

export default function ManualTranslationSwitch({ checked, onChange, disabled, id = 'manualTranslateSwitch' }) {
  const { t } = useTranslation();

  const handleToggle = async (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      const result = await Swal.fire({
        icon: 'info',
        title: t('manualTranslationNoticeTitle', 'Atenção: Tradução Manual'),
        text: t('manualTranslationNoticeText', 'Ao ativar a tradução manual, assume a responsabilidade de preencher os conteúdos nas diferentes línguas (PT, EN, ES). Os campos que deixar em branco utilizarão automaticamente o texto da sua língua nativa.'),
        showCancelButton: true,
        confirmButtonText: t('confirmBtn', 'Entendi, ativar'),
        cancelButtonText: t('cancelBtn', 'Cancelar'),
        confirmButtonColor: '#0d6efd'
      });
      if (result.isConfirmed) {
        onChange(true);
      } else {
        onChange(false);
      }
    } else {
      onChange(false);
    }
  };

  return (
    <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
      <input
        className="form-check-input my-0"
        type="checkbox"
        role="switch"
        id={id}
        checked={checked}
        onChange={handleToggle}
        disabled={disabled}
        style={{ cursor: 'pointer', width: '2.4em', height: '1.2em' }}
      />
      <label className="form-check-label small fw-semibold text-muted mb-0" htmlFor={id} style={{ cursor: 'pointer' }}>
        {t('manualTranslationToggleLabel', '🌐 Tradução Manual')}
      </label>
    </div>
  );
}
