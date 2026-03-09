import { useEffect, useState } from 'react';
import { RefreshCw, Play, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ScraperJob {
    id: string;
    source: string;
    query: string;
    city: string;
    status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    recordsFound: number;
    recordsSaved: number;
    recordsRejected: number;
    // Added rejectionReasons to pull the duplicate count from the backend
    rejectionReasons?: {
        duplicate?: number;
        invalid_phone?: number;
        no_phone?: number;
        [key: string]: any;
    };
    error: string | null;
    createdAt: string;
}

export function ScraperJobsList() {
    const [jobs, setJobs] = useState<ScraperJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('/api/scraper/jobs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setJobs(data.data);
            } else {
                setError(data.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
        // Poll every 5 seconds
        const interval = setInterval(fetchJobs, 5000);
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'QUEUED': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'RUNNING': return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
            case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return null;
        }
    };

    if (loading && jobs.length === 0) {
        return <div className="p-4 text-sm text-muted-foreground animate-pulse">Loading scraper jobs...</div>;
    }

    if (error) {
        return <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">Error loading jobs: {error}</div>;
    }

    if (jobs.length === 0) {
        return <div className="p-6 text-sm text-muted-foreground text-center bg-card border border-border rounded-lg">No scraping jobs run recently. Start one from the CRM.</div>;
    }

    return (
        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/50">
                <h3 className="font-heading text-lg text-foreground tracking-wide flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-primary" />
                    Recent Scraper Jobs
                </h3>
            </div>
            <div className="divide-y divide-border overflow-y-auto flex-1">
                {jobs.slice(0, 5).map(job => {
                    // Safely extract the duplicate count (default to 0 if not found)
                    const duplicateCount = job.rejectionReasons?.duplicate || 0;
                    
                    return (
                        <div key={job.id} className="p-4 hover:bg-secondary/20 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(job.status)}
                                    <span className="font-medium text-sm text-foreground">{job.source} - {job.query}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleTimeString()}</span>
                            </div>

                            <div className="text-sm text-muted-foreground mb-3">Target: {job.city}</div>

                            {job.status === 'COMPLETED' && (
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <div className="bg-secondary p-1.5 rounded border border-border">
                                        <span className="text-foreground font-medium">{job.recordsFound}</span> found
                                    </div>
                                    <div className="bg-green-500/10 text-green-500 p-1.5 rounded border border-green-500/20">
                                        <span className="font-medium">{job.recordsSaved}</span> saved
                                    </div>
                                    
                                    {/* THE REPEATED UI FIX */}
                                    {duplicateCount > 0 && (
                                        <div className="bg-yellow-500/10 text-yellow-500 p-1.5 rounded border border-yellow-500/20">
                                            <span className="font-medium">{duplicateCount}</span> repeated
                                        </div>
                                    )}

                                    {/* We subtract duplicates from total rejected so it represents "bad" leads */}
                                    {(job.recordsRejected - duplicateCount) > 0 && (
                                        <div className="bg-destructive/10 text-red-400 p-1.5 rounded border border-destructive/20">
                                            <span className="font-medium">{job.recordsRejected - duplicateCount}</span> bad
                                        </div>
                                    )}
                                </div>
                            )}

                            {job.status === 'FAILED' && job.error && (
                                <div className="text-xs text-destructive mt-2 bg-destructive/10 p-2 rounded">
                                    {job.error}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}