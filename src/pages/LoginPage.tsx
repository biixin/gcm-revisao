import { useState } from 'react';
import { Shield, Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

type LoginPageProps = {
  onGuestAccess: () => void;
};

export default function LoginPage({ onGuestAccess }: LoginPageProps) {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const email = `${username}@local.test`;
        const { error } = await signIn(email, password);
        if (error) setError(error.message.includes('Supabase') ? error.message : 'Usuário ou senha incorretos.');
      } else {
        if (!username.trim()) {
          setError('Informe um usuário.');
          setLoading(false);
          return;
        }

        const email = `${username}@local.test`;
        const { error } = await signUp(email, password, username);

        if (error) {
          if (error.message.includes('already registered')) setError('Usuário já cadastrado.');
          else if (error.message.includes('Supabase')) setError(error.message);
          else setError('Erro ao criar conta. Tente novamente.');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-900/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-800/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#1a3a6e] to-[#0d1f3c] border-2 border-[#1e4a8a] flex items-center justify-center shadow-lg shadow-blue-900/30">
              <Shield className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-[#050a14]" />
          </div>
          <h1 className="text-white text-xl font-bold tracking-wide text-center leading-tight">
            GUARDA MUNICIPAL
          </h1>
          <p className="text-blue-400/70 text-xs tracking-widest uppercase mt-1">
            Duque de Caxias
          </p>
        </div>

        <div className="bg-[#0d1a2e] border border-[#1a3050] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-white text-lg font-semibold mb-1">
            {isLogin ? 'Entrar' : 'Criar conta'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {isLogin ? 'Acesse sua área de estudos' : 'Crie sua conta para começar'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-slate-300 text-xs font-medium uppercase tracking-wider">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  required
                  className="w-full bg-[#0a1525] border border-[#1a3050] text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 text-xs font-medium uppercase tracking-wider">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#0a1525] border border-[#1a3050] text-white placeholder-slate-600 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-colors mt-2"
            >
              {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[#1a3050]">
            <button
              onClick={onGuestAccess}
              className="w-full py-3 rounded-xl bg-[#0a1525] border border-[#1a3050] text-slate-300 hover:text-white hover:border-[#2a4060] text-sm font-medium transition-all"
            >
              Acessar como convidado
            </button>
            <p className="text-slate-600 text-xs text-center mt-2">
              Progresso temporário salvo por cookies
            </p>
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center mt-6">
          Sistema de Revisão de Provas — GMDC
        </p>
      </div>
    </div>
  );
}
