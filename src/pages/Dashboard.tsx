import { useState, useEffect } from 'react';
import { useMeterReadings } from '../hooks/useMeterReadings';
import { useHomeWizard } from '../hooks/useHomeWizard';
import { useAppContext } from '../context/AppContext';
import { calculateConsumption, calculateCosts, getMonthlyData } from '../lib/calculations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getBatteryStatus, setBatteryMode, pauseBattery, resumeBattery } from '../lib/batteryApi';
import type { BatteryStatus } from '../lib/batteryApi';

export function Dashboard() {
    const { readings } = useMeterReadings();
    const { tariffs, currentHousehold } = useAppContext();
    const { data: p1Data, isActive: hasP1, error: p1Error } = useHomeWizard();

    // Battery state
    const [batteryData, setBatteryData] = useState<BatteryStatus | null>(null);
    const [batteryLoading, setBatteryLoading] = useState(false);
    const [batteryError, setBatteryError] = useState<string | null>(null);

    // Load battery data periodically
    useEffect(() => {
        if (!currentHousehold?.battery_ip) return;

        const fetchBattery = async () => {
            setBatteryLoading(true);
            const status = await getBatteryStatus(currentHousehold.battery_ip!, currentHousehold.battery_port);
            setBatteryData(status);
            setBatteryError(status?.error || null);
            setBatteryLoading(false);
        };

        fetchBattery();
        const interval = setInterval(fetchBattery, 10000); // Update every 10 seconds
        return () => clearInterval(interval);
    }, [currentHousehold?.battery_ip, currentHousehold?.battery_port]);

    const gasConsumption = calculateConsumption(readings, 'gas');
    const waterConsumption = calculateConsumption(readings, 'water');
    const elecConsumption = calculateConsumption(readings, 'electricity');
    const totalCosts = calculateCosts(readings, tariffs);
    const chartData = getMonthlyData(readings);

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
                <StatCard title="Gasverbruik" value={`${gasConsumption.toFixed(1)} m³`} color="border-orange-500" />
                <StatCard title="Waterverbruik" value={`${waterConsumption.toFixed(1)} m³`} color="border-blue-500" />
                <StatCard title="Elektriciteit" value={`${elecConsumption.toFixed(1)} kWh`} color="border-yellow-500" />
                <StatCard title="Totale Kosten (geschat)" value={`€ ${totalCosts.toFixed(2)}`} color="border-green-500" />
            </div>

            {/* Provider and External Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                {/* HomeWizard Battery Widget */}
                {currentHousehold?.battery_ip && (
                    <BatteryWidget batteryData={batteryData} batteryLoading={batteryLoading} batteryError={batteryError} batteryIp={currentHousehold.battery_ip} batteryPort={currentHousehold.battery_port} onStatusChange={() => {
                        // Refresh battery data
                        const fetchBattery = async () => {
                            const status = await getBatteryStatus(currentHousehold.battery_ip!, currentHousehold.battery_port);
                            setBatteryData(status);
                        };
                        fetchBattery();
                    }} />
                )}

                {/* HomeWizard P1 Widget */}
                {hasP1 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex justify-between items-center">
                            HomeWizard P1 Meter
                            {p1Data ? <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span> : null}
                        </h3>
                        {p1Error ? (
                            <div className="text-red-500 text-sm">Kan niet verbinden met de P1 Meter (API fout of off-network).</div>
                        ) : p1Data ? (
                            <div className="flex flex-col gap-2">
                                <div className="text-3xl font-bold text-slate-900">{p1Data.active_power_w} <span className="text-base font-normal text-slate-500">Watt</span></div>
                                <div className="text-sm text-slate-500">Actueel stroomverbruik</div>
                            </div>
                        ) : (
                            <div className="text-slate-400 text-sm animate-pulse">Laden...</div>
                        )}
                    </div>
                )}

                {/* Zonneplan Widget */}
                {tariffs?.provider === 'zonneplan' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex flex-col h-full justify-center">
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Actuele Tarieven</h3>
                            <p className="text-sm text-slate-600 mb-4">Je hebt "Zonneplan Dynamisch" ingesteld. Bekijk de live actuele uur- en dagprijzen in één klik.</p>
                            <a
                                href="https://www.zonneplan.nl/energie/dynamische-energieprijzen"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex justify-center items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-medium w-fit"
                            >
                                Bekijk op Zonneplan.nl
                                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <ChartCard title="Trend Elektriciteit" data={chartData} dataKey="electricity" color="#eab308" name="kWh" />
                <ChartCard title="Trend Gas" data={chartData} dataKey="gas" color="#f97316" name="m³" />
                <ChartCard title="Trend Water" data={chartData} dataKey="water" color="#3b82f6" name="m³" />
            </div>
        </div>
    );
}

function ChartCard({ title, data, dataKey, color, name }: { title: string, data: any[], dataKey: string, color: string, name: string }) {
    const hasData = data.some(d => d[dataKey] !== undefined);

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4 md:mb-6">{title}</h3>
            <div className="h-48 md:h-64 w-full">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={40} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line yAxisId="left" type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name={name} connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                        Geen data.
                    </div>
                )}
            </div>
        </div>
    );
}

