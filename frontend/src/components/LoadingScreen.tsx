import { useEffect, useState } from 'react';
import { Zap, Database, CheckCircle2, Sparkles } from 'lucide-react';

interface Props {
    phase: 'uploading' | 'analyzing' | 'done';
}

export default function LoadingScreen({ phase }: Props) {
    const [progress, setProgress] = useState(0);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (phase === 'uploading') return Math.min(35, prev + 1);
                if (phase === 'analyzing') return Math.min(85, prev + 0.6);
                if (phase === 'done') return 100;
                return prev;
            });
        }, 80);
        return () => clearInterval(interval);
    }, [phase]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const steps = [
        { key: 'uploading', label: 'Upload', Icon: Zap },
        { key: 'analyzing', label: 'Process', Icon: Database },
        { key: 'done',      label: 'Done',    Icon: CheckCircle2 },
    ];

    const phaseOrder = { uploading: 0, analyzing: 1, done: 2 };
    const currentIdx = phaseOrder[phase];

    const phaseColor = phase === 'done' ? '#22c55e' : '#e8572a';

    const titles = {
        uploading: 'Uploading your data',
        analyzing: 'Running analysis',
        done:      'Complete!',
    };
    const descs = {
        uploading: 'Securing and preparing your files…',
        analyzing: 'Generating charts and intelligence layers…',
        done:      'Your insights are ready.',
    };

    return (
        <div style={{
            width: '100%',
            minHeight: '100vh',
            background: 'linear-gradient(150deg, #0f0e0c 0%, #1a1814 50%, #211d14 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 1.5rem',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Glow orbs */}
            <div style={{
                position: 'absolute', top: '-10%', right: '10%',
                width: 480, height: 480, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(232,87,42,0.10) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-5%', left: '5%',
                width: 360, height: 360, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />

            {/* Card */}
            <div style={{
                width: '100%',
                maxWidth: 560,
                backgroundColor: '#fff',
                borderRadius: 28,
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
                position: 'relative',
                zIndex: 1,
            }}>

                {/* Card header */}
                <div style={{
                    padding: '2.25rem 2.5rem 2rem',
                    borderBottom: '1px solid #e4e3dd',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 18,
                }}>
                    {/* Icon */}
                    <div style={{
                        width: 56, height: 56,
                        borderRadius: 16,
                        backgroundColor: phase === 'done' ? '#f0fdf4' : '#fef0eb',
                        border: `1.5px solid ${phase === 'done' ? 'rgba(34,197,94,0.25)' : 'rgba(232,87,42,0.25)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: `0 4px 16px ${phase === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(232,87,42,0.15)'}`,
                    }}>
                        {phase === 'uploading' && (
                            <Zap size={26} style={{ color: '#e8572a' }} />
                        )}
                        {phase === 'analyzing' && (
                            <Sparkles size={26} style={{ color: '#e8572a', animation: 'pulse 1.6s ease-in-out infinite' }} />
                        )}
                        {phase === 'done' && (
                            <CheckCircle2 size={26} style={{ color: '#22c55e' }} />
                        )}
                    </div>

                    <div>
                        <h1 style={{
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 700,
                            fontSize: '1.625rem',
                            color: '#141412',
                            margin: '0 0 6px',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.2,
                        }}>
                            {titles[phase]}
                        </h1>
                        <p style={{
                            fontSize: '0.9375rem',
                            color: '#9a9891',
                            margin: 0,
                            lineHeight: 1.6,
                            letterSpacing: '0.01em',
                        }}>
                            {descs[phase]}
                        </p>
                    </div>
                </div>

                {/* Progress section */}
                <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #e4e3dd' }}>
                    {/* Labels */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 14,
                    }}>
                        <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            color: '#9a9891',
                        }}>
                            Progress
                        </span>
                        <span style={{
                            fontFamily: 'Syne, sans-serif',
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: phaseColor,
                            letterSpacing: '-0.01em',
                        }}>
                            {Math.round(progress)}%
                        </span>
                    </div>

                    {/* Bar track */}
                    <div style={{
                        height: 8,
                        backgroundColor: '#f0efe9',
                        borderRadius: 999,
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            borderRadius: 999,
                            width: `${progress}%`,
                            background: phase === 'done'
                                ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                                : 'linear-gradient(90deg, #e8572a, #f59e0b)',
                            transition: 'width 0.3s ease',
                            boxShadow: phase === 'done'
                                ? '0 0 12px rgba(34,197,94,0.4)'
                                : '0 0 12px rgba(232,87,42,0.4)',
                        }} />
                    </div>

                    {/* Time elapsed */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 18,
                    }}>
                        <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            color: '#9a9891',
                        }}>
                            Time elapsed
                        </span>
                        <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            color: '#3d3b35',
                            letterSpacing: '0.05em',
                        }}>
                            {formatTime(seconds)}
                        </span>
                    </div>
                </div>

                {/* Step indicators */}
                <div style={{
                    padding: '1.5rem 2.5rem',
                    backgroundColor: '#fafaf8',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 10,
                }}>
                    {steps.map(({ key, label, Icon }, idx) => {
                        const isActive = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;
                        return (
                            <div
                                key={key}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 7,
                                    padding: '10px 0',
                                    borderRadius: 12,
                                    border: `1.5px solid ${
                                        isActive
                                            ? isCurrent && phase !== 'done'
                                                ? 'rgba(232,87,42,0.35)'
                                                : 'rgba(34,197,94,0.30)'
                                            : '#e4e3dd'
                                    }`,
                                    backgroundColor: isActive
                                        ? isCurrent && phase !== 'done'
                                            ? '#fef0eb'
                                            : '#f0fdf4'
                                        : '#f5f4f0',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                <Icon
                                    size={14}
                                    style={{
                                        color: isActive
                                            ? isCurrent && phase !== 'done' ? '#e8572a' : '#16a34a'
                                            : '#c8c7c0',
                                    }}
                                />
                                <span style={{
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.01em',
                                    color: isActive
                                        ? isCurrent && phase !== 'done' ? '#c73f14' : '#166534'
                                        : '#b8b7b0',
                                }}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.92); }
                }
            `}</style>
        </div>
    );
}