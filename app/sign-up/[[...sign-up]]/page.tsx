// app/sign-up/[[...sign-up]]/page.tsx
'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gavel, Eye, EyeOff, Loader2, Building2 } from 'lucide-react';

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [nomeEscritorio, setNomeEscritorio] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validação do formulário
  const validate = () => {
    if (!firstName.trim()) {
      setError('O nome é obrigatório.');
      return false;
    }
    if (!lastName.trim()) {
      setError('O sobrenome é obrigatório.');
      return false;
    }
    if (!emailAddress.trim()) {
      setError('O e-mail é obrigatório.');
      return false;
    }
    if (!password.trim() || password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return false;
    }
    return true;
  };

  // Step 1: Enviar os dados de cadastro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError('');
    if (!validate()) return;

    setIsLoading(true);

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
        unsafeMetadata: {
          nomeEscritorio: nomeEscritorio.trim() || undefined,
        },
      });

      // Enviar verificação por e-mail
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setPendingVerification(true);
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      setError(
        clerkError.errors?.[0]?.message || 'Ocorreu um erro ao criar a conta.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verificar o código de e-mail
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError('');
    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      } else {
        setError('Verifique o código e tente novamente.');
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      setError(
        clerkError.errors?.[0]?.message || 'Código inválido. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Tela de verificação de e-mail
  if (pendingVerification) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gavel className="h-7 w-7 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">
                Legal<span className="text-blue-600">Flow</span>
              </span>
            </div>
            <h1 className="text-xl font-semibold text-slate-800">Verifique seu e-mail</h1>
            <p className="text-sm text-slate-500 mt-1">
              Enviamos um código de verificação para <strong>{emailAddress}</strong>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleVerification} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1.5">
                Código de verificação
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Digite o código de 6 dígitos"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-lg tracking-widest"
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="w-full py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar e entrar'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Tela de cadastro principal
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gavel className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">
              Legal<span className="text-blue-600">Flow</span>
            </span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Crie sua conta</h1>
          <p className="text-sm text-slate-500 mt-1">
            Comece a gerenciar seu escritório de forma inteligente
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome e Sobrenome */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="João"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Sobrenome <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Silva"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Nome do Escritório */}
          <div>
            <label htmlFor="nomeEscritorio" className="block text-sm font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                Nome do Escritório
              </span>
            </label>
            <input
              id="nomeEscritorio"
              type="text"
              value={nomeEscritorio}
              onChange={(e) => setNomeEscritorio(e.target.value)}
              placeholder="Ex: Silva & Associados Advocacia"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-400 mt-1">
              Será exibido no painel. Se não preenchido, usaremos um nome padrão.
            </p>
          </div>

          {/* E-mail */}
          <div>
            <label htmlFor="emailAddress" className="block text-sm font-medium text-slate-700 mb-1.5">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              id="emailAddress"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="joao@escritorio.com.br"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
                required
                minLength={8}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Botão de submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        {/* Link para login */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Já tem uma conta?{' '}
          <Link href="/sign-in" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
