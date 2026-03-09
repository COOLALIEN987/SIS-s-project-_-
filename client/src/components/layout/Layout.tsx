import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Layout() {
    return (
        <div className="flex h-screen overflow-hidden bg-background w-full">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-6 scroll-smooth bg-background">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
