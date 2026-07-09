import { useState } from 'react';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface LoginProps {
  onLogin: (email: string, pass: string) => void;
  error?: string;
}

export function Login({ onLogin, error }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        <div style={{ padding: '32px', textAlign: 'center', borderBottom: '1px solid #27272a', background: 'rgba(24,24,27,0.5)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', marginBottom: '16px', background: '#09090b', border: '1px solid #27272a', borderRadius: '16px', padding: '10px', overflow: 'hidden' }}>
            <img src={logoImg} alt="OWN Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#f4f4f5', textTransform: 'uppercase', fontStyle: 'italic' }}>
            OWN <span style={{ color: 'var(--brand)' }}>- TV & PARCERIAS</span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '8px' }}>Painel Administrativo</p>
        </div>
        
        <div style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', fontSize: '0.8rem', color: '#f87171', textAlign: 'center', fontWeight: 600 }}>
                {error}
              </div>
            )}
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#d4d4d8', marginBottom: '6px' }}>
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '10px 16px', color: '#f4f4f5', fontSize: '0.875rem', outline: 'none' }}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#d4d4d8', marginBottom: '6px' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '10px 40px 10px 16px', color: '#f4f4f5', fontSize: '0.875rem', outline: 'none' }}
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--brand)', color: 'white', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px', boxShadow: '0 10px 15px -3px rgba(200,169,126,0.2)' }}
            >
              <LogIn size={16} />
              Entrar no Painel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
