import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SettingsTab({ user, profile, onLogout, onGoBack }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [installStatus, setInstallStatus] = useState('');

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for the beforeinstallprompt event
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if installed
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setInstallStatus('Instalado com sucesso!');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            setInstallStatus('Use o menu do navegador para instalar');
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
            setInstallStatus('Instalado com sucesso!');
        } else {
            setInstallStatus('Instalação cancelada');
        }

        setDeferredPrompt(null);
    };

    return (
        <motion.div
            className="tab-content settings-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
        >
            <div className="settings-header">
                <button className="back-btn" onClick={onGoBack}>
                    ← Voltar
                </button>
                <h2>Configurações</h2>
            </div>

            <div className="settings-content">
                <div className="settings-section">
                    <h3>Conta</h3>
                    <div className="settings-item">
                        <span className="settings-label">Email</span>
                        <span className="settings-value">{user?.email || 'Não definido'}</span>
                    </div>
                    <div className="settings-item">
                        <span className="settings-label">Nome</span>
                        <span className="settings-value">{profile?.name || 'Não definido'}</span>
                    </div>
                </div>

                {/* PWA Install Section */}
                <div className="settings-section install-section">
                    <h3>Aplicativo</h3>
                    {isInstalled ? (
                        <div className="settings-item">
                            <span className="settings-label">📱 GameSwipe</span>
                            <span className="settings-value installed">✓ Instalado</span>
                        </div>
                    ) : (
                        <>
                            <div className="settings-item">
                                <span className="settings-label">📱 Instalar App</span>
                                <span className="settings-value">Acesse mais rápido</span>
                            </div>
                            <button className="install-app-btn" onClick={handleInstall}>
                                📲 Instalar GameSwipe
                            </button>
                            {installStatus && (
                                <p className="install-status">{installStatus}</p>
                            )}
                            <p className="install-hint">
                                💡 No iPhone, use Safari e toque em "Compartilhar" → "Adicionar à Tela de Início"
                            </p>
                        </>
                    )}
                </div>

                <div className="settings-section">
                    <h3>Preferências</h3>
                    <div className="settings-item clickable">
                        <span className="settings-label">🔔 Notificações</span>
                        <span className="settings-arrow">→</span>
                    </div>
                    <div className="settings-item clickable">
                        <span className="settings-label">🎨 Tema</span>
                        <span className="settings-arrow">→</span>
                    </div>
                    <div className="settings-item clickable">
                        <span className="settings-label">🌐 Idioma</span>
                        <span className="settings-arrow">→</span>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Sobre</h3>
                    <div className="settings-item">
                        <span className="settings-label">Versão</span>
                        <span className="settings-value">1.0.0</span>
                    </div>
                    <div className="settings-item clickable">
                        <span className="settings-label">📜 Termos de Uso</span>
                        <span className="settings-arrow">→</span>
                    </div>
                    <div className="settings-item clickable">
                        <span className="settings-label">🔒 Política de Privacidade</span>
                        <span className="settings-arrow">→</span>
                    </div>
                </div>

                <div className="settings-section danger-section">
                    <button className="settings-logout-btn" onClick={onLogout}>
                        🚪 Sair da Conta
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
