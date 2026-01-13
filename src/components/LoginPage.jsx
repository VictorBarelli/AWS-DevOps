import { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn, signUp, signInWithGoogle } from '../services/supabase';

export default function LoginPage({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Basic validation
        if (!formData.email || !formData.password) {
            setError('Preencha todos os campos');
            setLoading(false);
            return;
        }

        if (!isLogin && !formData.name) {
            setError('Preencha seu nome');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                // Sign in
                const { user, session } = await signIn(formData.email, formData.password);
                onLogin(user, session);
            } else {
                // Sign up
                const { user, session } = await signUp(formData.email, formData.password, formData.name);

                if (!session) {
                    // Email confirmation required
                    setError('Verifique seu email para confirmar o cadastro');
                    setLoading(false);
                    return;
                }

                onLogin(user, session);
            }
        } catch (err) {
            console.error('Auth error:', err);

            // Translate common errors
            if (err.message.includes('Invalid login credentials')) {
                setError('Email ou senha incorretos');
            } else if (err.message.includes('User already registered')) {
                setError('Este email já está cadastrado');
            } else if (err.message.includes('Email not confirmed')) {
                setError('Confirme seu email antes de fazer login');
            } else {
                setError(err.message || 'Erro ao autenticar');
            }

            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            await signInWithGoogle();
            // Supabase will redirect to Google and back
        } catch (err) {
            console.error('Google auth error:', err);
            setError('Erro ao conectar com Google');
            setLoading(false);
        }
    };

    const handleDemoAccess = () => {
        // Demo mode - use localStorage only
        const demoUser = {
            id: 'demo',
            email: 'demo@gameswipe.com',
            user_metadata: { name: 'Visitante' }
        };
        onLogin(demoUser, null);
    };

    return (
        <div className="login-page">
            {/* Background decoration */}
            <div className="login-bg-decoration"></div>

            <motion.div
                className="login-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Logo */}
                <div className="login-logo">
                    <span className="logo-icon">🎮</span>
                    <span className="logo-text">GameSwipe</span>
                </div>

                <p className="login-subtitle">
                    Descubra seu próximo jogo favorito
                </p>

                {/* Google Login Button */}
                <button
                    className="google-btn"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" className="google-icon">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar com Google
                </button>

                {/* Divider */}
                <div className="login-divider">
                    <span>ou</span>
                </div>

                {/* Toggle Login/Register */}
                <div className="auth-toggle">
                    <button
                        className={`auth-toggle-btn ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}
                    >
                        Entrar
                    </button>
                    <button
                        className={`auth-toggle-btn ${!isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(false)}
                    >
                        Criar conta
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    {!isLogin && (
                        <motion.div
                            className="form-group"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <label htmlFor="name">Nome</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Seu nome"
                                value={formData.name}
                                onChange={handleChange}
                                autoComplete="name"
                            />
                        </motion.div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                        />
                    </div>

                    {error && (
                        <motion.div
                            className="form-error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="btn-loading"></span>
                        ) : (
                            isLogin ? 'Entrar' : 'Criar conta'
                        )}
                    </button>
                </form>

                {/* Demo access */}
                <button
                    className="demo-btn"
                    onClick={handleDemoAccess}
                >
                    Continuar sem conta →
                </button>
            </motion.div>

            {/* Footer */}
            <p className="login-footer">
                Feito com 💜 para gamers
            </p>
        </div>
    );
}
