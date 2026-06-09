import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart2, Upload, LineChart, MessageSquare, FileDown, Trash2 } from 'lucide-react';
import { clearSession } from '../lib/sessionStore';

const NAV = [
    { to: '/', icon: Upload, label: 'Upload' },
    { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
    { to: '/visualizations', icon: LineChart, label: 'Charts' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/report', icon: FileDown, label: 'Report' },
];

export default function Navbar() {
    const navigate = useNavigate();

    function handleReset() {
        clearSession();
        navigate('/', { replace: true });
    }

    return (
        <nav style={{
            background: 'rgba(13,13,26,0.95)',
            borderBottom: '1px solid var(--border)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 64, gap: 8 }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 32 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart2 size={18} color="white" />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }} className="gradient-text">Analyzr</span>
                </div>

                {/* Links */}
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                    {NAV.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} end={to === '/'}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                                borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500,
                                color: isActive ? '#818cf8' : 'var(--text-secondary)',
                                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                                transition: 'all 0.15s',
                            })}
                        >
                            <Icon size={16} />
                            {label}
                        </NavLink>
                    ))}
                </div>

                {/* Reset */}
                <button onClick={handleReset} title="Start new session"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 13, color: 'var(--rose)', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                    <Trash2 size={14} />
                    Reset
                </button>
            </div>
        </nav>
    );
}
