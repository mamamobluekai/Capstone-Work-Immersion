import './NotFound.css';

const NotFound = ({ onNavigate }) => {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <h1>404</h1>
        <p>Page not found</p>
        <a href="#" className="back-home" onClick={() => onNavigate('login')}>Back to Login</a>
      </div>
    </div>
  );
};

export default NotFound;
