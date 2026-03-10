import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useMeterReadings } from '../hooks/useMeterReadings';
import type { UtilityType, TariffType, MeterReading } from '../lib/types';
import * as XLSX from 'xlsx';

export function MeterEntry() {
    const { addReading, addMultipleReadings } = useMeterReadings();
    const { currentHousehold } = useAppContext();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [type, setType] = useState<UtilityType>('gas');
    const [tariff, setTariff] = useState<TariffType>('normal');
    const [value, setValue] = useState('');
    const [isFetching, setIsFetching] = useState(false);

    const handleFetchP1 = async () => {
        if (!currentHousehold?.homewizard_ip) {
            alert('Geen P1 IP-adres ingesteld voor dit huishouden. Ga naar Instellingen.');
            return;
        }
        setIsFetching(true);
        try {
            const res = await fetch(`http://${currentHousehold.homewizard_ip}/api/v1/data`);
            if (!res.ok) throw new Error('Kon API niet bereiken');
            const data = await res.json();

            if (type === 'gas') {
                if (data.total_gas_m3 !== undefined) {
                    setValue(String(data.total_gas_m3));
                } else {
                    alert('Geen gasmeter gevonden via P1.');
                }
            } else if (type === 'electricity') {
                if (tariff === 'low') {
                    setValue(String(data.total_power_import_t1_kwh));
                } else if (tariff === 'high') {
                    setValue(String(data.total_power_import_t2_kwh));
                } else if (tariff === 'return') {
                    setValue(String((data.total_power_export_t1_kwh || 0) + (data.total_power_export_t2_kwh || 0)));
                } else {
                    setValue(String((data.total_power_import_t1_kwh || 0) + (data.total_power_import_t2_kwh || 0)));
                }
            } else if (type === 'water') {
                alert('Water wordt (nog) niet via de standaard P1 meter ondersteund. Vul dit handmatig in.');
            }
        } catch (e: any) {
            alert('Fout bij uitlezen P1: ' + e.message);
        } finally {
            setIsFetching(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsFetching(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

            if (rows.length === 0) {
                alert("Bestand is leeg.");
                return;
            }

            const newReadings: Omit<MeterReading, 'id' | 'household_id'>[] = [];

            rows.forEach((row) => {
                // Try to find a Date key
                const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('datum') || k.toLowerCase().includes('date') || k.toLowerCase() === 'tijd');
                let rowDate = dateKey ? row[dateKey] : null;

                if (!rowDate) return; // Skip if no date found

                let formattedDate = '';
                if (rowDate instanceof Date) {
                    formattedDate = rowDate.toISOString().split('T')[0];
                } else if (typeof rowDate === 'string') {
                    // Very basic string parsing attempt
                    const parsed = new Date(rowDate);
                    if (!isNaN(parsed.getTime())) {
                        formattedDate = parsed.toISOString().split('T')[0];
                    } else {
                        return; // Invalid date string
                    }
                } else if (typeof rowDate === 'number') {
                    // Excel numeric date fallback
                    const excelDate = new Date(Math.round((rowDate - 25569) * 86400 * 1000));
                    formattedDate = excelDate.toISOString().split('T')[0];
                }

                if (!formattedDate) return;

                // Helper to find column matching keywords
                const findVal = (keywords: string[]) => {
                    const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
                    const val = key ? row[key] : null;
                    return typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : null);
                };

                const gasVal = findVal(['gas']);
                const waterVal = findVal(['water']);
                const elecT1 = findVal(['stroom', 'elek', 't1', 'laag', 'low']);
                const elecT2 = findVal(['t2', 'hoog', 'high']);
                const elecReturn = findVal(['terug', 'return', 'export']);

                if (gasVal && !isNaN(gasVal)) newReadings.push({ type: 'gas', reading_value: gasVal, date: formattedDate, tariff: 'normal' });
                if (waterVal && !isNaN(waterVal)) newReadings.push({ type: 'water', reading_value: waterVal, date: formattedDate, tariff: 'normal' });

                // If only one electricity column is found, assume it is 'normal' or 'low' depending on setup. Let's just use 'normal'.
                if (elecT1 && !isNaN(elecT1) && !elecT2) newReadings.push({ type: 'electricity', reading_value: elecT1, date: formattedDate, tariff: 'normal' });
                if (elecT1 && !isNaN(elecT1) && elecT2 && !isNaN(elecT2)) {
                    newReadings.push({ type: 'electricity', reading_value: elecT1, date: formattedDate, tariff: 'low' });
                    newReadings.push({ type: 'electricity', reading_value: elecT2, date: formattedDate, tariff: 'high' });
                }
                if (elecReturn && !isNaN(elecReturn)) newReadings.push({ type: 'electricity', reading_value: elecReturn, date: formattedDate, tariff: 'return' });
            });

            if (newReadings.length > 0) {
                await addMultipleReadings(newReadings);
                alert(`${newReadings.length} meterstanden succesvol geïmporteerd uit ${file.name}! Ga naar het dashboard om de trend te zien.`);
            } else {
                alert("Geen geldige meterstanden gevonden in dit bestand. Controleer of het kolommen zoals 'Datum', 'Gas', 'Elektriciteit' bevat.");
            }

        } catch (error: any) {
            console.error(error);
            alert("Er is een fout opgetreden bij het inlezen van het bestand.");
        } finally {
            setIsFetching(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // reset
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value) return;

        await addReading({
            type,
            tariff: type === 'electricity' ? tariff : 'normal',
            reading_value: parseFloat(value),
            date
        });
        alert('Meterstand succesvol opgeslagen!');
        setValue(''); // reset field
    };

    return (
        <div className="max-w-2xl">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-lg md:text-xl font-semibold text-slate-800">Nieuwe Meterstand Invoeren</h2>
                    {currentHousehold?.homewizard_ip && (
                        <button
                            type="button"
                            onClick={handleFetchP1}
                            disabled={isFetching}
                            className={`px-3 py-1.5 bg-green-100 text-green-700 text-xs md:text-sm font-medium rounded-lg hover:bg-green-200 transition flex items-center gap-2 whitespace-nowrap ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isFetching ? 'Laden...' : 'Lees uit P1 Meter'}
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
                            <input
                                required
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type Meter</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as UtilityType)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="gas">Gas (m³)</option>
                                <option value="water">Water (m³)</option>
                                <option value="electricity">Elektriciteit (kWh)</option>
                            </select>
                        </div>

                        {type === 'electricity' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tarief</label>
                                <select
                                    value={tariff}
                                    onChange={(e) => setTariff(e.target.value as TariffType)}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="normal">Normaal</option>
                                    <option value="high">Hoog Tarief</option>
                                    <option value="low">Laag Tarief</option>
                                    <option value="return">Teruglevering (Zonnepanelen)</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Stand ({type === 'gas' || type === 'water' ? 'm³' : 'kWh'})
                            </label>
                            <input
                                required
                                type="number"
                                step="0.001"
                                min="0"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.000"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
                        >
                            Opslaan
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 mt-4 md:mt-6">
                <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-2">Historische Data Importeren (Excel/CSV)</h3>
                <p className="text-xs md:text-sm text-slate-600 mb-4">
                    Importeer oude meterstanden door een CSV of Excel (.xlsx) bestand te uploaden. Zorg ervoor dat het bestand tenminste de kolommen "Datum" en een meter-type (bijv. "Gas", "Water", "Elektriciteit", "Teruglevering") bevat.
                </p>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 cursor-pointer"
                    disabled={isFetching}
                />
            </div>
        </div>
    );
}
