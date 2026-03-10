import { useState, useEffect, useMemo } from 'react';
import { useMeterReadings } from '../hooks/useMeterReadings';
import { useHomeWizard } from '../hooks/useHomeWizard';
import { useAppContext } from '../context/AppContext';
import { calculateConsumption, calculateCosts, getTrendData, getPeriodBoundaries, type TimePeriod } from '../lib/calculations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getBatteryStatus } from '../lib/batteryApi';
import type { BatteryStatus } from '../lib/batteryApi';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function Dashboard() {
    const { readings } = useMeterReadings();
    const { tariffs, currentHousehold } = useAppContext();
    const { data: p1Data, isActive: hasP1, error: p1Error } = useHomeWizard();
    const [period, setPeriod] = useState<TimePeriod>('month');

    // Battery state
    const [batteryData, setBatteryData] = useState<BatteryStatus | null>(null);
    const [batteryLoading, setBatteryLoading] = useState(false);
    const [batteryError, setBatteryError] = useState<string | null>(null);

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
        const interval = setInterval(fetchBattery, 10000);
        return () => clearInterval(interval);
    }, [currentHousehold?.battery_ip, currentHousehold?.battery_port]);

    // Period boundaries
    const { start: currentStart, end: currentEnd } = useMemo(() => getPeriodBoundaries(period), [period]);
    const { start: prevStart, end: prevEnd } = useMemo(() => getPeriodBoundaries(period, -1), [period]);

    // Current period consumption
    const gasCurrent = calculateConsumption(readings, 'gas', undefined, currentStart, currentEnd);
    const waterCurrent = calculateConsumption(readings, 'water', undefined, currentStart, currentEnd);
    const elecCurrent = calculateConsumption(readings, 'electricity', undefined, currentStart, currentEnd);
    const costsCurrent = calculateCosts(readings, tariffs, currentStart, currentEnd);

    // Previous period consumption for comparison
    const gasPrev = calculateConsumption(readings, 'gas', undefined, prevStart, prevEnd);
    const waterPrev = calculateConsumption(readings, 'water', undefined, prevStart, prevEnd);
    const elecPrev = calculateConsumption(readings, 'electricity', undefined, prevStart, prevEnd);
    const costsPrev = calculateCosts(readings, tariffs, prevStart, prevEnd);

    const chartData = useMemo(() => getTrendData(readings, period), [readings, period]);

    const getDiff = (current: number, prev: number) => {
        if (prev === 0) return null;
        const diff = ((current - prev) / prev) * 100;
        return diff;
    };

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Overzicht</h2>
                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200 w-full sm:w-auto">
                    {(['week', 'month', 'year'] as TimePeriod[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Gasverbruik"
                    value={`${gasCurrent.toFixed(1)} m³`}
                    color="border-orange-500"
                    diff={getDiff(gasCurrent, gasPrev)}
                />
                <StatCard
                    title="Waterverbruik"
                    value={`${waterCurrent.toFixed(1)} m³`}
                    color="border-blue-500"
                    diff={getDiff(waterCurrent, waterPrev)}
                />
                <StatCard
                    title="Elektriciteit"
                    value={`${elecCurrent.toFixed(1)} kWh`}
                    color="border-yellow-500"
                    diff={getDiff(elecCurrent, elecPrev)}
                />
                <StatCard
                    title="Kosten"
                    value={`€ ${costsCurrent.toFixed(2)}`}
                    color="border-green-500"
                    diff={getDiff(costsCurrent, costsPrev)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* HomeWizard P1 Widget */}
                {hasP1 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex justify-between items-center">
                            Actueel Verbruik (P1)
                            {p1Data ? <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span> : null}
                        </h3>
                        {p1Error ? (
                            <div className="text-red-500 text-sm">Verbindingsfout met P1 Meter.</div>
                        ) : p1Data ? (
                            <div className="flex flex-col gap-2">
                                <div className="text-4xl font-bold text-slate-900">{p1Data.active_power_w} <span className="text-lg font-normal text-slate-500">Watt</span></div>
                                <div className="text-sm text-slate-500">Real-time stroomverbruik via P1 meter</div>
                            </div>
                        ) : (
                            <div className="text-slate-400 text-sm animate-pulse">Laden...</div>
                        )}
                    </div>
                )}

                {/* Battery Status (if available) */}
                {currentHousehold?.battery_ip && batteryData && !batteryError && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">🏠 Thuisbatterij</h3>
                        <div className="flex items-center gap-4">
                            <div className="text-4xl font-bold text-blue-600">{batteryData.percentage}%</div>
                            <div className="flex-1 max-w-[200px] bg-slate-100 h-3 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${batteryData.percentage}%` }}></div>
                            </div>
                        </div>
                        <div className="mt-2 text-sm text-slate-500">
                            {batteryData.soc_kwh.toFixed(1)} kWh beschikbaar ({batteryData.mode})
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

function StatCard({ title, value, color, diff }: { title: string, value: string, color: string, diff: number | null }) {
    return (
        <div className={`bg-white p-4 md:p-6 rounded-xl shadow-sm border-l-4 ${color} border border-slate-200`}>
            <h4 className="text-xs md:text-sm font-medium text-slate-500 mb-1">{title}</h4>
            <div className="flex justify-between items-end">
                <p className="text-xl md:text-2xl font-bold text-slate-900">{value}</p>
                {diff !== null && (
                    <div className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-md ${diff > 0 ? 'text-red-600 bg-red-50' : diff < 0 ? 'text-green-600 bg-green-50' : 'text-slate-500 bg-slate-50'
                        }`}>
                        {diff > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : diff < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                        {Math.abs(diff).toFixed(0)}%
                    </div>
                )}
            </div>
        </div>
    );
}

function ChartCard({ title, data, dataKey, color, name }: { title: string, data: any[], dataKey: string, color: string, name: string }) {
    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-6">{title}</h3>
            <div className="h-48 md:h-64 w-full">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                fontSize={10}
                                tickFormatter={(val) => val.split('-').slice(1).join('/')}
                            />
                            <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} width={30} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={false} activeDot={{ r: 4 }} name={name} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 text-sm">Geen data voor deze periode.</div>
                )}
            </div>
        </div>
    );
}
