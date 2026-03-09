import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardView } from './components/DashboardView';
import { CRMView } from './components/CRMView';
import { MapView } from './components/map/MapView';
import { SettingsView } from './components/SettingsView';
import { OutreachView } from './components/OutreachView';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<DashboardView />} />
                <Route path="pipeline" element={<CRMView />} />
                <Route path="map" element={<MapView />} />
                <Route path="outreach" element={<OutreachView />} />
                <Route path="settings" element={<SettingsView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

export default App;