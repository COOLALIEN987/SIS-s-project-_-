import { useState, useEffect } from 'react';
import { Send, Smartphone, TerminalSquare, AlertTriangle, CheckCircle } from 'lucide-react';

export function OutreachView() {
    const [status, setStatus] = useState<string>('DISCONNECTED');
    const [loading, setLoading] = useState(false);
    const [sendPhone, setSendPhone] = useState('');
    const [sendMessage, setSendMessage] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const checkStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/whatsapp/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { data } = await res.json();
            if (data && data.status) {
                setStatus(data.status);
            }
        } catch (e) {
            console.error("Failed to check status", e);
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleInit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/whatsapp/init', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStatus('INITIALIZING');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ to: sendPhone, message: sendMessage })
            });

            const data = await res.json();
            if (data.success) {
                setFeedback({ type: 'success', msg: 'Message sent successfully via Daemon!' });
                setSendPhone('');
                setSendMessage('');
            } else {
                setFeedback({ type: 'error', msg: data.error || 'Failed to send' });
            }
        } catch (e: any) {
            setFeedback({ type: 'error', msg: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-heading text-foreground tracking-wide">Automated Outreach</h1>
                <p className="text-muted-foreground">Manage your WhatsApp terminal daemon and send messages directly to leads.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <TerminalSquare className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-heading text-foreground tracking-wide">Terminal Daemon</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                        WhatsApp is powered by a standalone terminal daemon. This isolates the heavy headless browser and prevents UI crashes.
                    </p>

                    <div className="bg-secondary/50 p-4 rounded-md mb-6 border border-border/50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">Connection Status</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${status === 'CONNECTED' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                    status === 'DISCONNECTED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                        'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse'
                                }`}>
                                {status.replace('_', ' ')}
                            </span>
                        </div>
                        {status !== 'CONNECTED' && (
                            <p className="text-xs text-muted-foreground mt-4 italic">
                                Note: Start the daemon by running <code className="bg-black/50 px-1 rounded text-primary">npx tsx server/src/whatsapp-daemon.ts</code> in a separate terminal.
                            </p>
                        )}
                        {status === 'QR_READY' && (
                            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-primary shrink-0" />
                                <p className="text-sm text-primary">Open your terminal right now! A QR code has been printed. Scan it using your WhatsApp app to link the device.</p>
                            </div>
                        )}
                    </div>

                    {status === 'DISCONNECTED' && (
                        <button
                            onClick={handleInit}
                            disabled={loading}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors w-full disabled:opacity-50"
                        >
                            {loading ? 'Triggering...' : 'Trigger Main Server Sync'}
                        </button>
                    )}
                </div>

                <div className={`transition-opacity duration-300 ${status === 'CONNECTED' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="bg-card border border-border p-6 rounded-lg h-full">
                        <div className="flex items-center gap-3 mb-4">
                            <Smartphone className="w-6 h-6 text-primary" />
                            <h2 className="text-xl font-heading text-foreground tracking-wide">Test Send</h2>
                        </div>

                        <form onSubmit={handleSend} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Recipient Phone</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="+919876543210"
                                    value={sendPhone}
                                    onChange={e => setSendPhone(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded p-2 text-foreground focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Message</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Type your message here..."
                                    value={sendMessage}
                                    onChange={e => setSendMessage(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded p-2 text-foreground focus:outline-none focus:border-primary resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors w-full flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" /> {loading ? 'Sending...' : 'Send Message'}
                            </button>

                            {feedback && (
                                <div className={`text-sm p-3 border rounded-md flex items-start gap-2 ${feedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                    {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                                    <p>{feedback.msg}</p>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
