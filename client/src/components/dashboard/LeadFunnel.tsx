import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function LeadFunnel() {
    const [stats, setStats] = useState<any[]>([]);

    useEffect(() => {
        fetchFunnel();
    }, []);

    const fetchFunnel = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('/api/dashboard/funnel', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { data } = await res.json();

            if (data) {
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch funnel DB', err);
        }
    };

    // Merge API data with stage colors
    const data = useMemo(() => {
        const defaultStages = [
            { id: 'NEW', name: 'New', color: '#2A2A2A' },
            { id: 'CONTACTED', name: 'Contacted', color: '#333333' },
            { id: 'INTERESTED', name: 'Interested', color: '#444444' },
            { id: 'TRIAL_BOOKED', name: 'Trial Booked', color: '#6A8010' },
            { id: 'TRIAL_ATTENDED', name: 'Trial Attended', color: '#8DA615' },
            { id: 'PROPOSAL_SENT', name: 'Proposal Sent', color: '#B3D91A' },
            { id: 'CONVERTED', name: 'Converted', color: '#C9F31D' }, // Primary Lime
            { id: 'LOST', name: 'Lost', color: '#FF4D1C' }, // Accent Orange
        ];

        return defaultStages.map(stage => {
            const match = stats.find(s => s.stage === stage.id);
            return {
                name: stage.name,
                value: match ? match.count : 0,
                color: stage.color
            };
        });
    }, [stats]);

    return (
        <div className="bg-card border border-border rounded-lg p-6">
            <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground">Sales Pipeline Funnel</h3>
                <p className="text-sm text-muted-foreground">Current distribution of leads across all 8 stages</p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2A2A2A" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888888', fontSize: 12 }}
                            width={100}
                        />
                        <Tooltip
                            cursor={{ fill: '#1A1A1A' }}
                            contentStyle={{ backgroundColor: '#111111', borderColor: '#2A2A2A', color: '#F5F5F5' }}
                            itemStyle={{ color: '#C9F31D' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
