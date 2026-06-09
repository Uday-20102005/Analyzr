import { useState, useRef, useEffect, useCallback } from 'react';
import { sendChatMessage, fetchChatOpener } from '../lib/api';
import type { ChatMessage } from '../lib/types';
import { Send, Sparkles, X, MessageCircle } from 'lucide-react';

interface Props {
    sessionId: string;
    pendingPrompt: string | null;
    onPendingPromptConsumed: () => void;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
    const isUser = msg.role === 'user';
    return (
        <div style={{
            display: 'flex',
            width: '100%',
            marginBottom: '0.875rem',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
        }}>
            {!isUser && (
                <div style={{
                    width: 28, height: 28,
                    borderRadius: 8,
                    backgroundColor: '#fef0eb',
                    border: '1px solid rgba(232,87,42,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    marginRight: 10,
                    marginTop: 2,
                }}>
                    <Sparkles size={13} style={{ color: '#e8572a' }} />
                </div>
            )}
            <div style={{
                maxWidth: '78%',
                padding: isUser ? '10px 14px' : '10px 14px',
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                letterSpacing: '0.01em',
                fontWeight: 400,
                backgroundColor: isUser ? '#e8572a' : '#f5f4f0',
                color: isUser ? '#fff' : '#3d3b35',
                border: isUser ? '1px solid #c73f14' : '1px solid #e4e3dd',
                boxShadow: isUser
                    ? '0 2px 10px rgba(232,87,42,0.22)'
                    : '0 1px 3px rgba(20,20,18,0.06)',
            }}>
                {msg.content.split('\n').map((line, i) => (
                    <p key={i} style={{ margin: i > 0 ? '4px 0 0' : 0 }}>
                        {line}
                    </p>
                ))}
            </div>
        </div>
    );
}

