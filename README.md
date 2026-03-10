# Utility Insight 📊

Een moderne web-applicatie om je nutsverbruik (gas, water, elektriciteit) bij te houden en te analyseren. De app ondersteunt live koppelingen met de HomeWizard P1 meter en Zonneplan voor dynamische tarieven.

## ✨ Kenmerken
- 📈 **Dashboard:** Visualiseer je verbruik en kosten in één oogopslag.
- ⚡ **HomeWizard Integratie:** Live uitlezen van je P1 meter.
- 💰 **Dynamische Tarieven:** Directe koppeling met Zonneplan prijzen.
- 📝 **Handmatige Invoer:** Voeg eenvoudig meterstanden toe voor gas, water en stroom.
- 🏠 **Meerdere Huishoudens:** Beheer verschillende locaties vanuit één app.
- 💾 **Lokale Opslag:** Je data wordt veilig opgeslagen in een lokaal bestand (`data/db.json`).

---

## 🚀 Installatie & Gebruik

Volg deze stappen om de applicatie op je eigen computer te draaien:

### 1. Project Clonen
Open je terminal en clone de repository:
```bash
git clone https://github.com/mvdbaart/meterstanden.git
cd meterstanden
```

### 2. Afhankelijkheden Installeren
Installeer de benodigde pakketten met npm:
```bash
npm install
```

### 3. De Applicatie Starten
Om zowel de **frontend** (de interface) als de **backend** (de database-server) tegelijk te starten, gebruik je:
```bash
npm run dev:all
```

De applicatie is nu bereikbaar op:
- **Lokaal:** [http://localhost:5173/](http://localhost:5173/)
- **Netwerk:** `http://[JOUW-IP-ADRES]:5173/` (handig voor gebruik op tablet of telefoon)

---

## 📂 Project Structuur
- `/src`: De React frontend code (TypeScript + Vite).
- `/server`: Een kleine Express backend die zorgt dat data tussen verschillende apparaten gedeeld kan worden.
- `/data`: Bevat `db.json`, jouw persoonlijke database. (Wordt niet gesynchroniseerd met GitHub voor privacy).

## 🛠 Ontwikkeling
- `npm run dev`: Start alleen de frontend (zonder database-verbinding).
- `npm run server`: Start alleen de backend server op poort 3001.
- `npm run build`: Maakt een productie-build van de applicatie.

---
*Gemaakt voor eigen gebruik en optimalisatie van energieverbruik.*
