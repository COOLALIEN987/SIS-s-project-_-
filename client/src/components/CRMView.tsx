import { useState } from 'react';
import { LeadTable } from './crm/LeadTable';
import { KanbanBoard } from './crm/KanbanBoard';
import { LeadDetailPanel } from './crm/LeadDetailPanel';
import { ScrapeModal } from './crm/ScrapeModal';
import { List, LayoutGrid, Search } from 'lucide-react';

export function CRMView() {
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);

    // Mock function to open panel
    const handleOpenPanel = () => setSelectedLeadId('1');

    return (
        <div className="space-y-6 h-full flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-heading text-foreground tracking-wide">CRM Pipeline</h1>
                    <p className="text-muted-foreground">Manage leads and active trials across all studios.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsScrapeModalOpen(true)}
                        className="bg-secondary text-foreground border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 flex items-center gap-2 transition-colors">
                        <Search className="w-4 h-4 text-primary" />
                        Scrape Now
                    </button>

                    <div className="flex bg-secondary p-1 rounded-md border border-border">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={handleOpenPanel}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                        + New Lead (Demo Open)
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
                {viewMode === 'list' ? (
                    <div className="h-full overflow-y-auto pb-6">
                        <LeadTable />
                    </div>
                ) : (
                    <div className="h-full overflow-hidden pb-6">
                        <KanbanBoard />
                    </div>
                )}
            </div>

            <LeadDetailPanel
                isOpen={!!selectedLeadId}
                leadId={selectedLeadId}
                onClose={() => setSelectedLeadId(null)}
            />

            <ScrapeModal
                isOpen={isScrapeModalOpen}
                onClose={() => setIsScrapeModalOpen(false)}
            />
        </div>
    );
}
