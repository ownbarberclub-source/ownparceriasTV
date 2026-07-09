import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { User } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { LogOut } from 'lucide-react';
import logoImg from './assets/logo.png';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      setAuthLoading(true);
      const params = new URLSearchParams(window.location.search);
      const hubUser = params.get('hub_user');
      const hubPass = params.get('hub_pass');
      const hubToken = params.get('hub_token');

      // 1. Autenticação por relay de senha
      if (hubUser && hubPass) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email: hubUser, password: hubPass });
          if (!error && data.user) {
            const { data: profile } = await supabase.from('hub_profiles').select('*').eq('id', data.user.id).single();
            if (profile && profile.is_active !== false) {
              const { data: permission } = await supabase
                .from('hub_permissions').select('*')
                .eq('user_id', profile.id).eq('site_id', 'site-tv-parcerias').maybeSingle();

              cleanUrlParams();
              setCurrentUser({
                id: profile.id,
                name: profile.name || hubUser.split('@')[0],
                email: hubUser,
                isAdmin: profile.role === 'admin' || permission?.role === 'administrador'
              });
              setAuthLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('Erro no SSO:', e);
        }
      }

      // 2. Verifica sessão do Supabase
      const { data: { session } } = await supabase.auth.getSession();

      // 3. Fallback com token relay
      if (!session?.user && hubUser && hubToken) {
        try {
          const decoded = JSON.parse(atob(hubToken));
          if (decoded.uid && decoded.exp > Date.now()) {
            const { data: profile } = await supabase.from('hub_profiles').select('*').eq('id', decoded.uid).single();
            if (profile && profile.is_active !== false) {
              const { data: permission } = await supabase
                .from('hub_permissions').select('*')
                .eq('user_id', profile.id).eq('site_id', 'site-tv-parcerias').maybeSingle();

              cleanUrlParams();
              setCurrentUser({
                id: profile.id,
                name: profile.name || hubUser.split('@')[0],
                email: hubUser,
                isAdmin: profile.role === 'admin' || permission?.role === 'administrador'
              });
              setAuthLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('Erro no Token Relay:', e);
        }
      }

      // 4. Se tiver sessão ativa, puxa perfil
      if (session?.user) {
        try {
          const { data: profile } = await supabase.from('hub_profiles').select('*').eq('id', session.user.id).single();
          if (profile && profile.is_active !== false) {
            const { data: permission } = await supabase
              .from('hub_permissions').select('*')
              .eq('user_id', session.user.id).eq('site_id', 'site-tv-parcerias').maybeSingle();

            cleanUrlParams();
            setCurrentUser({
              id: session.user.id,
              name: profile.name || session.user.email?.split('@')[0] || 'Usuário',
              email: session.user.email || '',
              isAdmin: profile.role === 'admin' || permission?.role === 'administrador'
            });
          }
        } catch (e) {
          console.error('Erro ao buscar perfil do usuário:', e);
        }
      }

      setAuthLoading(false);
    };

    initAuth();
  }, []);

  const cleanUrlParams = () => {
    const url = new URL(window.location.href);
    ['hub_user', 'hub_pass', 'hub_role', 'hub_token', 'hub_name', 'view'].forEach(p => url.searchParams.delete(p));
    try { window.history.replaceState({}, '', url.toString()); } catch { /* ignore */ }
  };

  const handleLogin = async (email: string, pass: string) => {
    setLoginError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) { setLoginError('E-mail ou senha incorretos.'); return; }

      if (data.user) {
        const { data: profile } = await supabase.from('hub_profiles').select('*').eq('id', data.user.id).single();
        if (!profile || profile.is_active === false) {
          setLoginError('Sua conta está inativa ou você não tem permissão de acesso.');
          await supabase.auth.signOut();
          return;
        }

        const { data: permission } = await supabase
          .from('hub_permissions').select('*')
          .eq('user_id', data.user.id).eq('site_id', 'site-tv-parcerias').maybeSingle();

        if (profile.role !== 'admin' && !permission) {
          setLoginError('Você não possui permissão para acessar este sistema.');
          await supabase.auth.signOut();
          return;
        }

        setCurrentUser({
          id: data.user.id,
          name: profile.name || data.user.email?.split('@')[0] || 'Usuário',
          email: data.user.email || '',
          isAdmin: profile.role === 'admin' || permission?.role === 'administrador'
        });
      }
    } catch {
      setLoginError('Ocorreu um erro ao realizar o login.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // Loading
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#71717a', fontSize: '0.85rem' }}>Carregando sessão...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  // Login
  if (!currentUser) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  // Painel Admin
  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ background: '#18181b', borderBottom: '1px solid #27272a', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: '#09090b', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #27272a', padding: '6px', overflow: 'hidden' }}>
              <img src={logoImg} alt="OWN Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1 style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#f4f4f5', textTransform: 'uppercase', fontStyle: 'italic' }}>
              OWN <span style={{ color: 'var(--brand)' }}>- TV & PARCERIAS</span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
              Olá, <strong style={{ color: '#d4d4d8' }}>{currentUser.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              style={{ padding: '8px', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', borderRadius: '8px' }}
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <main style={{ padding: '32px 0' }}>
        <AdminDashboard />
      </main>
    </div>
  );
}
