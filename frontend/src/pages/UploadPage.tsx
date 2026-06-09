import { useState, useCallback } from 'react';
import { Upload, FileText, X, Play, ArrowRight, Database } from 'lucide-react';
import { uploadFiles, runAnalysis } from '../lib/api';
import { saveSession } from '../lib/sessionStore';
import type { AnalysisResponse } from '../lib/types';

interface Props {
    onPhaseChange: (sessionId: string, phase: 'uploading' | 'analyzing') => void;
    onComplete: (sessionId: string, analysis: AnalysisResponse) => void;
}

export default function UploadPage({ onPhaseChange, onComplete }: Props) {
    const [files, setFiles] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const addFiles = useCallback((fl: FileList | null) => {
        if (!fl) return;
        const csvs = Array.from(fl).filter(f => f.name.endsWith('.csv'));
        setFiles(prev => {
            const names = new Set(prev.map(f => f.name));
            return [...prev, ...csvs.filter(f => !names.has(f.name))];
        });
    }, []);

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleExecute = async () => {
        if (!files.length || loading) return;
        setError(null);
        setLoading(true);
        try {
            const upload = await uploadFiles(files);
            saveSession(upload.session_id);
            onPhaseChange(upload.session_id, 'uploading');
            onPhaseChange(upload.session_id, 'analyzing');
            const result = await runAnalysis(upload.session_id);
            onComplete(upload.session_id, result);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                width: '100%',
                minHeight: '100vh',
                background: 'linear-gradient(150deg, #0f0e0c 0%, #1a1814 50%, #211d14 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5rem 1.5rem',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative glow orbs */}
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
            <div style={{
                position: 'absolute', top: '40%', left: '-5%',
                width: 280, height: 280, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(232,87,42,0.05) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />

            {/* ── Hero text ── */}
            <div style={{
                width: '100%', maxWidth: 680,
                textAlign: 'center',
                marginBottom: '3rem',
                position: 'relative', zIndex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            }}>
                <h1 style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: 'clamp(2.75rem, 5.5vw, 4.25rem)',
                    lineHeight: 1.18,
                    letterSpacing: '-0.01em',
                    color: '#fafaf8',
                    margin: 0,
                }}>
                    Autonomous{' '}
                    <span style={{
                        background: 'linear-gradient(110deg, #e8572a 10%, #f59e0b 85%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'transparent',
                    }}>
                        Analytics
                    </span>
                    <br />from your CSVs
                </h1>

                <p style={{
                    fontSize: '1.0625rem',
                    color: 'rgba(250,250,248,0.52)',
                    lineHeight: 1.85,
                    margin: 0,
                    maxWidth: 480,
                    letterSpacing: '0.01em',
                    fontWeight: 400,
                }}>
                    Upload your datasets and get AI-powered intelligence — charts, key insights, and actionable recommendations in seconds.
                </p>
            </div>

            {/* ── Upload Card ── */}
            <div style={{
                width: '100%', maxWidth: 680,
                backgroundColor: '#fff',
                borderRadius: 28,
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
                position: 'relative', zIndex: 1,
            }}>

                {/* Drop Zone */}
                <div
                    onClick={() => document.getElementById('file-input')?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        addFiles(e.dataTransfer.files);
                    }}
                    style={{
                        padding: '3.5rem 2.5rem',
                        cursor: 'pointer',
                        backgroundColor: dragging ? '#fef5f0' : '#fff',
                        transition: 'background-color 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 20,
                    }}
                >
                    <input
                        id="file-input"
                        type="file"
                        multiple
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={(e) => addFiles(e.target.files)}
                    />

                    {/* Upload icon */}
                    <div style={{
                        width: 88, height: 88,
                        borderRadius: 22,
                        backgroundColor: dragging ? '#fef0eb' : '#fafaf8',
                        border: `2px dashed ${dragging ? '#e8572a' : '#d4d3cc'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: dragging ? '0 0 0 6px rgba(232,87,42,0.08)' : 'none',
                    }}>
                        <Upload
                            size={36}
                            style={{
                                color: dragging ? '#e8572a' : '#9a9891',
                                transition: 'color 0.2s ease',
                            }}
                        />
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 700,
                            fontSize: '1.5rem',
                            color: '#141412',
                            margin: '0 0 10px',
                            letterSpacing: '0em',
                            lineHeight: 1.35,
                        }}>
                            {files.length > 0 ? (
                                <>
                                    <span style={{ color: '#e8572a' }}>{files.length}</span>
                                    {' '}{files.length === 1 ? 'file' : 'files'} ready
                                </>
                            ) : dragging ? (
                                'Release to upload'
                            ) : (
                                'Drop your CSV files here'
                            )}
                        </h3>
                        <p style={{
                            fontSize: '0.9375rem',
                            color: '#9a9891',
                            margin: 0,
                            lineHeight: 1.65,
                            letterSpacing: '0.01em',
                        }}>
                            {dragging
                                ? 'Looking good — let go to add them'
                                : 'Or click anywhere to browse • .csv files only'}
                        </p>
                    </div>

                    {/* Format hint pills */}
                    {!files.length && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {['Sales data', 'Customer records', 'Financial reports', 'Any CSV'].map(label => (
                                <span key={label} style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    borderRadius: 999,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    backgroundColor: '#f5f4f0',
                                    color: '#6b6a65',
                                    border: '1px solid #e4e3dd',
                                }}>
                                    {label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* File list */}
                {files.length > 0 && (
                    <div style={{ borderTop: '1px solid #e4e3dd' }}>
                        <div style={{
                            padding: '10px 1.75rem',
                            backgroundColor: '#fafaf8',
                            borderBottom: '1px solid #e4e3dd',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <Database size={13} style={{ color: '#9a9891' }} />
                            <span style={{
                                fontSize: '0.6875rem', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                                color: '#9a9891',
                            }}>
                                Queued Files
                            </span>
                            <span style={{
                                marginLeft: 'auto',
                                display: 'inline-block',
                                padding: '1px 8px',
                                borderRadius: 999,
                                fontSize: '0.6875rem', fontWeight: 700,
                                backgroundColor: 'rgba(232,87,42,0.12)',
                                color: '#e8572a',
                                border: '1px solid rgba(232,87,42,0.20)',
                            }}>
                                {files.length}
                            </span>
                        </div>

                        {files.map((file, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: '0.875rem 1.75rem',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', gap: 12,
                                    borderBottom: i < files.length - 1 ? '1px solid #f0efe9' : 'none',
                                    transition: 'background 0.15s ease',
                                }}
                                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#fafaf8'}
                                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                    <div style={{
                                        width: 38, height: 38,
                                        borderRadius: 10,
                                        backgroundColor: '#fef0eb',
                                        border: '1px solid rgba(232,87,42,0.20)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <FileText size={16} style={{ color: '#e8572a' }} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{
                                            fontSize: '0.875rem', fontWeight: 600,
                                            color: '#141412', margin: 0,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {file.name}
                                        </p>
                                        <p style={{
                                            fontSize: '0.75rem', color: '#9a9891',
                                            margin: '3px 0 0',
                                        }}>
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                    style={{
                                        width: 32, height: 32,
                                        borderRadius: 8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid transparent',
                                        backgroundColor: 'transparent',
                                        color: '#9a9891',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        flexShrink: 0,
                                    }}
                                    onMouseEnter={e => {
                                        const b = e.currentTarget as HTMLButtonElement;
                                        b.style.backgroundColor = '#fef2f2';
                                        b.style.borderColor = 'rgba(239,68,68,0.25)';
                                        b.style.color = '#ef4444';
                                    }}
                                    onMouseLeave={e => {
                                        const b = e.currentTarget as HTMLButtonElement;
                                        b.style.backgroundColor = 'transparent';
                                        b.style.borderColor = 'transparent';
                                        b.style.color = '#9a9891';
                                    }}
                                    aria-label={`Remove ${file.name}`}
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{
                        borderTop: '1px solid #fee2e2',
                        backgroundColor: '#fef2f2',
                        padding: '1rem 1.75rem',
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                        <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            backgroundColor: '#ef4444', flexShrink: 0, marginTop: 6,
                        }} />
                        <p style={{ fontSize: '0.875rem', color: '#b91c1c', margin: 0, lineHeight: 1.55 }}>
                            {error}
                        </p>
                    </div>
                )}

                {/* CTA */}
                <div style={{
                    borderTop: '1px solid #e4e3dd',
                    padding: '1.5rem 1.75rem',
                    backgroundColor: '#fafaf8',
                }}>
                    <button
                        onClick={handleExecute}
                        disabled={!files.length || loading}
                        style={{
                            width: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 10,
                            padding: '14px 24px',
                            borderRadius: 16,
                            border: 'none',
                            backgroundColor: (!files.length || loading) ? '#d4d3cc' : '#e8572a',
                            color: (!files.length || loading) ? '#9a9891' : '#fff',
                            fontFamily: 'DM Sans, sans-serif',
                            fontWeight: 600,
                            fontSize: '1.0625rem',
                            cursor: (!files.length || loading) ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
                            boxShadow: (!files.length || loading) ? 'none' : '0 4px 24px rgba(232,87,42,0.32)',
                            letterSpacing: '0.02em',
                        }}
                        onMouseEnter={e => {
                            if (!files.length || loading) return;
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.backgroundColor = '#d14a20';
                            b.style.boxShadow = '0 8px 36px rgba(232,87,42,0.42)';
                            b.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.backgroundColor = (!files.length || loading) ? '#d4d3cc' : '#e8572a';
                            b.style.boxShadow = (!files.length || loading) ? 'none' : '0 4px 24px rgba(232,87,42,0.32)';
                            b.style.transform = 'translateY(0)';
                        }}
                    >
                        {loading ? (
                            <>
                                <div style={{
                                    width: 18, height: 18,
                                    borderRadius: '50%',
                                    border: '2.5px solid rgba(255,255,255,0.30)',
                                    borderTopColor: '#fff',
                                    animation: 'spin 0.8s linear infinite',
                                }} />
                                Analyzing your data…
                            </>
                        ) : (
                            <>
                                <Play size={17} fill="currentColor" />
                                Begin Analysis
                                <ArrowRight size={16} style={{ marginLeft: 2 }} />
                            </>
                        )}
                    </button>

                    {!files.length && (
                        <p style={{
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            color: '#b8b7b0',
                            margin: '10px 0 0',
                        }}>
                            Add at least one CSV file to get started
                        </p>
                    )}
                </div>
            </div>

            {/* Spin keyframe */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}