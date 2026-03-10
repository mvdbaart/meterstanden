Product Requirements Document (PRD)
Product: Home Utility Insight
1. Productoverzicht

Home Utility Insight is een eenvoudige webapp waarmee gebruikers meterstanden van gas, water en elektriciteit handmatig kunnen invoeren, waarna de app automatisch:

verbruik berekent

kosten berekent

trends analyseert

AI-advies geeft om verbruik te optimaliseren

De app ondersteunt meerdere woningen (profielen) en werkt lokaal zonder account. In een latere fase kunnen koppelingen worden toegevoegd met slimme meters zoals P1 meters, HomeWizard en andere IoT-apparaten.

2. Productdoelen
Primaire doelen

Inzicht geven in energieverbruik

Gebruikers helpen kosten te verlagen

Verbruik visueel inzichtelijk maken

AI-analyse laten ontdekken waar optimalisatie mogelijk is

Secundaire doelen

meerdere woningen beheren

data historisch opslaan

integraties mogelijk maken

3. Gebruikers
1. Huiseigenaren

Willen inzicht in energieverbruik.

2. Verhuurders

Beheren meerdere woningen.

3. Data-gedreven gebruikers

Willen energieverbruik optimaliseren.

4. Kernfunctionaliteiten
4.1 Huishoudenprofielen

Gebruikers kunnen meerdere woningen toevoegen.

Voorbeeld:

{
  "households": [
    {
      "name": "Thuis",
      "location": "Helmond",
      "type": "eigen woning"
    },
    {
      "name": "Vakantiehuis",
      "location": "Ardennen"
    }
  ]
}

Per huishouden worden eigen meterstanden en tarieven bijgehouden.

5. Meterstanden

De gebruiker kan meterstanden invoeren voor:

Gas

eenheid: m³

Water

eenheid: m³

Elektriciteit

eenheid: kWh

Optioneel splitsen:

elektriciteit hoog tarief

elektriciteit laag tarief

teruglevering (zonnepanelen)

Voorbeeld invoer:

{
  "type": "electricity",
  "reading": 4253,
  "date": "2026-03-07",
  "tariff": "high"
}
6. Automatische berekeningen

Bij elke nieuwe meterstand berekent het systeem:

Verbruik
verbruik = huidige stand - vorige stand
Periode

dag

week

maand

jaar

Kosten
kosten = verbruik × prijs per eenheid
7. Dashboard

Het dashboard toont realtime inzicht.

Kernstatistieken

gasverbruik deze maand

waterverbruik deze maand

elektriciteitsverbruik deze maand

totale kosten

Grafieken
Gasverbruik

maandtrend

Waterverbruik

maandtrend

Elektriciteit

verbruik

teruglevering

Kosten

totale kosten per maand

8. AI Analyse

Een AI-module analyseert patronen in het energieverbruik.

Analyse mogelijkheden

seizoensanalyse

afwijkingen detecteren

besparingsadvies

benchmarking

Voorbeelden AI advies
Gas

"Je gasverbruik is 18% hoger dan vergelijkbare woningen."

Aanbevelingen:

thermostaat 1°C lager

nachtverlaging gebruiken

isolatie controleren

Water

"Je waterverbruik stijgt sinds januari."

Mogelijke oorzaak:

lekkende kraan

langere douche

Elektriciteit

"Je elektriciteitsverbruik piekt tussen 19:00 en 22:00."

Advies:

apparaten spreiden

standby verbruik controleren

9. Instellingen pagina

De instellingenpagina bevat configuratie van:

Energie leverancier

velden:

leverancier naam

contract type

voorbeeld:

Vattenfall
Variabel contract
Energieprijzen
Gas

prijs per m³

vastrecht

Elektriciteit

prijs per kWh hoog

prijs per kWh laag

terugleververgoeding

Water

prijs per m³

vastrecht

Huishoudinformatie

optioneel voor analyse:

aantal bewoners

woningtype

bouwjaar

oppervlakte

10. Integraties (future proof)

Hoewel de MVP handmatig is, wordt de architectuur voorbereid voor integraties.

Mogelijke integraties

P1 meter

HomeWizard

slimme watermeter

energie API's

Architectuur:

data source
     ↓
ingestion layer
     ↓
storage
     ↓
analytics
     ↓
dashboard
11. Data opslag

Omdat de app lokaal werkt wordt data opgeslagen via:

Local database opties

IndexedDB

SQLite (via WASM)

Data kan optioneel geëxporteerd worden naar:

CSV

JSON

12. Data model
Household
{
  "id": "uuid",
  "name": "string",
  "location": "string",
  "created_at": "date"
}
MeterReading
{
  "id": "uuid",
  "household_id": "uuid",
  "type": "gas | water | electricity",
  "reading_value": "number",
  "date": "date",
  "tariff": "high | low | normal"
}
Tariffs
{
  "household_id": "uuid",
  "gas_price": 1.45,
  "electricity_high": 0.34,
  "electricity_low": 0.28,
  "water_price": 1.12
}
13. Gebruikersflow
Eerste gebruik

App openen

Nieuw huishouden toevoegen

Energieprijzen instellen

Eerste meterstanden invoeren

Dagelijks gebruik

Dashboard bekijken

Nieuwe meterstand invoeren

AI analyse bekijken

14. Technologie Stack

Aanbevolen stack voor deze app.

Frontend

React

Next.js

Tailwind

Charts

Recharts

Local storage

IndexedDB

AI analyse

lokale rules + AI API

Hosting

static hosting

15. MVP Scope

MVP bevat:

✔ huishoudenprofielen
✔ meterstanden invoeren
✔ gas / water / elektriciteit
✔ kosten berekening
✔ dashboard grafieken
✔ AI advies
✔ instellingen pagina

Niet in MVP:

automatische meter koppelingen

cloud sync

mobiele app

16. Future uitbreidingen
slimme meter koppeling

automatische data import

voorspellingen

voorspellen:

maandkosten

jaarverbruik

notificaties

bijvoorbeeld:

"Je energieverbruik stijgt sterk."

community benchmarking

verbruik vergelijken met andere huishoudens.

17. Extra feature (waardevol)

Een interessante feature kan zijn:

energie simulaties

Voorbeeld:

Als je thermostaat 1°C lager zet bespaar je
€220 per jaar.