export default function ChatBubble({
    sessionId,
    pendingPrompt,
    onPendingPromptConsumed,
}: Props) {
    const [open, setOpen] = useState(false);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [openerLoaded, setOpenerLoaded] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const historyRef = useRef<ChatMessage[]>([]);
    const promptQueueRef = useRef<string[]>([]);
    const processingQueueRef = useRef(false);
    const sessionIdRef = useRef(sessionId);

    useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

    useEffect(() => {
        async function loadOpener() {
            setOpenerLoaded(false);
            try {
                const res = await fetchChatOpener(sessionId);
                setHistory(res.message ? [{ role: 'assistant', content: res.message }] : []);
            } catch {
                setHistory([]);
            } finally {
                setOpenerLoaded(true);
            }
        }
        loadOpener();
    }, [sessionId]);

    useEffect(() => { historyRef.current = history; }, [history]);

    useEffect(() => {
        if (open) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [history, loading, open]);

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const userMsg: ChatMessage = { role: 'user', content: trimmed };
        const historyForApi = [...historyRef.current, userMsg];
        setHistory((h) => [...h, userMsg]);
        setInput('');
        setLoading(true);
        try {
            const res = await sendChatMessage({
                session_id: sessionIdRef.current,
                message: trimmed,
                history: historyForApi,
            });
            setHistory((h) => [...h, { role: 'assistant', content: res.reply }]);
        } catch {
            setHistory((h) => [...h, { role: 'assistant', content: 'Unable to process your request. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    }, []);

    const processPromptQueue = useCallback(async () => {
        if (!openerLoaded || processingQueueRef.current) return;
        processingQueueRef.current = true;
        try {
            while (promptQueueRef.current.length > 0) {
                const next = promptQueueRef.current.shift();
                if (!next) break;
                await sendMessage(next);
            }
        } finally {
            processingQueueRef.current = false;
        }
    }, [sendMessage, openerLoaded]);

    useEffect(() => {
        if (!pendingPrompt) return;
        promptQueueRef.current.push(pendingPrompt);
        setOpen(true);
        onPendingPromptConsumed();
        void processPromptQueue();
    }, [pendingPrompt, onPendingPromptConsumed, processPromptQueue]);

    useEffect(() => {
        if (!openerLoaded || promptQueueRef.current.length === 0) return;
        void processPromptQueue();
    }, [openerLoaded, processPromptQueue]);

    async function send(msg?: string) {
        const text = (msg ?? input).trim();
        if (!text || loading) return;
        await sendMessage(text);
    }

    const quickActions = ['Summarize insights', 'Key trends', 'Flag anomalies'];

    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>

            {/* ── Chat Window ── */}
            {open && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 400,
                    maxWidth: 'calc(100vw - 1.5rem)',
                    height: 520,
                    backgroundColor: '#fff',
                    borderRadius: 24,
                    border: '1px solid #e4e3dd',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(10,10,8,0.22), 0 4px 16px rgba(10,10,8,0.10)',
                }}>

                    {/* Header */}
                    <div style={{
                        padding: '1.125rem 1.375rem',
                        borderBottom: '1px solid #e4e3dd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #141412 0%, #1e1c19 100%)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 36, height: 36,
                                borderRadius: 10,
                                backgroundColor: 'rgba(232,87,42,0.18)',
                                border: '1px solid rgba(232,87,42,0.30)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Sparkles size={16} style={{ color: '#e8572a' }} />
                            </div>
                            <div>
                                <h3 style={{
                                    fontFamily: 'Syne, sans-serif',
                                    fontWeight: 700,
                                    fontSize: '0.9375rem',
                                    color: '#fafaf8',
                                    margin: 0,
                                    letterSpacing: '-0.005em',
                                    lineHeight: 1.2,
                                }}>
                                    AI Assistant
                                </h3>
                                <p style={{
                                    fontSize: '0.75rem',
                                    color: 'rgba(250,250,248,0.42)',
                                    margin: '3px 0 0',
                                    letterSpacing: '0.01em',
                                    fontWeight: 400,
                                    lineHeight: 1,
                                }}>
                                    Analyzing your data
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setOpen(false)}
                            style={{
                                width: 32, height: 32,
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.12)',
                                backgroundColor: 'rgba(255,255,255,0.06)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'rgba(250,250,248,0.55)',
                                transition: 'background 0.15s, color 0.15s',
                            }}
                            onMouseEnter={e => {
                                const b = e.currentTarget as HTMLButtonElement;
                                b.style.backgroundColor = 'rgba(255,255,255,0.12)';
                                b.style.color = '#fafaf8';
                            }}
                            onMouseLeave={e => {
                                const b = e.currentTarget as HTMLButtonElement;
                                b.style.backgroundColor = 'rgba(255,255,255,0.06)';
                                b.style.color = 'rgba(250,250,248,0.55)';
                            }}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1.25rem 1.375rem',
                        backgroundColor: '#fff',
                    }}>
                        {history.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

                        {loading && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 0',
                            }}>
                                <div style={{
                                    width: 28, height: 28,
                                    borderRadius: 8,
                                    backgroundColor: '#fef0eb',
                                    border: '1px solid rgba(232,87,42,0.20)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Sparkles size={13} style={{ color: '#e8572a' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{
                                            width: 6, height: 6,
                                            borderRadius: '50%',
                                            backgroundColor: '#d4d3cc',
                                            animation: `bounce 1.2s ease-in-out ${i * 0.18}s infinite`,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Quick actions */}
                    {history.length === 1 && !loading && (
                        <div style={{
                            padding: '0 1.375rem 0.875rem',
                            display: 'flex',
                            gap: 6,
                            flexWrap: 'wrap',
                            backgroundColor: '#fff',
                        }}>
                            {quickActions.map(s => (
                                <button
                                    key={s}
                                    onClick={() => send(s)}
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: 999,
                                        border: '1px solid #e4e3dd',
                                        backgroundColor: '#fafaf8',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: '#6b6a65',
                                        cursor: 'pointer',
                                        letterSpacing: '0.01em',
                                        lineHeight: 1.5,
                                        transition: 'border-color 0.15s, color 0.15s, background 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        const b = e.currentTarget as HTMLButtonElement;
                                        b.style.borderColor = 'rgba(232,87,42,0.35)';
                                        b.style.color = '#e8572a';
                                        b.style.backgroundColor = '#fef5f0';
                                    }}
                                    onMouseLeave={e => {
                                        const b = e.currentTarget as HTMLButtonElement;
                                        b.style.borderColor = '#e4e3dd';
                                        b.style.color = '#6b6a65';
                                        b.style.backgroundColor = '#fafaf8';
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div style={{
                        padding: '0.875rem 1.375rem 1.125rem',
                        borderTop: '1px solid #e4e3dd',
                        backgroundColor: '#fafaf8',
                        flexShrink: 0,
                    }}>
                        <div style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            border: `1.5px solid ${inputFocused ? '#e8572a' : '#e4e3dd'}`,
                            borderRadius: 14,
                            padding: '6px 6px 6px 14px',
                            transition: 'border-color 0.18s ease',
                            boxShadow: inputFocused ? '0 0 0 3px rgba(232,87,42,0.08)' : 'none',
                        }}>
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                placeholder="Ask anything about your data…"
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                    fontSize: '0.95rem',
                                    fontWeight: 400,
                                    color: '#141412',
                                    letterSpacing: '0.01em',
                                    lineHeight: 1.5,
                                    fontFamily: 'DM Sans, sans-serif',
                                }}
                            />
                            <button
                                onClick={() => send()}
                                disabled={!input.trim() || loading}
                                style={{
                                    width: 34, height: 34,
                                    borderRadius: 10,
                                    border: 'none',
                                    backgroundColor: (!input.trim() || loading) ? '#f0efe9' : '#e8572a',
                                    color: (!input.trim() || loading) ? '#c8c7c0' : '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                                    flexShrink: 0,
                                    transition: 'background 0.18s ease',
                                    boxShadow: (!input.trim() || loading) ? 'none' : '0 2px 8px rgba(232,87,42,0.28)',
                                }}
                                onMouseEnter={e => {
                                    if (!input.trim() || loading) return;
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#d14a20';
                                }}
                                onMouseLeave={e => {
                                    if (!input.trim() || loading) return;
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e8572a';
                                }}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── FAB ── */}
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: 52, height: 52,
                    borderRadius: '50%',
                    border: '1.5px solid #c73f14',
                    backgroundColor: '#e8572a',
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(232,87,42,0.38)',
                    transition: 'opacity 0.2s ease, transform 0.2s ease, background 0.18s ease',
                    opacity: open ? 0 : 1,
                    pointerEvents: open ? 'none' : 'auto',
                    transform: open ? 'scale(0.85)' : 'scale(1)',
                }}
                onMouseEnter={e => {
                    if (open) return;
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.backgroundColor = '#d14a20';
                    b.style.transform = 'scale(1.06)';
                    b.style.boxShadow = '0 8px 28px rgba(232,87,42,0.48)';
                }}
                onMouseLeave={e => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.backgroundColor = '#e8572a';
                    b.style.transform = open ? 'scale(0.85)' : 'scale(1)';
                    b.style.boxShadow = '0 4px 20px rgba(232,87,42,0.38)';
                }}
                title="Open AI Assistant"
            >
                <MessageCircle size={20} fill="currentColor" />
            </button>

            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                    40% { transform: translateY(-5px); opacity: 1; }
                }
            `}</style>
        </div>
    );
}