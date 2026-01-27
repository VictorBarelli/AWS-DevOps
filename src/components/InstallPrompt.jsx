import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user dismissed the prompt before
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            // Show again after 7 days
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        // Listen for the beforeinstallprompt event
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after 3 seconds of app usage
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if installed
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
        setShowPrompt(false);
    };

    if (isInstalled || !showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="install-prompt-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="install-prompt"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                >
                    <div className="install-prompt-icon">📱</div>
                    <div className="install-prompt-content">
                        <h3>Instalar GameSwipe</h3>
                        <p>Adicione à sua tela inicial para acesso rápido e experiência de app nativo!</p>
                    </div>
                    <div className="install-prompt-actions">
                        <button
                            className="install-btn-dismiss"
                            onClick={handleDismiss}
                        >
                            Agora não
                        </button>
                        <button
                            className="install-btn-confirm"
                            onClick={handleInstall}
                        >
                            Instalar 🚀
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
