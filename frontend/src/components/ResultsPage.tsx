import { useState } from 'react';
import {
    MessageSquare,
    ChevronRight,
    BarChart3,
    FileText,
    Download,
    RotateCcw,
    X,
    ZoomIn,
    MessageCircle,
    Sparkles,
    TrendingUp,
    Search,
    ArrowUpRight,
    Rocket,
} from 'lucide-react';
import type { AnalysisResponse, Insight, ChartMetadata, PlaygroundResponse } from '../lib/types';

/* ─────────────────────────────────────────────────────────────
   LAYER CONFIG
───────────────────────────────────────────────────────────── */
const LAYER_CONFIG: Record<
    string,
    {
        bg: string;
        text: string;
        border: string;
        accent: string;
        barBg: string;
        icon: React.ReactNode;
        label: string;
    }
> = {
    descriptive: {
        bg: '#eef2ff',
        text: '#4338ca',
        border: '#6366f1',
        accent: '#312e81',
        barBg: '#6366f1',
        icon: <BarChart3 size={13} />,
        label: 'Descriptive',
    },
    diagnostic: {
        bg: '#fff7ed',
        text: '#c2410c',
        border: '#f97316',
        accent: '#7c2d12',
        barBg: '#f97316',
        icon: <Search size={13} />,
        label: 'Diagnostic',
    },
    predictive: {
        bg: '#f0fdf4',
        text: '#166534',
        border: '#22c55e',
        accent: '#14532d',
        barBg: '#22c55e',
        icon: <TrendingUp size={13} />,
        label: 'Predictive',
    },
    business: {
        bg: '#fdf4ff',
        text: '#86198f',
        border: '#d946ef',
        accent: '#701a75',
        barBg: '#d946ef',
        icon: <Rocket size={13} />,
        label: 'Actionable',
    },
};

