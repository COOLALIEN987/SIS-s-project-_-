import { useState, useMemo, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState
} from '@tanstack/react-table';
import { ArrowUpDown, Search, Filter } from 'lucide-react';

export type Lead = {
    id: string;
    name: string;
    phone: string;
    score: number;
    status: string;
    source: string;
    studio: string;
    createdAt: string;
};

export function LeadTable() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    useEffect(() => {
        fetchLeads();
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
                const formattedList = data.map((l: any) => ({
                    id: l.id,
                    name: l.name || 'Unknown',
                    phone: l.phone || l.email || 'N/A',
                    score: l.score || 50,
                    status: l.status || 'NEW',
                    source: l.source || 'Direct',
                    studio: l.nearestStudio?.name || l.city || 'Unassigned',
                    createdAt: new Date(l.createdAt).toLocaleDateString()
                }));
                setLeads(formattedList);
            }
        } catch (err) {
            console.error('Failed to fetch table leads', err);
        } finally {
            setLoading(false);
        }
    };

    const columns = useMemo<ColumnDef<Lead>[]>(
        () => [
            {
                accessorKey: 'name',
                header: ({ column }) => {
                    return (
                        <button
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                            className="flex items-center gap-1 hover:text-foreground"
                        >
                            Name
                            <ArrowUpDown className="w-4 h-4" />
                        </button>
                    )
                },
                cell: (info) => <span className="font-medium text-foreground">{info.getValue() as string}</span>,
            },
            {
                accessorKey: 'phone',
                header: 'Phone',
            },
            {
                accessorKey: 'score',
                header: ({ column }) => {
                    return (
                        <button
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                            className="flex items-center gap-1 hover:text-foreground"
                        >
                            Lead Score
                            <ArrowUpDown className="w-4 h-4" />
                        </button>
                    )
                },
                cell: (info) => {
                    const score = info.getValue() as number;
                    let color = 'text-muted-foreground';
                    if (score >= 70) color = 'text-primary font-medium';
                    if (score <= 30) color = 'text-destructive';
                    return <span className={color}>{score}</span>;
                },
            },
            {
                accessorKey: 'status',
                header: 'Pipeline Stage',
                cell: (info) => {
                    const val = info.getValue() as string;
                    return <span className="px-2 py-1 rounded bg-secondary text-xs font-medium text-foreground tracking-wide">{val.replace('_', ' ')}</span>;
                }
            },
            {
                accessorKey: 'studio',
                header: 'Nearest Studio',
            },
            {
                accessorKey: 'createdAt',
                header: 'Date Added',
            },
        ],
        []
    );

    const table = useReactTable({
        data: leads,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    if (loading) return <div className="p-6 text-center text-muted-foreground">Loading leads data...</div>;

    return (
        <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-foreground">All Leads</h3>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={globalFilter ?? ''}
                            onChange={e => setGlobalFilter(e.target.value)}
                            placeholder="Search all columns..."
                            className="bg-secondary border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-secondary border border-border px-4 py-2 rounded-md text-sm text-foreground hover:bg-secondary/80 transition-colors">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-y border-border">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="px-4 py-3 font-medium">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer">
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="px-4 py-4 text-muted-foreground">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div>
                    Showing {table.getRowModel().rows.length} of {leads.length} entries
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="px-3 py-1 rounded bg-secondary disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="px-3 py-1 rounded bg-secondary disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
