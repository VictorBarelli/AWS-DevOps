import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { subscribeToPushNotifications, checkSubscriptionStatus, requestNotificationPermission } from '../services/notifications';
import { useTranslation } from 'react-i18next';

export default function SettingsTab({ user, profile, onLogout, onGoBack }) {
    const { t, i18n } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [installStatus, setInstallStatus] = useState('');
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    // Notifications state
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationStatus, setNotificationStatus] = useState('');

    useEffect(() => {
        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(iOS);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        } else if (window.navigator.standalone === true) {
            setIsInstalled(true);
        }

        // Listen for install prompt
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // Check installed
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setInstallStatus('Instalado com sucesso!');
        });

        // Check notification subscription
        checkSubscriptionStatus().then(isSubscribed => {
            setNotificationsEnabled(isSubscribed);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
            return;
        }
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstalled(true);
                setInstallStatus('Instalado com sucesso!');
            } else {
                setInstallStatus('Instalação cancelada');
            }
            setDeferredPrompt(null);
        } else {
            setInstallStatus('Abra o menu do navegador (⋮) e selecione "Instalar app" ou "Adicionar à tela inicial"');
        }
    };

    const handleToggleNotifications = async () => {
        if (notificationsEnabled) {
            // Unsubscribe logic (optional, for now just toggle visual state or clear)
            // unsubscribeFromPushNotifications();
            setNotificationStatus('Desative nas configurações do navegador/sistema.');
            return;
        }

        try {
            setNotificationStatus('Solicitando permissão...');
            await requestNotificationPermission();

            setNotificationStatus('Ativando...');
            await subscribeToPushNotifications();

            setNotificationsEnabled(true);
            setNotificationStatus('Notificações ativadas! 🎉');

            setTimeout(() => setNotificationStatus(''), 3000);
        } catch (error) {
            console.error(error);
            setNotificationStatus('Erro ao ativar: ' + error.message);
            setNotificationsEnabled(false);
        }
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'pt' ? 'en' : 'pt';
        i18n.changeLanguage(newLang);
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
                    ← {t('settings.back')}
                </button>
                <h2>{t('settings.title')}</h2>
            </div>

            <div className="settings-content">
                <div className="settings-section">
                    <h3>{t('settings.account')}</h3>
                    <div className="settings-item">
                        <span className="settings-label">{t('settings.email')}</span>
                        <span className="settings-value">{user?.email || 'Não definido'}</span>
                    </div>
                    <div className="settings-item">
                        <span className="settings-label">{t('settings.name')}</span>
                        <span className="settings-value">{profile?.name || 'Não definido'}</span>
                    </div>
                </div>

                {/* PWA Install Section */}
                <div className="settings-section install-section">
                    <h3>{t('settings.app.title')}</h3>
                    {isInstalled ? (
                        <div className="settings-item">
                            <span className="settings-label">📱 GameSwipe</span>
                            <span className="settings-value installed">{t('settings.app.installed')}</span>
                        </div>
                    ) : (
                        <>
                            <div className="settings-item">
                                <span className="settings-label">{t('settings.app.install_label')}</span>
                                <span className="settings-value">{t('settings.app.install_desc')}</span>
                            </div>
                            <button className="install-app-btn" onClick={handleInstall}>
                                {t('settings.app.install_btn')}
                            </button>

                            {installStatus && (
                                <p className="install-status">{installStatus}</p>
                            )}

                            {showIOSInstructions && (
                                <div className="ios-instructions">
                                    <h4>📱 Como instalar no iPhone:</h4>
                                    <ol>
                                        <li>Toque no botão <strong>Compartilhar</strong> (ícone quadrado com seta ↑)</li>
                                        <li>Role para baixo e toque em <strong>&quot;Adicionar à Tela de Início&quot;</strong></li>
                                        <li>Toque em <strong>&quot;Adicionar&quot;</strong> no canto superior direito</li>
                                    </ol>
                                    <button
                                        className="ios-instructions-close"
                                        onClick={() => setShowIOSInstructions(false)}
                                    >
                                        Entendi!
                                    </button>
                                </div>
                            )}

                            {isIOS && !showIOSInstructions && (
                                <p className="install-hint">
                                    💡 No Safari, use o botão Compartilhar para adicionar à tela inicial
                                </p>
                            )}
                        </>
                    )}
                </div>

                <div className="settings-section">
                    <h3>{t('settings.preferences')}</h3>
                    <div className="settings-item clickable" onClick={handleToggleNotifications}>
                        <span className="settings-label">{t('settings.notifications')}</span>
                        <span className="settings-value">
                            {notificationsEnabled ? t('settings.notifications_on') : t('settings.notifications_off')}
                        </span>
                    </div>
                    {notificationStatus && (
                        <p className="install-status" style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '10px' }}>
                            {notificationStatus}
                        </p>
                    )}

                    <div className="settings-item clickable">
                        <span className="settings-label">{t('settings.theme')}</span>
                        <span className="settings-arrow">→</span>
                    </div>
                    <div className="settings-item clickable" onClick={toggleLanguage}>
                        <span className="settings-label">{t('settings.language')}</span>
                        <div className="settings-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{i18n.language === 'en' ? '🇺🇸 English' : '🇧🇷 Português'}</span>
                            <span className="settings-arrow">→</span>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>{t('settings.about')}</h3>
                    <div className="settings-item">
                        <span className="settings-label">{t('settings.version')}</span>
                        <span className="settings-value">1.1.0</span>
                    </div>
                    <div className="settings-item clickable">
                        <span className="settings-label">{t('settings.terms')}</span>
                        <span className="settings-arrow">→</span>
                    </div>
                    <div className="settings-item clickable">
                        <span className="settings-label">{t('settings.privacy')}</span>
                        <span className="settings-arrow">→</span>
                    </div>
                </div>

                <div className="settings-section danger-section">
                    <button className="settings-logout-btn" onClick={onLogout}>
                        {t('settings.logout')}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