/* ─────────────────────────────────────────────────────────────
   INSIGHT CARD
───────────────────────────────────────────────────────────── */
function InsightCard({ insight }: { insight: Insight }) {
    const [expanded, setExpanded] = useState(false);
    const cfg = LAYER_CONFIG[insight.layer] ?? LAYER_CONFIG.descriptive;

    return (
        <div
            onClick={() => setExpanded((p) => !p)}
            style={{
                backgroundColor: cfg.bg,
                border: `1.5px solid ${cfg.border}44`,
                borderRadius: 14,
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(20,20,18,0.05)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(-2px)';
                el.style.boxShadow = '0 8px 24px rgba(20,20,18,0.10)';
            }}
            onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = '0 1px 4px rgba(20,20,18,0.05)';
            }}
        >
            <div
                style={{
                    backgroundColor: cfg.barBg,
                    padding: '5px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                }}
            >
                {cfg.icon}
                {cfg.label}
            </div>

            <div
                style={{
                    padding: '1rem 1.125rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 10,
                }}
            >
                <p
                    style={{
                        fontSize: '0.96rem',
                        fontWeight: 400,
                        lineHeight: 1.7,
                        color: cfg.accent,
                        margin: 0,
                        flex: 1,
                        letterSpacing: '0.01em',
                    }}
                >
                    {insight.business_interpretation}
                </p>
                <ChevronRight
                    size={15}
                    style={{
                        color: cfg.border,
                        flexShrink: 0,
                        marginTop: 3,
                        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}
                />
            </div>

            {expanded && (
                <div style={{ padding: '0 1.125rem 1rem' }}>
                    <div
                        style={{
                            borderRadius: 10,
                            overflow: 'hidden',
                            border: `1px solid ${cfg.border}33`,
                        }}
                    >
                        <div
                            style={{
                                padding: '4px 12px',
                                backgroundColor: `${cfg.barBg}18`,
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                color: cfg.accent,
                            }}
                        >
                            Statistical Breakdown
                        </div>
                        <pre
                            style={{
                                margin: 0,
                                padding: '0.75rem',
                                fontSize: '0.75rem',
                                lineHeight: 1.65,
                                fontFamily: 'monospace',
                                color: cfg.accent,
                                backgroundColor: cfg.bg,
                                overflowX: 'auto',
                            }}
                        >
                            {JSON.stringify(insight.statistical_value, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   ZOOM MODAL
───────────────────────────────────────────────────────────── */
function ZoomModal({
    chart,
    onClose,
    onAskAI,
}: {
    chart: ChartMetadata;
    onClose: () => void;
    onAskAI: (chart: ChartMetadata) => void;
}) {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                backgroundColor: 'rgba(10,10,8,0.72)',
                backdropFilter: 'blur(10px)',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#fff',
                    borderRadius: 24,
                    maxWidth: 940,
                    width: '100%',
                    maxHeight: '92vh',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 40px 100px rgba(20,20,18,0.35)',
                    border: '1px solid #e0dfd9',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        backgroundColor: '#fff',
                        borderBottom: '1px solid #e0dfd9',
                        padding: '1.375rem 2rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 16,
                    }}
                >
                    <div>
                        <h2
                            style={{
                                fontFamily: 'DM Sans, sans-serif',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                color: '#141412',
                                margin: '0 0 8px',
                                letterSpacing: '0.005em',
                                lineHeight: 1.4,
                            }}
                        >
                            {chart.title}
                        </h2>
                        <span
                            style={{
                                display: 'inline-block',
                                padding: '3px 12px',
                                borderRadius: 999,
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                backgroundColor: '#fef0eb',
                                color: '#c73f14',
                                border: '1px solid rgba(232,87,42,0.25)',
                            }}
                        >
                            {chart.plot_type.replace(/_/g, ' ')}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            padding: 9,
                            border: '1.5px solid #e0dfd9',
                            borderRadius: 10,
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            color: '#8a8880',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f3f2ef')
                        }
                        onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')
                        }
                    >
                        <X size={18} />
                    </button>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '2.5rem',
                        backgroundColor: '#fafaf8',
                    }}
                >
                    <img
                        src={chart.image_url}
                        alt={chart.title}
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: 16,
                            border: '1px solid #e0dfd9',
                            boxShadow: '0 4px 16px rgba(20,20,18,0.08)',
                        }}
                    />
                </div>

                {chart.key_observations.length > 0 && (
                    <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #e0dfd9' }}>
                        <p
                            style={{
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                color: '#8a8880',
                                marginBottom: 14,
                            }}
                        >
                            Key Observations
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {chart.key_observations.map((obs, i) => (
                                <li
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        gap: 12,
                                        alignItems: 'flex-start',
                                        fontSize: '0.96rem',
                                        fontWeight: 400,
                                        color: '#3d3b35',
                                        lineHeight: 1.7,
                                        letterSpacing: '0.01em',
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 5,
                                            height: 5,
                                            borderRadius: '50%',
                                            backgroundColor: '#e8572a',
                                            flexShrink: 0,
                                            marginTop: 8,
                                        }}
                                    />
                                    {obs}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 10,
                        padding: '1.25rem 2rem',
                        borderTop: '1px solid #e0dfd9',
                        backgroundColor: '#fafaf8',
                        borderRadius: '0 0 24px 24px',
                    }}
                >
                    <button className="btn-outline" onClick={onClose} style={{ padding: '9px 20px' }}>
                        Close
                    </button>
                    <button
                        className="btn-accent"
                        onClick={() => onAskAI(chart)}
                        style={{ padding: '9px 20px' }}
                    >
                        <MessageCircle size={14} />
                        Ask AI
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   METRIC CARD
───────────────────────────────────────────────────────────── */
function MetricCard({
    label,
    value,
    interpretation,
}: {
    label: string;
    value: string;
    interpretation: string;
}) {
    // Skip rendering if value is a placeholder or suspiciously long
    const isPlaceholder =
        !value ||
        value.length > 40 ||
        value.toLowerCase().includes('not specified') ||
        value.toLowerCase().includes('required') ||
        value.toLowerCase().includes('analysis needed') ||
        value.toLowerCase().includes('n/a');

    if (isPlaceholder) return null;

    return (
        <div
            style={{
                backgroundColor: '#fff',
                border: '1px solid #e8e7e1',
                borderRadius: 16,
                padding: '1.5rem',
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                boxShadow: '0 1px 3px rgba(20,20,18,0.05)',
            }}
            onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = '0 8px 24px rgba(20,20,18,0.10)';
                el.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = '0 1px 3px rgba(20,20,18,0.05)';
                el.style.transform = 'translateY(0)';
            }}
        >
            <p
                style={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: '#b8b7b0',
                    margin: '0 0 10px',
                }}
            >
                {label}
            </p>
            <p
                style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#e8572a',
                    lineHeight: 1.15,
                    margin: '0 0 10px',
                    letterSpacing: '-0.02em',
                }}
            >
                {value}
            </p>
            <p
                style={{
                    fontSize: '0.96rem',
                    fontWeight: 400,
                    color: '#6b6965',
                    lineHeight: 1.7,
                    margin: 0,
                    letterSpacing: '0.01em',
                }}
            >
                {interpretation}
            </p>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────────────────────── */
