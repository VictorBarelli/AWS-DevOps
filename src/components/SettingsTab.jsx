import { motion } from 'framer-motion';

export default function SettingsTab({ user, profile, onLogout, onGoBack }) {
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
