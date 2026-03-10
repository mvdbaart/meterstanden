import React, { useState } from 'react';
import { useMeterReadings } from '../hooks/useMeterReadings';
import { Trash2, Edit2, Check, X, Search } from 'lucide-react';
import type { UtilityType, MeterReading, TariffType } from '../lib/types';

export function DataManagement() {
    const { readings, isLoading, updateReading, removeReading } = useMeterReadings();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<UtilityType | 'all'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editDate, setEditDate] = useState('');

    const filteredReadings = readings
        .filter(r => filterType === 'all' || r.type === filterType)
        .filter(r => r.date.includes(searchTerm) || r.reading_value.toString().includes(searchTerm))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleEdit = (reading: MeterReading) => {
        setEditingId(reading.id);
        setEditValue(reading.reading_value.toString());
        setEditDate(reading.date);
    };

    const handleSave = async (id: string) => {
        await updateReading(id, {
            reading_value: parseFloat(editValue.replace(',', '.')),
            date: editDate
        });
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Weet je zeker dat je deze opname wilt verwijderen?')) {
            await removeReading(id);
        }
    };

    const getTypeColor = (type: UtilityType) => {
        switch (type) {
            case 'gas': return 'bg-orange-100 text-orange-700';
            case 'water': return 'bg-blue-100 text-blue-700';
            case 'electricity': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800">Gegevensbeheer</h2>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Zoek op datum of waarde..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-full"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="px-4 py-2 border rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">Alle types</option>
                        <option value="gas">Gas</option>
                        <option value="water">Water</option>
                        <option value="electricity">Elektriciteit</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Datum</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Type</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Tarief</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Waarde</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Laden...</td>
                                </tr>
                            ) : filteredReadings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Geen gegevens gevonden.</td>
                                </tr>
                            ) : (
                                filteredReadings.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {editingId === r.id ? (
                                                <input
                                                    type="date"
                                                    value={editDate}
                                                    onChange={(e) => setEditDate(e.target.value)}
                                                    className="px-2 py-1 border rounded text-sm w-full"
                                                />
                                            ) : r.date}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(r.type)}`}>
                                                {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {r.tariff || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                            {editingId === r.id ? (
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="px-2 py-1 border rounded text-sm w-full max-w-[120px]"
                                                />
                                            ) : (
                                                `${r.reading_value.toLocaleString(undefined, { minimumFractionDigits: 3 })} ${r.type === 'electricity' ? 'kWh' : 'm³'}`
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {editingId === r.id ? (
                                                    <>
                                                        <button onClick={() => handleSave(r.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="Opslaan">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition" title="Annuleren">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleEdit(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Bewerken">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Verwijderen">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
