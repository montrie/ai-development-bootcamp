import '../styles/Navbar.css';

interface NavbarProps {
  title: string;
  onChangePassword?: () => void;
  onLogout: () => void;
  sharingMode?: boolean;
  onShareToggle?: () => void;
}

export default function Navbar({ title, onChangePassword, onLogout, sharingMode, onShareToggle }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-title">{title}</span>
        <div className="navbar-actions">
          {onShareToggle && (
            <button id="share-todos-button" className="navbar-btn" onClick={onShareToggle}>
              {sharingMode ? 'Back' : 'Share Todos'}
            </button>
          )}
          {onChangePassword && (
            <button id="change-password-link" className="navbar-btn" onClick={onChangePassword}>
              Change password
            </button>
          )}
          <button id="logout-button" className="navbar-btn navbar-btn-logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
