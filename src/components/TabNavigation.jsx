import { motion } from 'framer-motion';

export default function TabNavigation({ activeTab, onTabChange, matchCount = 0 }) {
    const tabs = [
        { id: 'home', icon: '🔥', label: 'Explorar' },
        { id: 'likes', icon: '💚', label: 'Curtidas', badge: matchCount },
        { id: 'reviews', icon: '⭐', label: 'Reviews' },
        { id: 'filters', icon: '🎯', label: 'Filtros' }
    ];

    return (
        <nav className="tab-navigation">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    <div className="tab-icon">
                        <span>{tab.icon}</span>
                        {tab.badge > 0 && (
                            <motion.span
                                className="tab-badge"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500 }}
                            >
                                {tab.badge > 99 ? '99+' : tab.badge}
                            </motion.span>
                        )}
                    </div>
                    <span className="tab-label">{tab.label}</span>
                    {activeTab === tab.id && (
                        <motion.div
                            className="tab-indicator"
                            layoutId="tab-indicator"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    )}
                </button>
            ))}
        </nav>
    );
}
