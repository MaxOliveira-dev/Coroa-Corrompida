import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{type: 'info' | 'error', text: string} | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Reconstruct the dummy email from the username, as done during signup.
      // This avoids querying the public profiles table for the email.
      const dummyEmail = `${username.trim().toLowerCase()}@usuario.com`;

      const { error } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password,
      });

      if (error) {
        throw new Error('Nome de usuário ou senha inválidos.');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
        if (!username || !password) {
            throw new Error("Nome de usuário e senha são obrigatórios.");
        }
        
        const trimmedUsername = username.trim();
        if (trimmedUsername.length < 3) {
            throw new Error("O nome de usuário deve ter pelo menos 3 caracteres.");
        }
        if (password.length < 6) {
            throw new Error("A senha deve ter pelo menos 6 caracteres.");
        }

        // Check if username is already taken.
        const checkUserResponse = await supabase
            .from('profiles')
            .select('username')
            .eq('username', trimmedUsername)
            .single();

        if (checkUserResponse.error && checkUserResponse.error.code !== 'PGRST116') { // PGRST116 means no rows found (good)
            throw new Error(`Erro ao verificar nome de usuário: ${checkUserResponse.error.message}`);
        }

        if (checkUserResponse.data) {
            throw new Error('Este nome de usuário já está em uso.');
        }

        // Generate a dummy email for Supabase Auth, as it's required.
        // This won't be used by the user.
        const dummyEmail = `${trimmedUsername.toLowerCase()}@usuario.com`;

        // If username is available, proceed with signup.
        const { error: signUpError } = await supabase.auth.signUp({
            email: dummyEmail,
            password,
            options: {
                data: {
                    username: trimmedUsername
                }
            }
        });

        if (signUpError) {
            throw signUpError;
        }
        setMessage({ type: 'info', text: 'Cadastro realizado com sucesso! Você já pode entrar.' });
        setIsLoginView(true); // Switch to login view after successful signup

    } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center p-4 bg-brand-background">
      <div className="w-full max-w-sm p-8 space-y-6 bg-brand-surface rounded-xl shadow-lg border border-brand-card">
        <h1 className="text-2xl font-bold text-center text-text-light">Coroa Corrompida</h1>
        <p className="text-center text-brand-secondary">{isLoginView ? 'Acesse sua conta para continuar.' : 'Crie sua conta para salvar seu progresso.'}</p>
        
        {message && (
          <div className={`p-3 rounded-md text-sm text-center ${message.type === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
            {message.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={isLoginView ? handleLogin : handleSignup}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text-muted">Nome de usuário</label>
            <input
              id="username"
              className="w-full px-3 py-2 mt-1 text-text-light bg-brand-background border border-slot-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
              type="text"
              value={username}
              required
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Seu nome de usuário"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-muted">Senha</label>
            <input
              id="password"
              className="w-full px-3 py-2 mt-1 text-text-light bg-brand-background border border-slot-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isLoginView ? "current-password" : "new-password"}
            />
          </div>

          <div className="flex flex-col space-y-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full text-md py-2.5 px-5 rounded-lg border-2 border-border-game bg-accent text-accent-text cursor-pointer shadow-button-default active:translate-y-1 active:shadow-button-active hover:bg-accent-hover transition-all duration-100 ease-in-out disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? (isLoginView ? 'Entrando...' : 'Cadastrando...') : (isLoginView ? 'Entrar' : 'Cadastrar')}
            </button>
          </div>
        </form>

        <div className="text-center">
            <button onClick={() => {setIsLoginView(!isLoginView); setMessage(null);}} className="text-sm text-brand-secondary hover:text-brand-primary underline">
                {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
            </button>
        </div>
      </div>
    </div>
  );
}