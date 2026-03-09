import { useState, useEffect } from 'react';
import { Smartphone, QrCode, Server, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import QRCode from 'react-qr-code';

export function SettingsView() {
    const [waMode, setWaMode] = useState<'API' | 'WEB'>('API');
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [waStatus, setWaStatus] = useState<string>('DISCONNECTED');
    const [loadingQr, setLoadingQr] = useState(false);

    useEffect(() => {
        // Cleanup interval on unmount
        let interval: NodeJS.Timeout;
        if (waMode === 'WEB' && (waStatus === 'INITIALIZING' || waStatus === 'QR_READY' || waStatus === 'DISCONNECTED')) {
            interval = setInterval(fetchWaStatus, 3000);
        }
        return () => clearInterval(interval);
    }, [waMode, waStatus]);

    const fetchWaStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/whatsapp/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { data } = await res.json();
            if (data) {
                setWaStatus(data.status);
                if (data.qr) setQrCodeData(data.qr);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerateQr = async () => {
        setLoadingQr(true);
        setWaStatus('INITIALIZING');
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/whatsapp/init', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Polling will pick up the rest given the useEffect
        } catch (err) {
            console.error('Failed to init WA', err);
        } finally {
            setLoadingQr(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-heading text-foreground tracking-wide">Settings</h1>
                <p className="text-muted-foreground">Manage your workspace preferences and integrations.</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-medium text-foreground">WhatsApp Integration</h2>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                    Choose how the system sends automated outreach messages. Cloud API is highly recommended for stability and scale.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => setWaMode('API')}
                        className={`cursor-pointer border p-5 rounded-lg transition-colors ${waMode === 'API' ? 'bg-primary/10 border-primary' : 'bg-secondary border-border hover:border-primary/50'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <Server className="w-5 h-5 text-primary" />
                                <h3 className="font-medium text-foreground">Official Cloud API</h3>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                Recommended
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Uses Meta's official API for sending automated flows without maintaining a continuous browser session.</p>
                        <div className="flex items-center gap-1.5 text-xs text-primary">
                            <ShieldCheck className="w-4 h-4" /> Zero ban risk
                        </div>
                    </div>

                    <div
                        onClick={() => setWaMode('WEB')}
                        className={`cursor-pointer border p-5 rounded-lg transition-colors ${waMode === 'WEB' ? 'bg-primary/10 border-primary' : 'bg-secondary border-border hover:border-primary/50'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <QrCode className="w-5 h-5 text-foreground" />
                                <h3 className="font-medium text-foreground">WhatsApp Web (QR)</h3>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Uses a headless browser instance. Relies on whatsapp-web.js. Requires scanning a QR Code to link device.</p>
                        <div className="flex items-center gap-1.5 text-xs text-destructive">
                            <AlertTriangle className="w-4 h-4" /> Use carefully
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-border pt-6">
                    {waMode === 'API' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Access Token</label>
                                <input type="password" placeholder="EAALx..." className="w-full bg-secondary border border-border rounded p-2 text-foreground focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Phone Number ID</label>
                                <input type="text" placeholder="1234567890" className="w-full bg-secondary border border-border rounded p-2 text-foreground focus:outline-none focus:border-primary" />
                            </div>
                            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                                Save API Configuration
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-muted-foreground mb-4">Your device must remain connected to the internet.</p>

                            {waStatus === 'CONNECTED' ? (
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-md text-primary font-medium flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5" />
                                    WhatsApp is connected and active.
                                </div>
                            ) : qrCodeData ? (
                                <div className="space-y-4">
                                    <div className="bg-white p-4 w-fit rounded-lg inline-block">
                                        <QRCode value={qrCodeData} size={200} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Scan this code with WhatsApp on your phone to link your account.</p>
                                    <div className="flex items-center gap-2 text-xs font-medium text-accent animate-pulse">
                                        <RefreshCw className="w-3 h-3 animate-spin text-accent" /> Waiting for scan...
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerateQr}
                                    disabled={loadingQr || waStatus === 'INITIALIZING'}
                                    className="bg-secondary text-foreground border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 flex items-center gap-2 transition-colors disabled:opacity-50">
                                    <QrCode className="w-4 h-4" />
                                    {loadingQr || waStatus === 'INITIALIZING' ? 'Initializing Client...' : 'Generate Login QR Code'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
