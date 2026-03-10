import type { Household, MeterReading, Tariffs } from './types';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

const API_BASE = `http://${window.location.hostname}:3001/api`;

// This is the old IndexedDB schema for migration purposes
interface MyDB extends DBSchema {
    households: { key: string; value: Household; };
    meter_readings: { key: string; value: MeterReading; indexes: { 'household_id': string; 'date': string; 'household_type_date': [string, string, string] }; };
    tariffs: { key: string; value: Tariffs; };
}

let localDbPromise: Promise<IDBPDatabase<MyDB>> | null = null;

async function getLocalDB() {
    if (!localDbPromise) {
        localDbPromise = openDB<MyDB>('UtilityInsight-DB', 1);
    }
    return localDbPromise;
}

// Households
export async function getHouseholds(): Promise<Household[]> {
    const res = await fetch(`${API_BASE}/households`);
    const households = await res.json();

    // If server has no households, check if we should migrate from local browser
    if (households.length === 0) {
        const localHouseholds = await getLocalHouseholds();
        if (localHouseholds.length > 0) {
            console.log("No server data found, but local browser data exists. Automatic migration starting...");
            await migrateLocalDataToServer();
            const resAfter = await fetch(`${API_BASE}/households`);
            return resAfter.json();
        }
    }

    return households;
}

async function getLocalHouseholds() {
    try {
        const db = await getLocalDB();
        return await db.getAll('households');
    } catch {
        return [];
    }
}

export async function addHousehold(household: Household) {
    const res = await fetch(`${API_BASE}/households`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(household)
    });
    return res.json();
}

// Tariffs
export async function getTariffs(household_id: string): Promise<Tariffs | null> {
    const res = await fetch(`${API_BASE}/tariffs/${household_id}`);
    return res.json();
}

export async function addTariffs(tariffs: Tariffs) {
    const res = await fetch(`${API_BASE}/tariffs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tariffs)
    });
    return res.json();
}

// Meter Readings
export async function getMeterReadings(household_id: string, type?: import('./types').UtilityType): Promise<MeterReading[]> {
    const url = new URL(`${API_BASE}/meter_readings/${household_id}`);
    if (type) url.searchParams.append('type', type);

    const res = await fetch(url.toString());
    const readings = await res.json();

    // Sort by date ascending
    readings.sort((a: MeterReading, b: MeterReading) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return readings;
}

export async function addMeterReading(reading: MeterReading) {
    const res = await fetch(`${API_BASE}/meter_readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reading)
    });
    return res.json();
}

export async function addMeterReadings(readings: MeterReading[]) {
    const res = await fetch(`${API_BASE}/meter_readings/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readings)
    });
    return res.json();
}

export async function updateMeterReading(id: string, updates: Partial<MeterReading>) {
    const res = await fetch(`${API_BASE}/meter_readings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    return res.json();
}

export async function deleteMeterReading(id: string) {
    const res = await fetch(`${API_BASE}/meter_readings/${id}`, {
        method: 'DELETE'
    });
    return res.json();
}

// Migration Logic
export async function migrateLocalDataToServer() {
    try {
        const db = await getLocalDB();

        // Migrate Households
        const households = await db.getAll('households');
        for (const h of households) {
            await addHousehold(h);
        }

        // Migrate Tariffs
        const tariffs = await db.getAll('tariffs');
        for (const t of tariffs) {
            await addTariffs(t);
        }

        // Migrate Readings
        const readings = await db.getAll('meter_readings');
        if (readings.length > 0) {
            await addMeterReadings(readings);
        }

        console.log(`Migration complete! Successfully moved ${households.length} households and ${readings.length} readings.`);
        return true;
    } catch (err) {
        console.error("Migration failed:", err);
        return false;
    }
}
