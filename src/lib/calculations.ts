import type { MeterReading, Tariffs, UtilityType } from './types';

export function calculateConsumption(readings: MeterReading[], type: UtilityType, tariffType?: string) {
    const filtered = readings.filter(r => r.type === type && (!tariffType || r.tariff === tariffType));
    if (filtered.length < 2) return 0;

    const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0].reading_value;
    const last = sorted[sorted.length - 1].reading_value;
    return Math.max(0, last - first); // Simple total consumption over the period
}

export function calculateCosts(readings: MeterReading[], tariffs: Tariffs | null) {
    if (!tariffs) return 0;

    const gasConsumption = calculateConsumption(readings, 'gas');
    const waterConsumption = calculateConsumption(readings, 'water');
    const elecHighConsumption = calculateConsumption(readings, 'electricity', 'high');
    const elecLowConsumption = calculateConsumption(readings, 'electricity', 'low');
    const elecReturn = calculateConsumption(readings, 'electricity', 'return');
    const elecNormal = calculateConsumption(readings, 'electricity', 'normal');

    const gasCost = gasConsumption * tariffs.gas_price;
    const waterCost = waterConsumption * tariffs.water_price;
    const elecCost = (elecHighConsumption * tariffs.electricity_high) +
        (elecLowConsumption * tariffs.electricity_low) +
        (elecNormal * ((tariffs.electricity_high + tariffs.electricity_low) / 2)) -
        (elecReturn * (tariffs.electricity_return || 0));

    return gasCost + waterCost + elecCost;
}

// Generate data for charts grouped by month
export function getMonthlyData(readings: MeterReading[]) {
    const dataMap = new Map<string, { gas: number, water: number, electricity: number }>();

    // This is a simplified approach: we take the raw readings and just plot them or we calculate diff per month.
    // For the MVP, we just bucket the readings by YYYY-MM and take the max reading in that month to show a trend line
    // or calculate the diff between months. Let's do raw max reading trend for line chart to be simple, 
    // or diff for bar chart.

    // To get consumption per month, we need the first and last reading of each month.
    const sorted = [...readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(r => {
        const month = r.date.substring(0, 7); // YYYY-MM
        if (!dataMap.has(month)) {
            dataMap.set(month, { gas: 0, water: 0, electricity: 0 });
        }
    });

    // Calculate consumption per month...
    // For MVP simplicity, we just return the raw readings mapped for trendlines
    const trendData = sorted.map(r => ({
        date: r.date,
        gas: r.type === 'gas' ? r.reading_value : undefined,
        water: r.type === 'water' ? r.reading_value : undefined,
        electricity: r.type === 'electricity' ? r.reading_value : undefined,
    }));

    return trendData;
}
