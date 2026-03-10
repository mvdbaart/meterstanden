export interface Household {
    id: string;
    name: string;
    location: string;
    type?: string;
    homewizard_ip?: string;
    battery_ip?: string;
    battery_port?: number;
    created_at: string;
}

export type UtilityType = 'gas' | 'water' | 'electricity';
export type TariffType = 'high' | 'low' | 'normal' | 'return'; // return is for zonnepanelen

export interface MeterReading {
    id: string;
    household_id: string;
    type: UtilityType;
    reading_value: number;
    date: string; // ISO format YYYY-MM-DD
    tariff?: TariffType;
}

export interface Tariffs {
    household_id: string;
    provider?: 'custom' | 'zonneplan';
    gas_price: number;
    gas_fixed?: number;
    electricity_high: number;
    electricity_low: number;
    electricity_return?: number;
    electricity_fixed?: number;
    water_price: number;
    water_fixed?: number;
}
