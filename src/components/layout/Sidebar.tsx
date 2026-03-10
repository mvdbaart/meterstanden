import { NavLink } from 'react-router-dom';
import { Home, Edit3, Cpu, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/entry', label: 'Invoer', icon: Edit3 },
    { to: '/analysis', label: 'AI Analyse', icon: Cpu },
    { to: '/settings', label: 'Instellingen', icon: Settings },
];

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 md:hidden z-50 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 md:hidden z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:relative w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen
                transition-transform duration-200 z-40
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Home className="w-6 h-6 text-blue-500" />
                        <span className="hidden sm:inline">Utility Insight</span>
                    </h1>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                    ? 'bg-blue-600 text-white font-medium'
                                    : 'hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}
