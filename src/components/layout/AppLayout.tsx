import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useAppContext } from '../../context/AppContext';
import { Link } from 'react-router-dom';

export function AppLayout({ children }: { children: ReactNode }) {
    const { currentHousehold, isLoading } = useAppContext();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 md:px-8 justify-between gap-2">
                    <h2 className="text-base md:text-lg font-semibold text-slate-800 ml-12 md:ml-0 truncate flex-1 min-w-0">
                        {currentHousehold ? currentHousehold.name : 'Geen huishouden geselecteerd'}
                    </h2>
                    {!currentHousehold && (
                        <Link
                            to="/settings"
                            className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition whitespace-nowrap flex-shrink-0 block text-center touch-manipulation"
                        >
                            Instellen
                        </Link>
                    )}
                </header>
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
