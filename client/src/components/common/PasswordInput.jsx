import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './PasswordInput.css';

const PasswordInput = ({ name, value, onChange, required, minLength, placeholder }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-wrapper">
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="password-input"
        autoComplete="off"
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible(!visible)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;
