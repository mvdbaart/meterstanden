/**
 * HomeWizard Battery API Integration
 * Communicates with HomeWizard P1/kWh Meter to control Plug-In Battery
 */

export interface BatteryStatus {
    mode: 'zero' | 'to_full' | 'standby';
    permissions: ('charge_allowed' | 'discharge_allowed')[];
    percentage: number;
    soc_kwh: number;
    capacity_kwh: number;
    power_kw: number;
    error?: string;
}

/**
 * Fetch battery status from HomeWizard device
 */
export async function getBatteryStatus(batteryIp: string, batteryPort?: number): Promise<BatteryStatus | null> {
    if (!batteryIp) return null;

    const port = batteryPort ? `:${batteryPort}` : '';
    try {
        const url = `http://${batteryIp}${port}/api/v1/batteries`;
        console.log(`[Battery API] GET ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            mode: 'no-cors',  // Use no-cors to avoid CORS issues
            headers: {
                'Accept': 'application/json',
            }
        });

        // no-cors responses are opaque, so we can't read the body
        // We need to use cors mode instead and handle errors properly
        if (response.type === 'opaque') {
            console.warn('[Battery API] Got opaque response with no-cors mode, retrying with cors mode');
            return getBatteryStatusWithCors(batteryIp, batteryPort);
        }

        if (!response.ok) {
            console.error(`[Battery API] HTTP Error: ${response.status}`);
            return {
                mode: 'standby',
                permissions: [],
                percentage: 0,
                soc_kwh: 0,
                capacity_kwh: 0,
                power_kw: 0,
                error: `API Error ${response.status}`
            };
        }

        const data = await response.json();
        console.log('[Battery API] Success:', data);

        return {
            mode: data.mode || 'standby',
            permissions: data.permissions || [],
            percentage: Math.round((data.soc_kwh / data.capacity_kwh) * 100) || 0,
            soc_kwh: data.soc_kwh || 0,
            capacity_kwh: data.capacity_kwh || 0,
            power_kw: (data.power_w || 0) / 1000,
        };
    } catch (error) {
        console.error('[Battery API] Fetch error:', error);
        // Try alternative endpoint
        return getBatteryStatusAlt(batteryIp, batteryPort);
    }
}

/**
 * Try with CORS mode
 */
async function getBatteryStatusWithCors(batteryIp: string, batteryPort?: number): Promise<BatteryStatus | null> {
    const port = batteryPort ? `:${batteryPort}` : '';
    try {
        const url = `http://${batteryIp}${port}/api/v1/batteries`;
        console.log(`[Battery API CORS] GET ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            console.error(`[Battery API CORS] HTTP Error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        console.log('[Battery API CORS] Success:', data);

        return {
            mode: data.mode || 'standby',
            permissions: data.permissions || [],
            percentage: Math.round((data.soc_kwh / data.capacity_kwh) * 100) || 0,
            soc_kwh: data.soc_kwh || 0,
            capacity_kwh: data.capacity_kwh || 0,
            power_kw: (data.power_w || 0) / 1000,
        };
    } catch (error) {
        console.error('[Battery API CORS] Error:', error);
        return null;
    }
}

/**
 * Try alternative endpoint without /v1/
 */
async function getBatteryStatusAlt(batteryIp: string, batteryPort?: number): Promise<BatteryStatus | null> {
    const port = batteryPort ? `:${batteryPort}` : '';
    try {
        const url = `http://${batteryIp}${port}/api/batteries`;
        console.log(`[Battery API ALT] GET ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            console.error(`[Battery API ALT] HTTP Error: ${response.status}`);
            return {
                mode: 'standby',
                permissions: [],
                percentage: 0,
                soc_kwh: 0,
                capacity_kwh: 0,
                power_kw: 0,
                error: 'API not accessible - CORS blocked or battery offline'
            };
        }

        const data = await response.json();
        console.log('[Battery API ALT] Success:', data);

        return {
            mode: data.mode || 'standby',
            permissions: data.permissions || [],
            percentage: Math.round((data.soc_kwh / data.capacity_kwh) * 100) || 0,
            soc_kwh: data.soc_kwh || 0,
            capacity_kwh: data.capacity_kwh || 0,
            power_kw: (data.power_w || 0) / 1000,
        };
    } catch (error) {
        console.error('[Battery API ALT] Error:', error);
        return {
            mode: 'standby',
            permissions: [],
            percentage: 0,
            soc_kwh: 0,
            capacity_kwh: 0,
            power_kw: 0,
            error: 'Kan niet verbinden met battery (CORS blokkeert de verbinding)'
        };
    }
}

/**
 * Set battery mode: 'zero' | 'to_full' | 'standby'
 */
export async function setBatteryMode(
    batteryIp: string,
    mode: 'zero' | 'to_full' | 'standby',
    batteryPort?: number
): Promise<boolean> {
    if (!batteryIp) return false;

    const port = batteryPort ? `:${batteryPort}` : '';
    try {
        const url = `http://${batteryIp}${port}/api/v1/batteries`;
        console.log(`[Battery API PUT] Setting mode to "${mode}"`);

        const response = await fetch(url, {
            method: 'PUT',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ mode })
        });

        if (!response.ok) {
            console.error(`[Battery API PUT] Failed with status ${response.status}`);
            // Try alternative endpoint
            return setBatteryModeAlt(batteryIp, mode, batteryPort);
        }

        console.log('[Battery API PUT] Success');
        return true;
    } catch (error) {
        console.error('[Battery API PUT] Fetch error:', error);
        // Try alternative endpoint
        return setBatteryModeAlt(batteryIp, mode, batteryPort);
    }
}

async function setBatteryModeAlt(
    batteryIp: string,
    mode: 'zero' | 'to_full' | 'standby',
    batteryPort?: number
): Promise<boolean> {
    const port = batteryPort ? `:${batteryPort}` : '';
    try {
        const url = `http://${batteryIp}${port}/api/batteries`;
        console.log(`[Battery API PUT ALT] Setting mode to "${mode}"`);

        const response = await fetch(url, {
            method: 'PUT',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ mode })
        });

        if (!response.ok) {
            console.error(`[Battery API PUT ALT] Failed with status ${response.status}`);
            return false;
        }

        console.log('[Battery API PUT ALT] Success');
        return true;
    } catch (error) {
        console.error('[Battery API PUT ALT] Error:', error);
        return false;
    }
}

