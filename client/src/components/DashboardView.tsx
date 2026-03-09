import { KPICards } from './dashboard/KPICards';
import { LeadFunnel } from './dashboard/LeadFunnel';
import { StudioBreakdown } from './dashboard/StudioBreakdown';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { ScraperJobsList } from './crm/ScraperJobsList';

export function DashboardView() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading text-foreground tracking-wide">Overview</h1>
                    <p className="text-muted-foreground">Welcome back. Here's what's happening at SIS today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="bg-secondary border border-border text-sm rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary">
                        <option>All Studios</option>
                        <option>Bandra</option>
                        <option>South Mumbai</option>
                        <option>Juhu</option>
                    </select>
                    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                        Export Report
                    </button>
                </div>
            </div>

            <KPICards />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LeadFunnel />
                <div className="h-[400px]">
                    <ScraperJobsList />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <StudioBreakdown />
                </div>
                <div className="h-full">
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
}
