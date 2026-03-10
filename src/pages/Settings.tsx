import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { addHousehold, addTariffs } from '../lib/db';
import type { Household, Tariffs } from '../lib/types';

// Fallback UUID generator voor browsers waar crypto.randomUUID niet beschikbaar is
function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback implementatie
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function Settings() {
    const { households, currentHousehold, tariffs, refreshData, setCurrentHouseholdId } = useAppContext();
    const [isAdding, setIsAdding] = useState(false);

    // Form states for new household
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [type, setType] = useState('eigen woning');
    const [homewizardIp, setHomewizardIp] = useState('');
    const [batteryIp, setBatteryIp] = useState('');
    const [batteryPort, setBatteryPort] = useState('80');

    // Form states for tariffs
    const [provider, setProvider] = useState<'custom' | 'zonneplan'>('custom');
    const [gasPrice, setGasPrice] = useState(String(tariffs?.gas_price || '1.45'));
    const [elecHigh, setElecHigh] = useState(String(tariffs?.electricity_high || '0.34'));
    const [elecLow, setElecLow] = useState(String(tariffs?.electricity_low || '0.28'));
    const [waterPrice, setWaterPrice] = useState(String(tariffs?.water_price || '1.12'));

    useEffect(() => {
        if (currentHousehold) {
            setHomewizardIp(currentHousehold.homewizard_ip || '');
            setBatteryIp(currentHousehold.battery_ip || '');
            setBatteryPort(String(currentHousehold.battery_port || 80));
        }
        if (tariffs) {
            setProvider(tariffs.provider || 'custom');
            setGasPrice(String(tariffs.gas_price));
            setElecHigh(String(tariffs.electricity_high));
            setElecLow(String(tariffs.electricity_low));
            setWaterPrice(String(tariffs.water_price));
        }
    }, [tariffs, currentHousehold]);

    const handleAddHousehold = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newHousehold: Household = {
                id: generateUUID(),
                name,
                location,
                type,
                homewizard_ip: homewizardIp,
                battery_ip: batteryIp,
                battery_port: batteryIp ? parseInt(batteryPort) || 80 : undefined,
                created_at: new Date().toISOString(),
            };
            await addHousehold(newHousehold);

            // Create default tariffs for new household
            const newTariffs: Tariffs = {
                household_id: newHousehold.id,
                provider,
                gas_price: 1.45,
                electricity_high: 0.34,
                electricity_low: 0.28,
                water_price: 1.12,
            };
            await addTariffs(newTariffs);

            await refreshData();
            setCurrentHouseholdId(newHousehold.id);
            setIsAdding(false);
            setName('');
            setLocation('');
            setHomewizardIp('');
            setBatteryIp('');
            setBatteryPort('80');
            alert('Huishouden succesvol opgeslagen!');
        } catch (error) {
            console.error("Error adding household:", error);
            alert('Fout bij opslaan huishouden: ' + (error instanceof Error ? error.message : 'Onbekende fout'));
        }
    };

    const handleUpdateTariffs = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentHousehold) return;

        try {
            const updatedHousehold: Household = {
                ...currentHousehold,
                homewizard_ip: homewizardIp,
                battery_ip: batteryIp,
                battery_port: batteryIp ? parseInt(batteryPort) || 80 : undefined,
            };
            await addHousehold(updatedHousehold);

            const updatedTariffs: Tariffs = {
                household_id: currentHousehold.id,
                provider,
                gas_price: parseFloat(gasPrice),
                electricity_high: parseFloat(elecHigh),
                electricity_low: parseFloat(elecLow),
                water_price: parseFloat(waterPrice),
            };
            await addTariffs(updatedTariffs);
            await refreshData();
            alert("Tarieven succesvol opgeslagen!");
        } catch (error) {
            console.error("Error updating tariffs:", error);
            alert('Fout bij opslaan tarieven: ' + (error instanceof Error ? error.message : 'Onbekende fout'));
        }
    };

    return (
        <div className="max-w-3xl flex flex-col gap-4 md:gap-8">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="text-lg md:text-xl font-semibold text-slate-800">Mijn Huishoudens</h3>
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 active:bg-blue-300 transition touch-manipulation w-full sm:w-auto"
                        >
                            Nieuw toevoegen
                        </button>
                    )}
                </div>

                {isAdding && (
                    <form onSubmit={handleAddHousehold} className="mb-8 p-3 md:p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-sm md:text-base font-medium text-slate-900 mb-4">Nieuw Huishouden</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Naam (bijv. Thuis)</label>
                                <input required type="text" value={name} onChange={r => setName(r.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Locatie (bijv. Woonplaats)</label>
                                <input required type="text" value={location} onChange={r => setLocation(r.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type woning</label>
                                <select value={type} onChange={r => setType(r.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">
                                    <option>eigen woning</option>
                                    <option>huurwoning</option>
                                    <option>vakantiehuis</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">HomeWizard P1 IP (Optioneel)</label>
                                <input type="text" placeholder="bijv. 192.168.1.10" value={homewizardIp} onChange={r => setHomewizardIp(r.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">HomeWizard Battery IP (Optioneel)</label>
                                <input type="text" placeholder="bijv. 192.168.1.11" value={batteryIp} onChange={r => setBatteryIp(r.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Battery Poort (standaard 80)</label>
                                <input type="number" placeholder="80" value={batteryPort} onChange={r => setBatteryPort(r.target.value)} min="1" max="65535" className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Leverancier</label>
                                <select value={provider} onChange={r => setProvider(r.target.value as 'custom' | 'zonneplan')} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">
                                    <option value="custom">Zelf Prijzen Instellen</option>
                                    <option value="zonneplan">Zonneplan Dynamisch</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Opslaan</button>
                            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">Annuleren</button>
                        </div>
                    </form>
                )}

                {households.length > 0 ? (
                    <div className="grid gap-3">
                        {households.map(h => (
                            <button
                                key={h.id}
                                onClick={() => setCurrentHouseholdId(h.id)}
                                className={`w-full p-4 rounded-lg border cursor-pointer transition touch-manipulation active:scale-95 ${currentHousehold?.id === h.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                            >
                                <div className="flex justify-between items-center gap-4">
                                    <div className="text-left flex-1">
                                        <p className="font-semibold text-slate-900">{h.name}</p>
                                        <p className="text-xs md:text-sm text-slate-500">{h.location} • {h.type}</p>
                                    </div>
                                    {currentHousehold?.id === h.id && (
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex-shrink-0">Actief</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500">Er zijn nog geen huishoudens. Maak er 1 aan om te beginnen.</p>
                )}
            </div>

            {currentHousehold && (
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg md:text-xl font-semibold text-slate-800 mb-6">Tarieven voor {currentHousehold.name}</h3>
                    <form onSubmit={handleUpdateTariffs}>
                        <div className="mb-6 pb-6 border-b border-slate-200">
                            <h4 className="text-sm md:text-base font-medium text-slate-800 mb-4">Leverancier & Integraties</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Leverancier</label>
                                    <select value={provider} onChange={r => setProvider(r.target.value as 'custom' | 'zonneplan')} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">
                                        <option value="custom">Zelf Prijzen Instellen</option>
                                        <option value="zonneplan">Zonneplan Dynamisch</option>
                                    </select>
                                    {provider === 'zonneplan' && (
                                        <p className="text-xs text-slate-500 mt-1">Actuele dynamische uurtarieven worden getoond op het dashboard.</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">HomeWizard P1 API IP (Optioneel)</label>
                                    <input type="text" placeholder="bijv. 192.168.1.10" value={homewizardIp} onChange={r => setHomewizardIp(r.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                                    <p className="text-xs text-slate-500 mt-1">Maakt live-verbruik inzichtelijk op het dashboard over je lokale WiFi.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">HomeWizard Battery API IP (Optioneel)</label>
                                    <input type="text" placeholder="bijv. 192.168.1.11" value={batteryIp} onChange={r => setBatteryIp(r.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                                    <p className="text-xs text-slate-500 mt-1">Maakt batterij-controle mogelijk op het dashboard.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Battery Poort (standaard 80)</label>
                                    <input type="number" placeholder="80" value={batteryPort} onChange={r => setBatteryPort(r.target.value)} min="1" max="65535" className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                                    <p className="text-xs text-slate-500 mt-1">Probeer 8080, 3000 of 5000 als 80 niet werkt.</p>
                                </div>
                            </div>
                        </div>

                        {provider === 'custom' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Gas prijs (€/m³)</label>
                                    <input required type="number" step="0.01" value={gasPrice} onChange={e => setGasPrice(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Water prijs (€/m³)</label>
                                    <input required type="number" step="0.01" value={waterPrice} onChange={e => setWaterPrice(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Stroom - Hoog tarief (€/kWh)</label>
                                    <input required type="number" step="0.01" value={elecHigh} onChange={e => setElecHigh(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Stroom - Laag tarief (€/kWh)</label>
                                    <input required type="number" step="0.01" value={elecLow} onChange={e => setElecLow(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>
                        )}
                        <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition w-full sm:w-auto">
                            Tarieven Opslaan
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