function SectionHeader({
    icon,
    title,
    subtitle,
    iconBg = '#141412',
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    iconBg?: string;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: iconBg === '#e8572a'
                        ? '0 4px 16px rgba(232,87,42,0.35)'
                        : '0 4px 12px rgba(20,20,18,0.18)',
                }}
            >
                {icon}
            </div>
            <div>
                <h2
                    style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        color: '#141412',
                        margin: 0,
                        lineHeight: 1.3,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {title}
                </h2>
                {subtitle && (
                    <p
                        style={{
                            fontSize: '0.96rem',
                            color: '#7a7975',
                            margin: '4px 0 0',
                            lineHeight: 1.55,
                            letterSpacing: '0.01em',
                            fontWeight: 400,
                        }}
                    >
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   RESULTS PAGE
───────────────────────────────────────────────────────────── */
export default function ResultsPage({
    analysis,
    charts,
    sessionId,
    onReset,
    onAskAI,
}: {
    analysis: AnalysisResponse;
    charts: ChartMetadata[];
    sessionId: string;
    onReset: () => void;
    onAskAI: (prompt: string) => void;
}) {
    const [downloading, setDownloading] = useState(false);
    const [view, setView] = useState<'all' | 'insights' | 'plots' | 'playground'>('all');
    const [zoomedChart, setZoomedChart] = useState<ChartMetadata | null>(null);

    // Playground State
    const [playgroundDataset, setPlaygroundDataset] = useState<string>(analysis.datasets[0]?.filename || '');
    const [playgroundColumns, setPlaygroundColumns] = useState<string[]>([]);
    const [playgroundPrompt, setPlaygroundPrompt] = useState('');
    const [playgroundLoading, setPlaygroundLoading] = useState(false);
    const [playgroundResults, setPlaygroundResults] = useState<PlaygroundResponse[]>([]);

    const handlePlaygroundSubmit = async () => {
        if (!playgroundPrompt.trim() || playgroundColumns.length === 0) return;
        setPlaygroundLoading(true);
        try {
            const { runPlayground } = await import('../lib/api');
            const res = await runPlayground({
                session_id: sessionId,
                dataset: playgroundDataset,
                columns: playgroundColumns,
                prompt: playgroundPrompt
            });
            setPlaygroundResults(prev => [res, ...prev]);
        } catch (err) {
            console.error(err);
        } finally {
            setPlaygroundLoading(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const { buildReportUrl } = await import('../lib/api');
            const url = buildReportUrl(sessionId, 'pdf');
            window.open(url, '_blank');
        } finally {
            setTimeout(() => setDownloading(false), 2000);
        }
    };

    const buildChartPrompt = (chart: ChartMetadata): string =>
        [
            `You are analyzing a visualization from a data intelligence report.`,
            ``,
            `Chart context:`,
            `Title: ${chart.title}`,
            `Plot type: ${chart.plot_type.replace(/_/g, ' ')}`,
            `Dataset: ${chart.dataset}`,
            `Trend: ${chart.trend_direction}`,
            `Statistical significance: ${chart.statistical_significance}`,
            ``,
            `Key observations:`,
            chart.key_observations?.length
                ? chart.key_observations.map((o) => `- ${o}`).join('\n')
                : '- (none provided)',
            ``,
            `Give me:`,
            `1) A concise plain-language summary`,
            `2) The most important insights`,
            `3) Any anomalies or risks`,
            `4) 2-3 practical next questions I should ask`,
        ].join('\n');

    const handleAskAI = (chart: ChartMetadata) => {
        setZoomedChart(null);
        onAskAI(buildChartPrompt(chart));
    };

    const insightSections = [
        { key: 'descriptive' as const },
        { key: 'diagnostic' as const },
        { key: 'predictive' as const },
        { key: 'business' as const },
    ] as const;

    const showInsights = view === 'all' || view === 'insights';
    const showPlots = view === 'all' || view === 'plots';
    const showPlayground = view === 'playground';
    const tabs = ['all', 'insights', 'plots', 'playground'] as const;

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f5f4f0' }}>

            {/* ──────────── HERO HEADER ──────────── */}
            <div
                style={{
                    background: 'linear-gradient(150deg, #0f0e0c 0%, #1a1814 50%, #211d14 100%)',
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: -80,
                        right: '15%',
                        width: 320,
                        height: 320,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(232,87,42,0.12) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: -60,
                        left: '5%',
                        width: 240,
                        height: 240,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }}
                />

                <div
                    style={{
                        maxWidth: 1360,
                        margin: '0 auto',
                        padding: '4rem 3rem 3.5rem',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '2.5rem',
                            marginBottom: '3.5rem',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    padding: '5px 14px',
                                    borderRadius: 999,
                                    backgroundColor: 'rgba(232,87,42,0.15)',
                                    border: '1px solid rgba(232,87,42,0.30)',
                                    width: 'fit-content',
                                }}
                            >
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <h1
                                    style={{
                                        fontFamily: 'Syne, sans-serif',
                                        fontWeight: 700,
                                        fontSize: 'clamp(2.25rem, 4.5vw, 3.375rem)',
                                        lineHeight: 1.15,
                                        letterSpacing: '-0.015em',
                                        color: 'rgba(250,250,248,0.60)',
                                        margin: 0,
                                        display: 'block',
                                    }}
                                >
                                    Intelligence
                                </h1>
                                <h1
                                    style={{
                                        fontFamily: 'Syne, sans-serif',
                                        fontWeight: 700,
                                        fontSize: 'clamp(2.25rem, 4.5vw, 3.375rem)',
                                        lineHeight: 1.15,
                                        letterSpacing: '-0.015em',
                                        margin: 0,
                                        display: 'block',
                                        background: 'linear-gradient(110deg, #e8572a 10%, #f59e0b 85%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        color: 'transparent',
                                    }}
                                >
                                    Report
                                </h1>
                            </div>

                            <p
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '0.8125rem',
                                    color: 'rgba(250,250,248,0.28)',
                                    margin: 0,
                                    letterSpacing: '0.03em',
                                    fontWeight: 400,
                                }}
                            >
                                Session{' '}
                                <span style={{
                                    fontFamily: 'monospace',
                                    color: 'rgba(250,250,248,0.42)',
                                    fontSize: '0.75rem',
                                }}>
                                    {sessionId.substring(0, 16)}…
                                </span>
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', paddingTop: 4 }}>
                            <button
                                onClick={onReset}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '11px 22px',
                                    borderRadius: 12,
                                    border: '1.5px solid rgba(255,255,255,0.16)',
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    color: 'rgba(250,250,248,0.80)',
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease, border-color 0.2s ease',
                                    letterSpacing: '0.01em',
                                }}
                                onMouseEnter={(e) => {
                                    const b = e.currentTarget as HTMLButtonElement;
                                    b.style.backgroundColor = 'rgba(255,255,255,0.12)';
                                    b.style.borderColor = 'rgba(255,255,255,0.28)';
                                }}
                                onMouseLeave={(e) => {
                                    const b = e.currentTarget as HTMLButtonElement;
                                    b.style.backgroundColor = 'rgba(255,255,255,0.06)';
                                    b.style.borderColor = 'rgba(255,255,255,0.16)';
                                }}
                            >
                                <RotateCcw size={15} />
                                New Analysis
                            </button>

                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '11px 22px',
                                    borderRadius: 12,
                                    border: '1.5px solid #c73f14',
                                    backgroundColor: '#e8572a',
                                    color: '#fff',
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    cursor: downloading ? 'not-allowed' : 'pointer',
                                    opacity: downloading ? 0.6 : 1,
                                    transition: 'background 0.2s ease, box-shadow 0.2s ease',
                                    letterSpacing: '0.01em',
                                    boxShadow: '0 4px 20px rgba(232,87,42,0.30)',
                                }}
                                onMouseEnter={(e) => {
                                    if (!downloading) {
                                        const b = e.currentTarget as HTMLButtonElement;
                                        b.style.backgroundColor = '#d14a20';
                                        b.style.boxShadow = '0 8px 32px rgba(232,87,42,0.42)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const b = e.currentTarget as HTMLButtonElement;
                                    b.style.backgroundColor = '#e8572a';
                                    b.style.boxShadow = '0 4px 20px rgba(232,87,42,0.30)';
                                }}
                            >
                                <Download size={15} />
                                {downloading ? 'Preparing…' : 'Download PDF'}
                            </button>
                        </div>
                    </div>

                    {/* Tab switcher */}
                    <div
                        style={{
                            display: 'inline-flex',
                            gap: 2,
                            padding: 5,
                            borderRadius: 14,
                            backgroundColor: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.10)',
                        }}
                    >
                        {tabs.map((t) => (
                            <button
                                key={t}
                                onClick={() => setView(t)}
                                style={{
                                    padding: '8px 24px',
                                    borderRadius: 10,
                                    border: 'none',
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    textTransform: 'capitalize',
                                    cursor: 'pointer',
                                    transition: 'background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease',
                                    backgroundColor: view === t ? '#fafaf8' : 'transparent',
                                    color: view === t ? '#141412' : 'rgba(250,250,248,0.45)',
                                    boxShadow: view === t ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
                                    letterSpacing: '0.01em',
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ──────────── MAIN CONTENT ──────────── */}
            <div
                style={{
                    maxWidth: 1360,
                    margin: '0 auto',
                    padding: '3.5rem 3rem 7rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4rem',
                }}
            >
                {/* ── Dataset Summaries ── */}
                {showInsights && (
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <SectionHeader
                            icon={<FileText size={18} />}
                            title="Summary"
                            subtitle="Executive Overview of Uploaded Datasets"
                        />
                        {analysis.datasets.map((ds, idx) => (
                        <section
                            key={idx}
                            style={{
                                backgroundColor: '#fff',
                                border: '1px solid #e4e3dd',
                                borderRadius: 24,
                                overflow: 'hidden',
                                boxShadow: '0 2px 12px rgba(20,20,18,0.06)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: '1.5rem 2.25rem',
                                    borderBottom: '1px solid #e4e3dd',
                                    backgroundColor: '#fafaf8',
                                }}
                            >
                                <div
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 12,
                                        backgroundColor: '#141412',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        flexShrink: 0,
                                        boxShadow: '0 4px 12px rgba(20,20,18,0.18)',
                                    }}
                                >
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <h3
                                        style={{
                                            fontFamily: 'DM Sans, sans-serif',
                                            fontWeight: 600,
                                            fontSize: '0.9375rem',
                                            color: '#141412',
                                            margin: 0,
                                            letterSpacing: '0.005em',
                                        }}
                                    >
                                        {ds.filename}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: '0.6rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.12em',
                                            color: '#b8b7b0',
                                            margin: '4px 0 0',
                                        }}
                                    >
                                        Dataset Summary
                                    </p>
                                </div>
                            </div>

                            <div style={{ padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <blockquote
                                    style={{
                                        margin: 0,
                                        padding: '1.25rem 1.75rem',
                                        backgroundColor: '#fef0eb',
                                        borderLeft: '3px solid #e8572a',
                                        borderRadius: '0 14px 14px 0',
                                        fontSize: '1.05rem',
                                        fontStyle: 'italic',
                                        fontWeight: 400,
                                        color: '#3d3b35',
                                        lineHeight: 1.8,
                                        letterSpacing: '0.01em',
                                    }}
                                >
                                    {ds.executive_summary}
                                </blockquote>

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                        gap: '1.125rem',
                                    }}
                                >
                                    {ds.core_metrics.map((metric, midx) => (
                                        <MetricCard
                                            key={midx}
                                            label={metric.label}
                                            value={String(metric.value)}
                                            interpretation={metric.interpretation}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>
                    ))}
                    </section>
                )}

                {/* ── Key Insights ── */}
                {showInsights && (
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '2.75rem' }}>
                        <SectionHeader
                            icon={<MessageSquare size={18} />}
                            title="Key Insights"
                            subtitle="AI-generated analysis across four intelligence layers"
                        />

                        {analysis.datasets.map((ds, dsIdx) =>
                            insightSections.map(({ key }) => {
                                const insights = (ds[key as keyof typeof ds] as Insight[]) ?? [];
                                if (!insights.length) return null;
                                const cfg = LAYER_CONFIG[key];

                                return (
                                    <div
                                        key={`${dsIdx}-${key}`}
                                        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                                    >
                                        <div
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '8px 16px',
                                                borderRadius: 12,
                                                backgroundColor: cfg.bg,
                                                border: `1.5px solid ${cfg.border}40`,
                                                width: 'fit-content',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontFamily: 'Syne, sans-serif',
                                                    fontWeight: 700,
                                                    fontSize: '0.875rem',
                                                    color: cfg.accent,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.07em',
                                                }}
                                            >
                                                {cfg.label} Insights
                                            </span>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '2px 10px',
                                                    borderRadius: 999,
                                                    fontSize: '0.6rem',
                                                    fontWeight: 700,
                                                    backgroundColor: `${cfg.barBg}20`,
                                                    color: cfg.text,
                                                }}
                                            >
                                                {insights.length}
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                                gap: '1rem',
                                            }}
                                        >
                                            {insights.map((insight, i) => (
                                                <InsightCard key={i} insight={insight} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </section>
                )}

                {/* ── Charts & Visualizations ── */}
                {showPlots && charts.length > 0 && (
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <SectionHeader
                            icon={<BarChart3 size={18} />}
                            title="Charts & Visualizations"
                            subtitle={`${charts.length} data visualizations generated`}
                            iconBg="#e8572a"
                        />

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                                gap: '1.375rem',
                            }}
                        >
                            {charts.map((chart, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e4e3dd',
                                        borderRadius: 20,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxShadow: '0 1px 4px rgba(20,20,18,0.06)',
                                        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        const el = e.currentTarget as HTMLDivElement;
                                        el.style.transform = 'translateY(-4px)';
                                        el.style.boxShadow = '0 16px 40px rgba(20,20,18,0.12)';
                                        el.style.borderColor = 'rgba(232,87,42,0.30)';
                                    }}
                                    onMouseLeave={(e) => {
                                        const el = e.currentTarget as HTMLDivElement;
                                        el.style.transform = 'translateY(0)';
                                        el.style.boxShadow = '0 1px 4px rgba(20,20,18,0.06)';
                                        el.style.borderColor = '#e4e3dd';
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '1.125rem 1.375rem',
                                            borderBottom: '1px solid #e4e3dd',
                                            backgroundColor: '#fafaf8',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3
                                                style={{
                                                    fontFamily: 'DM Sans, sans-serif',
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem',
                                                    color: '#141412',
                                                    margin: '0 0 7px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    letterSpacing: '0.005em',
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {chart.title}
                                            </h3>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '3px 10px',
                                                    borderRadius: 999,
                                                    fontSize: '0.6rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.1em',
                                                    backgroundColor: '#fef0eb',
                                                    color: '#c73f14',
                                                    border: '1px solid rgba(232,87,42,0.20)',
                                                }}
                                            >
                                                {chart.plot_type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <ArrowUpRight
                                            size={15}
                                            style={{ color: '#c8c7c0', flexShrink: 0, marginTop: 2 }}
                                        />
                                    </div>

                                    <div
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '1.5rem',
                                            backgroundColor: '#fff',
                                            minHeight: 210,
                                        }}
                                    >
                                        <img
                                            src={chart.image_url}
                                            alt={chart.title}
                                            style={{
                                                maxWidth: '100%',
                                                height: 'auto',
                                                maxHeight: 210,
                                                objectFit: 'contain',
                                                borderRadius: 8,
                                            }}
                                        />
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 8,
                                            padding: '1rem 1.375rem',
                                            borderTop: '1px solid #e4e3dd',
                                            backgroundColor: '#fafaf8',
                                        }}
                                    >
                                        <button
                                            onClick={() => setZoomedChart(chart)}
                                            style={{
                                                flex: 1,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 7,
                                                padding: '9px 0',
                                                borderRadius: 10,
                                                border: '1.5px solid #d4d3cc',
                                                backgroundColor: 'transparent',
                                                fontFamily: 'DM Sans, sans-serif',
                                                fontWeight: 600,
                                                fontSize: '0.8125rem',
                                                color: '#3d3b35',
                                                cursor: 'pointer',
                                                transition: 'background 0.18s ease, border-color 0.18s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                const b = e.currentTarget as HTMLButtonElement;
                                                b.style.backgroundColor = '#f0efe9';
                                                b.style.borderColor = '#b8b7b0';
                                            }}
                                            onMouseLeave={(e) => {
                                                const b = e.currentTarget as HTMLButtonElement;
                                                b.style.backgroundColor = 'transparent';
                                                b.style.borderColor = '#d4d3cc';
                                            }}
                                        >
                                            <ZoomIn size={13} />
                                            Zoom
                                        </button>

                                        <button
                                            onClick={() => handleAskAI(chart)}
                                            style={{
                                                flex: 1,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 7,
                                                padding: '9px 0',
                                                borderRadius: 10,
                                                border: '1.5px solid #c73f14',
                                                backgroundColor: '#e8572a',
                                                fontFamily: 'DM Sans, sans-serif',
                                                fontWeight: 600,
                                                fontSize: '0.8125rem',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                transition: 'background 0.18s ease, box-shadow 0.18s ease',
                                                boxShadow: '0 2px 10px rgba(232,87,42,0.25)',
                                            }}
                                            onMouseEnter={(e) => {
                                                const b = e.currentTarget as HTMLButtonElement;
                                                b.style.backgroundColor = '#d14a20';
                                                b.style.boxShadow = '0 4px 16px rgba(232,87,42,0.38)';
                                            }}
                                            onMouseLeave={(e) => {
                                                const b = e.currentTarget as HTMLButtonElement;
                                                b.style.backgroundColor = '#e8572a';
                                                b.style.boxShadow = '0 2px 10px rgba(232,87,42,0.25)';
                                            }}
                                        >
                                            <MessageCircle size={13} />
                                            Ask AI
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Playground ── */}
                {showPlayground && (
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <SectionHeader
                            icon={<Sparkles size={18} />}
                            title="AI Playground"
                            subtitle="Select columns and guide the AI to generate custom insights and plots"
                            iconBg="#7c3aed"
                        />

                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            {/* Controls */}
                            <div style={{ flex: '1 1 300px', backgroundColor: '#fff', borderRadius: 20, padding: '1.5rem', border: '1px solid #e4e3dd', boxShadow: '0 2px 12px rgba(20,20,18,0.06)' }}>
                                <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>Configuration</h3>
                                
                                {analysis.datasets.length > 1 && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b6965', marginBottom: 8 }}>Select Dataset:</label>
                                        <select 
                                            value={playgroundDataset}
                                            onChange={e => {
                                                setPlaygroundDataset(e.target.value);
                                                setPlaygroundColumns([]);
                                            }}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d4d3cc', fontFamily: 'DM Sans, sans-serif' }}
                                        >
                                            {analysis.datasets.map(ds => (
                                                <option key={ds.filename} value={ds.filename}>{ds.filename}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b6965', marginBottom: 8 }}>Select Columns :</label>
                                    <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e4e3dd', borderRadius: 10, padding: '10px', backgroundColor: '#fafaf8' }}>
                                        {analysis.datasets.find(d => d.filename === playgroundDataset)?.columns
                                            ?.filter(col => !col.toLowerCase().match(/^(id|sno|s\.no|serial\s*no|index|uuid|_id|rowid)$/i) && !col.toLowerCase().includes('id_') && !col.toLowerCase().endsWith('_id'))
                                            ?.map(col => (
                                            <label key={col} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', fontSize: '0.875rem', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={playgroundColumns.includes(col)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setPlaygroundColumns(prev => [...prev, col]);
                                                        else setPlaygroundColumns(prev => prev.filter(c => c !== col));
                                                    }}
                                                    style={{ width: 16, height: 16, accentColor: '#e8572a' }}
                                                />
                                                <span style={{ color: '#3d3b35' }}>{col}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '0.7rem', color: '#8a8880', marginTop: 6 }}>Select the features to analyse</p>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6b6965', marginBottom: 8 }}>Your Prompt:</label>
                                    <textarea 
                                        value={playgroundPrompt}
                                        onChange={e => setPlaygroundPrompt(e.target.value)}
                                        placeholder="E.g., Show me the relationship between these columns and indicate any anomalies."
                                        style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1px solid #d4d3cc', minHeight: 120, fontSize: '0.96rem', fontFamily: 'DM Sans, sans-serif', resize: 'vertical' }}
                                    />
                                </div>

                                <button 
                                    onClick={handlePlaygroundSubmit}
                                    disabled={playgroundLoading || !playgroundPrompt.trim() || playgroundColumns.length === 0}
                                    className="btn-accent"
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px', 
                                        justifyContent: 'center', 
                                        opacity: (playgroundLoading || !playgroundPrompt.trim() || playgroundColumns.length === 0) ? 0.6 : 1,
                                        cursor: (playgroundLoading || !playgroundPrompt.trim() || playgroundColumns.length === 0) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <Sparkles size={16} />
                                    {playgroundLoading ? 'Generating...' : 'Analyze & Generate Plot'}
                                </button>
                            </div>

                            {/* Result Area */}
                            <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {playgroundLoading && (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 20, border: '1px solid #e4e3dd', minHeight: 180 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                            <div className="custom-loader" style={{ width: 30, height: 30, border: '3px solid #f3f3f3', borderTop: '3px solid #e8572a', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                            <p style={{ color: '#8a8880', fontSize: '0.9rem', fontFamily: 'DM Sans, sans-serif' }}>AI is analyzing your request...</p>
                                            <style>{`
                                                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                                            `}</style>
                                        </div>
                                    </div>
                                )}
                                
                                {playgroundResults.map((res, idx) => (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2.5rem', borderBottom: idx < playgroundResults.length - 1 ? '1px dashed #d4d3cc' : 'none' }}>
                                        {res.chart && (
                                            <div style={{ backgroundColor: '#fff', borderRadius: 20, border: '1px solid #e4e3dd', overflow: 'hidden', boxShadow: '0 2px 12px rgba(20,20,18,0.04)' }}>
                                              <div style={{ padding: '1.5rem 2rem', backgroundColor: '#fafaf8', borderBottom: '1px solid #e4e3dd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{res.chart.title}</h3>
                                                    <span style={{ fontSize: '0.65rem', padding: '4px 12px', background: '#fef0eb', color: '#c73f14', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(232,87,42,0.2)' }}>
                                                        {res.chart.plot_type.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                              </div>
                                              <div style={{ padding: '2.5rem', display: 'flex', justifyContent: 'center', backgroundColor: '#fff' }}>
                                                  <img src={res.chart.image_url} alt={res.chart.title} style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid #e4e3dd', boxShadow: '0 4px 16px rgba(20,20,18,0.06)' }} />
                                              </div>
                                              
                                              {res.chart.key_observations && res.chart.key_observations.length > 0 && (
                                                  <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #e4e3dd' }}>
                                                      <h4 style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#b8b7b0', letterSpacing: '0.12em', margin: '0 0 12px' }}>Observations</h4>
                                                      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                          {res.chart.key_observations.map((obs, j) => (
                                                              <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: '0.96rem', color: '#3d3b35', lineHeight: 1.6 }}>
                                                                  <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#e8572a', flexShrink: 0, marginTop: 7 }} />
                                                                  {obs}
                                                              </li>
                                                          ))}
                                                      </ul>
                                                  </div>
                                              )}
                                              
                                              <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid #e4e3dd', background: '#fafaf8', display: 'flex', justifyContent: 'flex-end' }}>
                                                  <button className="btn-accent" onClick={() => handleAskAI(res.chart!)} style={{ padding: '9px 20px' }}>
                                                      <MessageCircle size={14} /> Ask AI
                                                  </button>
                                              </div>
                                            </div>
                                        )}
                                        
                                        {res.summary && (
                                            <div style={{ backgroundColor: '#fff', padding: '1.5rem 2rem', borderRadius: 20, border: '1px solid #e4e3dd', boxShadow: '0 2px 12px rgba(20,20,18,0.04)', marginBottom: '0.5rem' }}>
                                                <h3 style={{ margin: '0 0 10px', fontSize: '1.05rem', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>Analysis Summary</h3>
                                                <p style={{ fontSize: '0.96rem', color: '#3d3b35', lineHeight: 1.6, margin: 0 }}>{res.summary}</p>
                                            </div>
                                        )}
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                                            {res.insights.map((insight, i) => (
                                                <InsightCard key={i} insight={insight} />
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {!playgroundLoading && playgroundResults.length === 0 && (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf8', borderRadius: 20, border: '1px dashed #d4d3cc', minHeight: 300 }}>
                                        <p style={{ color: '#8a8880', fontSize: '0.95rem', fontFamily: 'DM Sans, sans-serif' }}>Select columns and provide a prompt to start analysing.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {zoomedChart && (
                <ZoomModal
                    chart={zoomedChart}
                    onClose={() => setZoomedChart(null)}
                    onAskAI={handleAskAI}
                />
            )}
        </div>
    );
}