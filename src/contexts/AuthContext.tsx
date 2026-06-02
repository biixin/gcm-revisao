import { useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { hasSupabaseConfig, supabase, Profile } from '../lib/supabase';
import { AuthContext } from './authContextValue';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (data) setProfile(data);
  }

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => { await fetchProfile(session.user.id); })();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    if (!hasSupabaseConfig) {
      return { error: new Error('Supabase não configurado. Use o acesso como convidado.') };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string, name: string) {
    if (!hasSupabaseConfig) {
      return { error: new Error('Supabase não configurado. Use o acesso como convidado.') };
    }

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || email.split('@')[0] } },
    });
    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name: name || email.split('@')[0],
      });
    }
    return { error };
  }

  async function signOut() {
    if (!hasSupabaseConfig) {
      setSession(null);
      setUser(null);
      setProfile(null);
      return;
    }

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
