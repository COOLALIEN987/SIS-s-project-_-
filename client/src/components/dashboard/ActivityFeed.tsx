import { useState, useEffect } from 'react';
import { MessageSquare, PhoneCall, Calendar, UserPlus } from 'lucide-react';

export function ActivityFeed() {
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        fetchActivities();
        const interval = setInterval(fetchActivities, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchActivities = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('/api/dashboard/activities', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { data } = await res.json();

            if (data) {
                setActivities(data);
            }
        } catch (err) {
            console.error('Failed to fetch activities', err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'CALL': return { icon: PhoneCall, color: 'text-purple-500', bg: 'bg-purple-500/10' };
            case 'WHATSAPP': return { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' };
            case 'TRIAL': return { icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' };
            default: return { icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
        }
    };

    return (
        <div className="bg-card border border-border rounded-lg p-6 w-full h-full">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium text-foreground">Activity Feed</h3>
                    <p className="text-sm text-muted-foreground">Real-time interactions</p>
                </div>
                <button className="text-xs text-primary hover:underline">View All</button>
            </div>

            <div className="space-y-6">
                {activities.map((activity) => {
                    const style = getIcon(activity.type);
                    const Icon = style.icon;
                    return (
                        <div key={activity.id} className="flex gap-4">
                            <div className={`mt-0.5 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm text-foreground">
                                    <span className="font-medium">{activity.lead?.name || 'Unknown Lead'}</span> {activity.notes.substring(0, 45)}...
                                </p>
                                <div className="flex gap-2 items-center mt-1">
                                    <span className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
