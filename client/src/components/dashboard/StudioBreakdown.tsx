import { useState, useEffect } from 'react';

export function StudioBreakdown() {
    const [studios, setStudios] = useState<any[]>([]);

    useEffect(() => {
        fetchStudios();
    }, []);

    const fetchStudios = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('/api/dashboard/studios', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { data } = await res.json();

            if (data) {
                setStudios(data);
            }
        } catch (err) {
            console.error('Failed to fetch studios', err);
        }
    };

    return (
        <div className="bg-card border border-border rounded-lg p-6 w-full h-full">
            <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground">Studio Performance</h3>
                <p className="text-sm text-muted-foreground">Capacity and lead distribution across locations</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                        <tr>
                            <th className="px-4 py-3 font-medium rounded-tl-md">Studio</th>
                            <th className="px-4 py-3 font-medium">Nearby Leads</th>
                            <th className="px-4 py-3 font-medium">Active Members</th>
                            <th className="px-4 py-3 font-medium">Coaches</th>
                            <th className="px-4 py-3 font-medium rounded-tr-md">Capacity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studios.map((studio, i) => (
                            <tr key={studio.id || studio.name} className={`border-b border-border ${i === studios.length - 1 ? 'border-none' : ''}`}>
                                <td className="px-4 py-4 font-medium text-foreground">{studio.name}</td>
                                <td className="px-4 py-4 text-muted-foreground">{studio.leadsNearby}</td>
                                <td className="px-4 py-4 text-muted-foreground">{studio.activeMembers}</td>
                                <td className="px-4 py-4 text-muted-foreground">{studio.coaches?.length || 0} active</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${studio.capacityPercent > 90 ? 'bg-destructive' : 'bg-primary'}`}
                                                style={{ width: `${studio.capacityPercent}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{studio.capacityPercent}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
