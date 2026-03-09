import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardView } from './components/DashboardView';
import { CRMView } from './components/CRMView';
import { MapView } from './components/map/MapView';
import { SettingsView } from './components/SettingsView';
import { OutreachView } from './components/OutreachView';

// Placeholder Pages
const Members = () => <div className="text-[#F5F5F5] h-full flex items-center justify-center text-xl font-heading tracking-wider">Members List Module coming soon...</div>;
const Trials = () => <div className="text-[#F5F5F5] h-full flex items-center justify-center text-xl font-heading tracking-wider">Trials Calendar coming soon...</div>;

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        // Global interceptor for 401 token expiration handling in fetch
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            // Do not intercept the login network call itself
            if (typeof args[0] === 'string' && args[0].includes('/api/auth/login')) {
                return originalFetch(...args);
            }

            const response = await originalFetch(...args);
            if (response.status === 401) {
                // If token expired mid-session, clear it and force an immediate refresh login
                localStorage.removeItem('token');
                window.location.reload();
            }
            return response;
        };

        const existingToken = localStorage.getItem('token');
        if (existingToken) {
            setIsAuthenticated(true);
            return;
        }

        // Only auto-login if we strictly do not have a token.
        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@sis.club', password: 'password123' })
        })
            .then(res => res.json())
            .then(data => {
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    setIsAuthenticated(true);
                } else {
                    setAuthError(data.error || 'Invalid credentials or missing database user.');
                }
            })
            .catch(err => {
                console.error("Auto-login failed:", err);
                setAuthError(err.message);
            });
    }, []);

    if (authError) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6 text-center">
                <div className="bg-destructive/10 border border-destructive rounded-lg p-6 max-w-lg">
                    <h2 className="text-destructive font-heading tracking-widest text-xl mb-2">AUTHENTICATION FAILED</h2>
                    <p className="text-muted-foreground mb-4">The prototype auto-login failed. Please ensure the backend is running and the 'admin@sis.club' user exists in PostgreSQL.</p>
                    <code className="bg-black/50 p-2 rounded block text-sm text-left text-destructive">{authError}</code>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                <h2 className="font-heading tracking-widest text-lg">INITIALIZING PROTOTYPE</h2>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<DashboardView />} />
                <Route path="pipeline" element={<CRMView />} />
                <Route path="members" element={<Members />} />
                <Route path="trials" element={<Trials />} />
                <Route path="map" element={<MapView />} />
                <Route path="outreach" element={<OutreachView />} />
                <Route path="settings" element={<SettingsView />} />
            </Route>
        </Routes>
    );
}

export default App;
