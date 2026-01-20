import { motion } from 'framer-motion';

export default function AdminPanel({ onClose }) {
    return (
        <motion.div
            className="admin-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="admin-panel"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
            >
                {/* Header */}
                <div className="admin-header">
                    <h2>👑 Painel Admin</h2>
                    <button className="admin-close" onClick={onClose}>✕</button>
                </div>

                {/* Content */}
                <div className="admin-content">
                    <div className="admin-placeholder">
                        <p>🚧 Painel Admin em manutenção</p>
                        <p>As funcionalidades de administração serão migradas em breve.</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
