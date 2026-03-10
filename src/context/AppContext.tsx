import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Household, Tariffs } from '../lib/types';
import { getHouseholds, getTariffs } from '../lib/db';

interface AppContextType {
    households: Household[];
    currentHousehold: Household | null;
    tariffs: Tariffs | null;
    setCurrentHouseholdId: (id: string) => void;
    refreshData: () => Promise<void>;
    isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [households, setHouseholds] = useState<Household[]>([]);
    const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
    const [tariffs, setTariffs] = useState<Tariffs | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const allHouseholds = await getHouseholds();
            setHouseholds(allHouseholds);

            const storedId = localStorage.getItem('currentHouseholdId');
            let active = allHouseholds.find(h => h.id === storedId);

            if (!active && allHouseholds.length > 0) {
                active = allHouseholds[0];
                localStorage.setItem('currentHouseholdId', active.id);
            }

            setCurrentHousehold(active || null);

            if (active) {
                const t = await getTariffs(active.id);
                setTariffs(t || null);
            } else {
                setTariffs(null);
            }
        } catch (error) {
            console.error("Failed to load app data from DB:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const setCurrentHouseholdId = (id: string) => {
        localStorage.setItem('currentHouseholdId', id);
        refreshData();
    };

    return (
        <AppContext.Provider
            value={{ households, currentHousehold, tariffs, setCurrentHouseholdId, refreshData, isLoading }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
