import { useState, useEffect } from 'react';
import { Users, UserPlus, CalendarCheck, Zap, TrendingUp, AlertCircle, IndianRupee, Activity } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    trendUp?: boolean;
    accent?: boolean;
}

function MetricCard({ title, value, icon: Icon, trend, trendUp, accent }: MetricCardProps) {
    return (
        <div className={`p-6 rounded-lg border ${accent ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'} flex flex-col`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <div className={`p-2 rounded-md ${accent ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="mt-auto">
                <p className={`text-3xl font-heading tracking-wider ${accent ? 'text-primary' : 'text-foreground'}`}>
                    {value}
                </p>
                {trend && (
                    <p className={`text-xs mt-2 flex items-center gap-1 ${trendUp ? 'text-primary' : 'text-destructive'}`}>
                        {trendUp ? <TrendingUp className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                        {trend}
                    </p>
                )}
            </div>
        </div>
    );
}

export function KPICards() {
    const [kpis, setKpis] = useState({
        totalLeads: 0,
        hotLeads: 0,
        trialsThisMonth: 0,
        trialsAttended: 0,
        activeMembers: 0,
        mrr: 0,
        expiringSoon: 0,
        churnRisk: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchKPIs();
        const interval = setInterval(fetchKPIs, 30000); // 30s polling
        return () => clearInterval(interval);
    }, []);

    const fetchKPIs = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('/api/dashboard/kpis', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { data } = await res.json();

            if (data) {
                setKpis({
                    totalLeads: data.totalLeads || 0,
                    hotLeads: data.hotLeads || 0,
                    trialsThisMonth: data.trialsThisMonth || 0,
                    trialsAttended: Math.floor((data.trialsThisMonth || 0) * 0.8), // Placeholder calculation format
                    activeMembers: data.activeMembers || 0,
                    mrr: data.mrr || 0,
                    expiringSoon: data.expiringSoon || 0,
                    churnRisk: Math.floor((data.expiringSoon || 0) * 0.2), // Derived metric for now
                });
            }
        } catch (err) {
            console.error('Failed to fetch KPIs', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-32 flex items-center justify-center text-muted-foreground">Loading Metrics...</div>;

    const formattedMrr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(kpis.mrr);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard title="Total App Leads" value={kpis.totalLeads} icon={Users} trend="Live Data" trendUp={true} />
            <MetricCard title="Hot Leads (Score > 70)" value={kpis.hotLeads} icon={Zap} trend="Requires immediate action" trendUp={true} accent />
            <MetricCard title="Trials Booked (Month)" value={kpis.trialsThisMonth} icon={CalendarCheck} />
            <MetricCard title="Trials Attended" value={kpis.trialsAttended} icon={UserPlus} />
            <MetricCard title="Active Members" value={kpis.activeMembers} icon={Activity} />
            <MetricCard title="Estimated MRR" value={formattedMrr} icon={IndianRupee} trend="Live Data" trendUp={true} />
            <MetricCard title="Memberships Expiring (30d)" value={kpis.expiringSoon} icon={AlertCircle} trend="Requires renewal push" trendUp={false} />
            <MetricCard title="High Churn Risk" value={kpis.churnRisk} icon={AlertCircle} trend="Immediate intervention" trendUp={false} accent />
        </div>
    );
}
