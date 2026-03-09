import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Map, Activity, Settings, UserCircle, LogOut } from 'lucide-react';

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Leads Pipeline', path: '/pipeline', icon: Activity },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Trials', path: '/trials', icon: Calendar },
    { name: 'Map View', path: '/map', icon: Map },
    { name: 'Outreach', path: '/outreach', icon: UserCircle },
];

export function Sidebar() {
    const location = useLocation();

    return (
        <aside className="w-64 bg-card border-r border-border h-screen flex flex-col pt-6 pb-4">
            <div className="px-6 mb-8">
                <h2 className="text-3xl font-heading text-primary">SIS</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">SaaS Platform</p>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="px-4 mt-auto border-t border-border pt-4">
                <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors mb-1"
                >
                    <Settings className="w-5 h-5" />
                    Settings
                </Link>
                <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
