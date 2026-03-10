import { useState, useCallback, useEffect } from 'react';
import { getMeterReadings, addMeterReading, addMeterReadings, updateMeterReading, deleteMeterReading } from '../lib/db';
import type { MeterReading, UtilityType } from '../lib/types';
import { useAppContext } from '../context/AppContext';

// Fallback UUID generator voor browsers waar crypto.randomUUID niet beschikbaar is
function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback implementatie
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function useMeterReadings(type?: UtilityType) {
    const { currentHousehold } = useAppContext();
    const [readings, setReadings] = useState<MeterReading[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadReadings = useCallback(async () => {
        if (!currentHousehold) {
            setReadings([]);
            return;
        }
        setIsLoading(true);
        try {
            const data = await getMeterReadings(currentHousehold.id, type);
            setReadings(data);
        } catch (error) {
            console.error("Failed to load meter readings:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentHousehold, type]);

    useEffect(() => {
        loadReadings();
    }, [loadReadings]);

    const addReading = async (reading: Omit<MeterReading, 'id' | 'household_id'>) => {
        if (!currentHousehold) return;
        try {
            const newReading: MeterReading = {
                ...reading,
                id: generateUUID(),
                household_id: currentHousehold.id
            };
            await addMeterReading(newReading);
            await loadReadings();
        } catch (error) {
            console.error("Error adding meter reading:", error);
            throw error;
        }
    };

    const addMultipleReadings = async (readingsArray: Omit<MeterReading, 'id' | 'household_id'>[]) => {
        if (!currentHousehold || readingsArray.length === 0) return;
        try {
            const readingsToInsert: MeterReading[] = readingsArray.map(r => ({
                ...r,
                id: generateUUID(),
                household_id: currentHousehold.id
            }));
            await addMeterReadings(readingsToInsert);
            await loadReadings();
        } catch (error) {
            console.error("Error adding multiple meter readings:", error);
            throw error;
        }
    };

    const updateReading = async (id: string, updates: Partial<MeterReading>) => {
        try {
            await updateMeterReading(id, updates);
            await loadReadings();
        } catch (error) {
            console.error("Error updating meter reading:", error);
            throw error;
        }
    };

    const removeReading = async (id: string) => {
        try {
            await deleteMeterReading(id);
            await loadReadings();
        } catch (error) {
            console.error("Error deleting meter reading:", error);
            throw error;
        }
    };

    return { readings, isLoading, addReading, addMultipleReadings, updateReading, removeReading, refreshReadings: loadReadings };
}
