import { useState } from 'react';
import { X, Search } from 'lucide-react';

interface ScrapeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ScrapeModal({ isOpen, onClose }: ScrapeModalProps) {
    const [type, setType] = useState('GOOGLE_PLACES');
    const [query, setQuery] = useState('');
    const [city, setCity] = useState('');
    const [locality, setLocality] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    if (!isOpen) return null;

    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/scraper', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ type, query, city, locality })
            });
            const data = await res.json();
            setResult(data);
        } catch (error: any) {
            setResult({ success: false, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-heading text-foreground mb-1">Scrape Leads</h2>
                <p className="text-sm text-muted-foreground mb-6">Extract B2B or B2C leads from open directories.</p>

                <form onSubmit={handleScrape} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Source</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full bg-secondary border border-border rounded p-2 text-foreground focus:outline-none focus:border-primary"
                        >
                            <option value="GOOGLE_PLACES">Google Maps (B2B / B2C)</option>
                            <option value="LINKEDIN">LinkedIn (HNI / Corporate)</option>
                            <option value="INDIAMART">IndiaMart (Vendors)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Search Query</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. 'Women Fitness Centres'"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-secondary border border-border rounded p-2 text-foreground focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">City</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Bangalore"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full bg-secondary border border-border rounded p-2 text-foreground focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Locality (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Indiranagar"
                                value={locality}
                                onChange={(e) => setLocality(e.target.value)}
                                className="w-full bg-secondary border border-border rounded p-2 text-foreground focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-primary text-primary-foreground font-medium p-2 rounded flex justify-center items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Queueing Job...' : <><Search className="w-4 h-4" /> Scrape Now</>}
                    </button>

                    {result && (
                        <div className={`mt-4 p-3 rounded text-sm ${result.success ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                            {result.success ? 'Job queued successfully! Check Dashboard.' : `Error: ${result.error}`}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
