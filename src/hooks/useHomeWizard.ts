import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

export interface HomeWizardData {
    wifi_ssid: string;
    wifi_strength: number;
    smr_version: number;
    meter_model: string;
    unique_id: string;
    active_tariff: number;
    total_power_import_kwh: number;
    total_power_import_t1_kwh: number;
    total_power_import_t2_kwh: number;
    total_power_export_kwh: number;
    total_power_export_t1_kwh: number;
    total_power_export_t2_kwh: number;
    active_power_w: number;
    active_power_l1_w: number;
    active_power_l2_w: number;
    active_power_l3_w: number;
    total_gas_m3: number;
    gas_timestamp: number;
}

export function useHomeWizard() {
    const { currentHousehold } = useAppContext();
    const [data, setData] = useState<HomeWizardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        async function fetchData(ip: string) {
            try {
                // Fetch directly from local API
                const response = await fetch(`http://${ip}/api/v1/data`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const json = await response.json();
                setData(json);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch Local API');
            }
        }

        if (currentHousehold?.homewizard_ip) {
            setIsLoading(true);
            fetchData(currentHousehold.homewizard_ip).finally(() => setIsLoading(false));

            // Poll every 5 seconds for live data
            interval = setInterval(() => {
                fetchData(currentHousehold.homewizard_ip!);
            }, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [currentHousehold?.homewizard_ip]);

    return {
        data,
        error,
        isLoading,
        isActive: !!currentHousehold?.homewizard_ip
    };
}
