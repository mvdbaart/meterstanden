import type { MeterReading, Tariffs, UtilityType } from './types';

export type TimePeriod = 'week' | 'month' | 'year';

export function calculateConsumption(readings: MeterReading[], type: UtilityType, tariffType?: string, startDate?: Date, endDate?: Date) {
    const filtered = readings.filter(r => {
        const isType = r.type === type;
        const isTariff = !tariffType || r.tariff === tariffType;
        const rDate = new Date(r.date);
        const inStart = !startDate || rDate >= startDate;
        const inEnd = !endDate || rDate <= endDate;
        return isType && isTariff && inStart && inEnd;
    });

    if (filtered.length < 2) return 0;

    const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0].reading_value;
    const last = sorted[sorted.length - 1].reading_value;
    return Math.max(0, last - first);
}

export function calculateCosts(readings: MeterReading[], tariffs: Tariffs | null, startDate?: Date, endDate?: Date) {
    if (!tariffs) return 0;

    const gasConsumption = calculateConsumption(readings, 'gas', undefined, startDate, endDate);
    const waterConsumption = calculateConsumption(readings, 'water', undefined, startDate, endDate);
    const elecHighConsumption = calculateConsumption(readings, 'electricity', 'high', startDate, endDate);
    const elecLowConsumption = calculateConsumption(readings, 'electricity', 'low', startDate, endDate);
    const elecReturn = calculateConsumption(readings, 'electricity', 'return', startDate, endDate);
    const elecNormal = calculateConsumption(readings, 'electricity', 'normal', startDate, endDate);

    const gasCost = gasConsumption * tariffs.gas_price;
    const waterCost = waterConsumption * tariffs.water_price;
    const elecCost = (elecHighConsumption * tariffs.electricity_high) +
        (elecLowConsumption * tariffs.electricity_low) +
        (elecNormal * ((tariffs.electricity_high + tariffs.electricity_low) / 2)) -
        (elecReturn * (tariffs.electricity_return || 0));

    return gasCost + waterCost + elecCost;
}

export function getPeriodBoundaries(period: TimePeriod, offset: number = 0) {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    if (period === 'week') {
        const day = now.getDay() || 7; // 1-7 (Mon-Sun)
        start.setDate(now.getDate() - day + 1 + (offset * 7));
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
        start.setMonth(now.getMonth() + offset, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
    } else if (period === 'year') {
        start.setFullYear(now.getFullYear() + offset, 0, 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(start.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
    }

    return { start, end };
}

export function getTrendData(readings: MeterReading[], period: TimePeriod, offset: number = 0) {
    const { start, end } = getPeriodBoundaries(period, offset);
    const sorted = [...readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // For specific trend data, we want to show consumption per day/period
    // But to keep it simple and responsive, let's calculate consumption since 'start' for each reading after 'start'
    const periodReadings = sorted.filter(r => new Date(r.date) >= start && new Date(r.date) <= end);

    if (periodReadings.length === 0) return [];

    // Map to cumulative consumption within this period
    const types: UtilityType[] = ['gas', 'water', 'electricity'];
    const initialReadings: Record<string, number> = {};

    types.forEach(type => {
        const before = sorted.filter(r => r.type === type && new Date(r.date) < start);
        if (before.length > 0) {
            initialReadings[type] = before[before.length - 1].reading_value;
        } else {
            const firstInPeriod = periodReadings.find(r => r.type === type);
            initialReadings[type] = firstInPeriod ? firstInPeriod.reading_value : 0;
        }
    });

    const dates = Array.from(new Set(periodReadings.map(r => r.date))).sort();

    return dates.map(date => {
        const data: any = { date };
        types.forEach(type => {
            const rd = periodReadings.filter(r => r.type === type && r.date <= date);
            if (rd.length > 0) {
                const latest = rd[rd.length - 1].reading_value;
                data[type] = Math.max(0, latest - initialReadings[type]);
            }
        });
        return data;
    });
}
