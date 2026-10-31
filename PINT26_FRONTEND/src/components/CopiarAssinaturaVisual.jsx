import React from 'react';
import { useTranslation } from 'react-i18next';
import { copyVisualAction } from '../utils/signatureHelper';
import Swal from 'sweetalert2';

export default function CopiarAssinaturaVisual({ 
  nome, 
  cargo, 
  selectedSl, 
  email, 
  telemovel, 
  telefoneFixo, 
  activeBadges, 
  userId,
  className = "btn btn-outline-primary w-100",
  style = { borderRadius: '8px', padding: '10px' }
}) {
  const { t } = useTranslation();

  const handleCopy = async () => {
    try {
      await copyVisualAction({
        nome,
        cargo,
        selectedSl,
        email,
        telemovel,
        telefoneFixo,
        activeBadges,
        userId
      });

      Swal.fire({
        icon: 'success',
        title: t('copied', 'Copiado!'),
        text: t('signatureVisualCopied', 'Assinatura copiada! Pode colá-la diretamente nas definições do Outlook.'),
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Erro ao copiar visualmente:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: t('copyVisualError', 'Por favor, selecione e copie a assinatura manualmente a partir da caixa de pré-visualização.')
      });
    }
  };

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={handleCopy}
    >
      {t('copyVisualBtn', '📋 Copiar Assinatura (Visual)')}
    </button>
  );
}
