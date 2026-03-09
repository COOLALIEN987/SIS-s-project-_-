import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// SIS 8-Stage Funnel
const STAGES = [
    { id: 'NEW', title: 'New Leads', color: 'border-l-gray-500' },
    { id: 'CONTACTED', title: 'Contacted', color: 'border-l-blue-500' },
    { id: 'INTERESTED', title: 'Interested / Nurture', color: 'border-l-purple-500' },
    { id: 'TRIAL_BOOKED', title: 'Trial Booked', color: 'border-l-[hsl(84,80%,40%)]' },
    { id: 'TRIAL_ATTENDED', title: 'Trial Attended', color: 'border-l-[hsl(78,85%,45%)]' },
    { id: 'PROPOSAL_SENT', title: 'Proposal Sent', color: 'border-l-[hsl(73,90%,50%)]' },
    { id: 'CONVERTED', title: 'Converted', color: 'border-l-primary' },
    { id: 'LOST', title: 'Lost / Unqualified', color: 'border-l-destructive' },
];

const getEmptyColumns = () => {
    const cols: Record<string, any[]> = {};
    STAGES.forEach(stage => { cols[stage.id] = []; });
    return cols;
};

export function KanbanBoard() {
    const [columns, setColumns] = useState<Record<string, any[]>>(getEmptyColumns());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
        // Set up polling to catch newly scraped leads
        const interval = setInterval(fetchLeads, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchLeads = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('/api/leads?limit=500', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { data } = await res.json();

            if (data) {
                const newCols = getEmptyColumns();
                data.forEach((lead: any) => {
                    const status = lead.status || 'NEW';
                    if (newCols[status]) {
                        newCols[status].push({
                            ...lead,
                            studio: lead.nearestStudio?.name || lead.city || 'Unassigned'
                        });
                    }
                });
                setColumns(newCols);
            }
        } catch (err) {
            console.error('Failed to fetch leads DB', err);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        // Moving within the same column
        if (source.droppableId === destination.droppableId) {
            const items = Array.from(columns[source.droppableId]);
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);

            setColumns({
                ...columns,
                [source.droppableId]: items,
            });
            return;
        }

        // Moving between columns
        const sourceCol = columns[source.droppableId];
        const destCol = columns[destination.droppableId];
        const sourceItems = Array.from(sourceCol);
        const destItems = Array.from(destCol);

        const [movedItem] = sourceItems.splice(source.index, 1);

        // Optimistic UI update
        movedItem.status = destination.droppableId;
        destItems.splice(destination.index, 0, movedItem);

        setColumns({
            ...columns,
            [source.droppableId]: sourceItems,
            [destination.droppableId]: destItems,
        });

        // Fire API call to update status on backend
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/leads/${draggableId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: destination.droppableId })
            });
        } catch (err) {
            console.error('Failed to update lead status', err);
            // Revert state in physical implementation
        }
    };

    if (loading) return <div className="flex h-full items-center justify-center text-muted-foreground">Loading exact CRM pipeline...</div>;

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto pb-4 items-start">
                {STAGES.map((stage) => (
                    <div key={stage.id} className="min-w-[300px] w-[300px] bg-card/50 border border-border rounded-md flex flex-col max-h-full">
                        <div className={`p-3 border-b border-border bg-secondary/30 flex justify-between items-center rounded-t-md border-l-4 ${stage.color}`}>
                            <h3 className="font-medium text-sm text-foreground">{stage.title}</h3>
                            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                                {columns[stage.id].length}
                            </span>
                        </div>

                        <Droppable droppableId={stage.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-secondary/10' : ''}`}
                                >
                                    {columns[stage.id].map((lead, index) => (
                                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`bg-card border border-border p-3 rounded shadow-sm hover:border-primary/50 transition-colors ${snapshot.isDragging ? 'shadow-lg border-primary ring-1 ring-primary/30' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-medium text-sm text-foreground">{lead.name}</h4>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lead.score >= 70 ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                                                            {lead.score}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-3">{lead.phone}</p>
                                                    <div className="flex items-center justify-between mt-auto">
                                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                                            {lead.studio}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                                            {lead.source}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