/**
 * Set battery permissions: control what the battery can do
 * - ['charge_allowed', 'discharge_allowed'] = Normal mode
 * - ['charge_allowed'] = Only charge, no discharge
 * - ['discharge_allowed'] = Only discharge, no charge
 * - [] = Pause (no charge, no discharge)
 */
export async function setBatteryPermissions(
    batteryIp: string,
    permissions: ('charge_allowed' | 'discharge_allowed')[],
    batteryPort?: number
): Promise<boolean> {
    if (!batteryIp) return false;

    const port = batteryPort ? `:${batteryPort}` : '';
    try {
        const url = `http://${batteryIp}${port}/api/v1/batteries`;
        console.log(`[Battery API Permissions] Setting to:`, permissions);

        const response = await fetch(url, {
            method: 'PUT',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ permissions })
        });

        if (!response.ok) {
            console.error(`[Battery API Permissions] Failed with status ${response.status}`);
            // Try alternative endpoint
            return setBatteryPermissionsAlt(batteryIp, permissions, batteryPort);
        }

        console.log('[Battery API Permissions] Success');
        return true;
    } catch (error) {
        console.error('[Battery API Permissions] Fetch error:', error);
        // Try alternative endpoint
        return setBatteryPermissionsAlt(batteryIp, permissions, batteryPort);
    }
}

async function setBatteryPermissionsAlt(
    batteryIp: string,
    permissions: ('charge_allowed' | 'discharge_allowed')[],
    batteryPort?: number
): Promise<boolean> {
    const port = batteryPort ? `:${batteryPort}` : '';
    try {
        const url = `http://${batteryIp}${port}/api/batteries`;
        console.log(`[Battery API Permissions ALT] Setting to:`, permissions);

        const response = await fetch(url, {
            method: 'PUT',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ permissions })
        });

        if (!response.ok) {
            console.error(`[Battery API Permissions ALT] Failed with status ${response.status}`);
            return false;
        }

        console.log('[Battery API Permissions ALT] Success');
        return true;
    } catch (error) {
        console.error('[Battery API Permissions ALT] Error:', error);
        return false;
    }
}

/**
 * Convenient functions for common operations
 */

export async function pauseBattery(batteryIp: string, batteryPort?: number): Promise<boolean> {
    // Pause = no charge, no discharge
    return setBatteryPermissions(batteryIp, [], batteryPort);
}

export async function chargeBattery(batteryIp: string, batteryPort?: number): Promise<boolean> {
    // Charge to full
    return setBatteryMode(batteryIp, 'to_full', batteryPort);
}

export async function setNetZero(batteryIp: string, batteryPort?: number): Promise<boolean> {
    // Net zero mode
    return setBatteryMode(batteryIp, 'zero', batteryPort);
}

export async function resumeBattery(batteryIp: string, batteryPort?: number): Promise<boolean> {
    // Resume normal operation (both charge and discharge allowed)
    return setBatteryPermissions(batteryIp, ['charge_allowed', 'discharge_allowed'], batteryPort);
}
