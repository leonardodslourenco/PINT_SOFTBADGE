import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';

export default function HeaderAdmin({ controls }) {
  const { t } = useTranslation();
  const { user } = useAppContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const avatarUrl = user?.avatar 
    ? `http://localhost:3000/uploads/${user.avatar}`
    : null;

  const initials = `${user?.nome?.[0] || 'A'}${user?.apelido?.[0] || 'D'}`.toUpperCase();

  return (
    <div className="top-header">
      <div className="header-left">
        {/* Figma logo is on the sidebar, header left is intentionally kept clean */}
      </div>
      
      <div className="d-flex align-items-center gap-3">
        {/* Notification Bell */}
        <div className="position-relative cursor-pointer text-muted" style={{ padding: '6px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-bell">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="position-absolute translate-middle p-1 bg-danger border border-light rounded-circle" style={{ top: '8px', right: '8px' }}>
            <span className="visually-hidden">New alerts</span>
          </span>
        </div>

        {/* Profile Dropdown */}
        <div className="profile-dropdown-container">
          <div className="profile-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={user?.nome} 
                className="profile-avatar" 
                onError={(e) => { 
                  e.target.style.display = 'none'; 
                  const fb = e.target.nextSibling;
                  if (fb) fb.style.display = 'flex'; 
                }} 
              />
            ) : null}
            <div 
              className="profile-avatar bg-primary text-white d-flex align-items-center justify-content-center fw-bold" 
              style={{ display: avatarUrl ? 'none' : 'flex', fontSize: '0.85rem' }}
            >
              {initials}
            </div>
            
            <div className="profile-info d-none d-sm-flex">
              <span className="profile-name">{user?.nome} {user?.apelido}</span>
              <span className="profile-role">{t('admin')}</span>
            </div>
            
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`profile-chevron ${dropdownOpen ? 'open' : ''}`}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {dropdownOpen && (
            <>
              <div 
                className="position-fixed top-0 bottom-0 start-0 end-0" 
                style={{ zIndex: 1040, background: 'transparent' }} 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="profile-menu-dropdown">
                <div className="px-2 py-1 border-bottom pb-2 mb-2 d-sm-none">
                  <div className="fw-bold">{user?.nome} {user?.apelido}</div>
                  <div className="text-muted small">{t('admin')}</div>
                </div>
                <div className="p-1">
                  <label className="form-label small text-muted mb-2">{t('changeView')}</label>
                  {controls}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}