function BatteryWidget({
    batteryData,
    batteryLoading,
    batteryError,
    batteryIp,
    batteryPort,
    onStatusChange
}: {
    batteryData: BatteryStatus | null;
    batteryLoading: boolean;
    batteryError: string | null;
    batteryIp: string;
    batteryPort?: number;
    onStatusChange: () => void;
}) {
    const [isControlling, setIsControlling] = useState(false);

    const handleChargeToFull = async () => {
        setIsControlling(true);
        const success = await setBatteryMode(batteryIp, 'to_full', batteryPort);
        if (success) {
            onStatusChange();
        } else {
            alert('Fout bij instellen laadmodus');
        }
        setIsControlling(false);
    };

    const handlePause = async () => {
        setIsControlling(true);
        const success = await pauseBattery(batteryIp, batteryPort);
        if (success) {
            onStatusChange();
        } else {
            alert('Fout bij pauzeren batterij');
        }
        setIsControlling(false);
    };

    const handleNetZero = async () => {
        setIsControlling(true);
        const success = await setBatteryMode(batteryIp, 'zero', batteryPort);
        if (success) {
            onStatusChange();
        } else {
            alert('Fout bij instellen netzero-modus');
        }
        setIsControlling(false);
    };

    const handleResume = async () => {
        setIsControlling(true);
        const success = await resumeBattery(batteryIp, batteryPort);
        if (success) {
            onStatusChange();
        } else {
            alert('Fout bij hervatten batterij');
        }
        setIsControlling(false);
    };

    if (batteryError) {
        return (
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4">🔋 HomeWizard Battery</h3>
                <div className="text-red-500 text-sm mb-4">Kan niet verbinden met battery ({batteryError})</div>
                <p className="text-xs text-slate-500">Controleer het IP-adres in Instellingen</p>
            </div>
        );
    }

    if (batteryLoading) {
        return (
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4">🔋 HomeWizard Battery</h3>
                <div className="text-slate-400 text-sm animate-pulse">Laden...</div>
            </div>
        );
    }

    if (!batteryData) {
        return null;
    }

    const getPercentageColor = (percentage: number) => {
        if (percentage > 75) return 'text-green-600';
        if (percentage > 50) return 'text-blue-600';
        if (percentage > 25) return 'text-orange-600';
        return 'text-red-600';
    };

    const getProgressBarColor = (percentage: number) => {
        if (percentage > 75) return 'bg-green-500';
        if (percentage > 50) return 'bg-blue-500';
        if (percentage > 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const isPaused = batteryData.permissions.length === 0;

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4">🔋 HomeWizard Battery</h3>

            {/* Battery percentage and info */}
            <div className="mb-4">
                <div className="flex justify-between items-baseline mb-2">
                    <span className={`text-2xl md:text-3xl font-bold ${getPercentageColor(batteryData.percentage)}`}>
                        {batteryData.percentage}%
                    </span>
                    <span className="text-xs md:text-sm text-slate-500">
                        {batteryData.soc_kwh.toFixed(1)} / {batteryData.capacity_kwh.toFixed(1)} kWh
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                        className={`${getProgressBarColor(batteryData.percentage)} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${batteryData.percentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Status and power */}
            <div className="space-y-1 mb-4 text-sm">
                <div className="flex justify-between text-slate-600">
                    <span>Mode:</span>
                    <span className="font-medium text-slate-900 capitalize">
                        {batteryData.mode === 'zero' ? 'Netzero' : batteryData.mode === 'to_full' ? 'Laden' : 'Standby'}
                        {isPaused && ' (Gepauzeerd)'}
                    </span>
                </div>
                <div className="flex justify-between text-slate-600">
                    <span>Vermogen:</span>
                    <span className={`font-medium ${batteryData.power_kw > 0 ? 'text-orange-600' : batteryData.power_kw < 0 ? 'text-blue-600' : 'text-slate-900'}`}>
                        {batteryData.power_kw > 0 ? '+' : ''}{batteryData.power_kw.toFixed(2)} kW
                    </span>
                </div>
            </div>

            {/* Control buttons */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={handleChargeToFull}
                    disabled={isControlling}
                    className="px-2 md:px-3 py-2 bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-700 text-xs md:text-sm font-medium rounded-lg transition disabled:opacity-50 touch-manipulation"
                >
                    ⚡ Laad Op
                </button>
                <button
                    onClick={handleNetZero}
                    disabled={isControlling}
                    className="px-2 md:px-3 py-2 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-700 text-xs md:text-sm font-medium rounded-lg transition disabled:opacity-50 touch-manipulation"
                >
                    ⚖️ Netzero
                </button>
                <button
                    onClick={isPaused ? handleResume : handlePause}
                    disabled={isControlling}
                    className={`px-2 md:px-3 py-2 text-xs md:text-sm font-medium rounded-lg transition disabled:opacity-50 touch-manipulation ${
                        isPaused
                            ? 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700'
                            : 'bg-orange-100 hover:bg-orange-200 active:bg-orange-300 text-orange-700'
                    }`}
                >
                    {isPaused ? '▶️ Herva' : '⏸️ Pauzeer'}
                </button>
                <button
                    onClick={onStatusChange}
                    disabled={isControlling}
                    className="px-2 md:px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs md:text-sm font-medium rounded-lg transition disabled:opacity-50 touch-manipulation"
                >
                    🔄 Verversen
                </button>
            </div>
        </div>
    );
}

function StatCard({ title, value, color }: { title: string, value: string, color: string }) {
    return (
        <div className={`bg-white p-3 md:p-6 rounded-xl shadow-sm border-l-4 ${color} border-y border-r border-y-slate-200 border-r-slate-200`}>
            <h4 className="text-xs md:text-sm font-medium text-slate-500 mb-1 truncate">{title}</h4>
            <p className="text-lg md:text-2xl font-bold text-slate-900 truncate">{value}</p>
        </div>
    );
}
