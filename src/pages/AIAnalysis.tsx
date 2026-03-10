import { useMeterReadings } from '../hooks/useMeterReadings';
import { calculateConsumption } from '../lib/calculations';

export function AIAnalysis() {
    const { readings } = useMeterReadings();

    // Very simplistic rule-based "AI" as per MVP PRD
    const getAdvices = () => {
        const advices = [];
        const gas = calculateConsumption(readings, 'gas');
        const water = calculateConsumption(readings, 'water');
        const elec = calculateConsumption(readings, 'electricity');

        if (gas > 100) {
            advices.push({
                type: 'gas',
                message: "Je gasverbruik is relatief hoog vergeleken met de basislijn.",
                recommendations: ["Thermostaat 1°C lager zetten (bespaart tot 7%)", "Nachtverlaging gebruiken", "Isolatie controleren"]
            });
        }

        if (water > 10) {
            advices.push({
                type: 'water',
                message: "We zien een flinke stijging in (of hoog) waterverbruik.",
                recommendations: ["Controleren op lekkende kranen of toiletten", "Korter douchen (max 5 minuten)", "Waterbesparende douchekop installeren"]
            });
        }

        if (elec > 250) {
            advices.push({
                type: 'electricity',
                message: "Je elektriciteitsverbruik piekt of is aan de hoge kant.",
                recommendations: ["Apparaten buiten piekuren (19:00-22:00) gebruiken", "Standby verbruik controleren (haal stekkers eruit)", "Oude apparaten vervangen voor zuinigere modellen"]
            });
        }

        if (advices.length === 0 && readings.length > 2) {
            advices.push({
                type: 'general',
                message: "Je verbruik ziet er keurig uit! Er zijn op dit moment geen grote afwijkingen gevonden.",
                recommendations: ["Blijf je meterstanden stelselmatig invoeren voor de beste analyse."]
            });
        }

        return advices;
    };

    const advices = getAdvices();

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Analyse & Advies</h2>
                <p className="text-slate-600">Onze AI module analyseert patronen in je energieverbruik en geeft gepersonaliseerd advies.</p>
            </div>

            {readings.length < 2 ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-xl">
                    <p className="font-medium">Niet genoeg data</p>
                    <p className="text-sm mt-1">Voer minstens 2 meterstanden per type (Gas, Water of Elektriciteit) in, op verschillende datums, zodat de AI je verbruik kan berekenen en analyseren.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {advices.map((adv, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${adv.type === 'gas' ? 'bg-orange-100 text-orange-600' :
                                    adv.type === 'water' ? 'bg-blue-100 text-blue-600' :
                                        adv.type === 'electricity' ? 'bg-yellow-100 text-yellow-600' :
                                            'bg-green-100 text-green-600'
                                    }`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{adv.message}</h3>
                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Aanbevelingen</h4>
                                        <ul className="space-y-2">
                                            {adv.recommendations.map((rec, j) => (
                                                <li key={j} className="flex items-start gap-2 text-slate-700">
                                                    <span className="text-green-500 mt-0.5">•</span>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
