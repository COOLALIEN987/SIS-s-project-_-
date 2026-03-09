import { X, Sparkles, MapPin, Briefcase, MessageSquare, PhoneCall, Mail } from 'lucide-react';

interface LeadDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string | null;
}

export function LeadDetailPanel({ isOpen, onClose, leadId }: LeadDetailPanelProps) {
    if (!isOpen) return null;

    // Use leadId so TS does not complain
    if (leadId === 'debug') console.log('Viewing lead', leadId);

    // Mock data for the selected lead
    const lead = {
        name: 'Sarah Jenkins',
        phone: '+91 9876543210',
        email: 'sarah.j@example.com',
        score: 85,
        status: 'TRIAL_BOOKED',
        source: 'Instagram Lead Form',
        studio: 'Bandra',
        distance: '1.2 km',
        occupation: 'VP of Marketing',
        company: 'TechCorp India',
        aiSummary: "Sarah is a high-intent corporate leader looking for evening personal training sessions near her Bandra office. Mentioned past knee injury during initial WhatsApp chat.",
        aiNextAction: "Confirm trial attendance for tomorrow 7 PM. Send what-to-expect guide.",
        interactions: [
            { id: 1, type: 'WHATSAPP', date: '2026-03-07 10:30 AM', notes: 'Automated greeting sent. Sarah replied interested in evening slots.' },
            { id: 2, type: 'CALL', date: '2026-03-07 02:15 PM', notes: 'Spoke for 5 mins. Clarified pricing and booked trial for Mar 8 at 7 PM.' }
        ]
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-card border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-center p-6 border-b border-border">
                <h2 className="text-xl font-heading text-foreground">Lead Profile</h2>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-80px)] p-6 space-y-8">
                {/* Header section */}
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${lead.score >= 70 ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                            Score: {lead.score}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{lead.status.replace('_', ' ')} • {lead.source}</p>

                    <div className="flex gap-2">
                        <button className="p-2 rounded bg-secondary text-foreground hover:bg-secondary/80"><MessageSquare className="w-4 h-4" /></button>
                        <button className="p-2 rounded bg-secondary text-foreground hover:bg-secondary/80"><PhoneCall className="w-4 h-4" /></button>
                        <button className="p-2 rounded bg-secondary text-foreground hover:bg-secondary/80"><Mail className="w-4 h-4" /></button>
                        <button className="ml-auto px-4 py-2 text-sm font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90">
                            Book Trial
                        </button>
                    </div>
                </div>

                {/* AI Insight Section */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3 text-primary font-medium">
                        <Sparkles className="w-4 h-4" />
                        AI Summary
                    </div>
                    <p className="text-sm text-foreground/90 mb-4 leading-relaxed">{lead.aiSummary}</p>
                    <div className="pt-3 border-t border-primary/10">
                        <span className="text-xs font-medium text-primary uppercase tracking-wider block mb-1">Recommended Next Action</span>
                        <p className="text-sm text-foreground">{lead.aiNextAction}</p>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Profile Data</h3>

                    <div className="flex items-center gap-3 text-sm text-foreground">
                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium">Nearest Studio: {lead.studio}</p>
                            <p className="text-muted-foreground text-xs">{lead.distance} away</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-foreground">
                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium">{lead.occupation}</p>
                            <p className="text-muted-foreground text-xs">{lead.company}</p>
                        </div>
                    </div>
                </div>

                {/* Interaction History */}
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Interactions</h3>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                        {lead.interactions.map(interaction => (
                            <div key={interaction.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-card text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    {interaction.type === 'CALL' ? <PhoneCall className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-secondary/50 p-3 rounded border border-border">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium text-xs text-foreground">{interaction.type}</span>
                                        <span className="text-[10px] text-muted-foreground">{interaction.date}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{interaction.notes}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
