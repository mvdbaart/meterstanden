# Utility Insight - Installatie & Setup Handleiding

## 📋 Inhoudsopgave
1. [Systeemvereisten](#systeemvereisten)
2. [Installatie](#installatie)
3. [App Starten](#app-starten)
4. [Eerste Setup](#eerste-setup)
5. [Mobiele Toegang](#mobiele-toegang)
6. [Functionaliteit](#functionaliteit)
7. [Troubleshooting](#troubleshooting)

---

## 🖥️ Systeemvereisten

### Minimaal Vereist
- **Node.js**: versie 18.0.0 of hoger
- **npm**: versie 9.0.0 of hoger (automatisch met Node.js)
- **Browser**: Chrome, Firefox, Safari of Edge (recente versie)

### Controleer je versies
```bash
node --version
npm --version
```

Download Node.js: https://nodejs.org/

---

## 📦 Installatie

### Stap 1: Project Folder Openen
```bash
cd /pad/naar/meterstanden
```

### Stap 2: Dependencies Installeren
```bash
npm install
```

Dit installeert alle benodigde packages uit `package.json`.

### Stap 3: Verificatie
Check of alles goed geïnstalleerd is:
```bash
npm run build
```

Als er geen errors zijn, ben je klaar! 🎉

---

## 🚀 App Starten

### Development Mode (met hot reload)
```bash
npm run dev
```

Je ziet output zoals:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.X.XXX:5173/
```

**BELANGRIJK**: Voor mobiele toegang, gebruik altijd de **Network URL** (het IP-adres)!

### Production Build
```bash
npm run build
npm run preview
```

Dit bouwt een geoptimaliseerde versie en preview deze.

---

## ⚙️ Eerste Setup

### Stap 1: App Openen
Open je browser naar: `http://192.168.0.X:5173` (gebruik het IP van je laptop!)

### Stap 2: Huishouden Toevoegen
1. Klik op "**Instellen**" in de header
2. Klik "**Nieuw toevoegen**"
3. Vul in:
   - **Naam**: bijv. "Thuis"
   - **Locatie**: bijv. "Amsterdam"
   - **Type woning**: kies uit de opties
   - **HomeWizard P1 IP** (optioneel): bijv. `192.168.0.50`
   - **Leverancier**: kies tussen "Zelf Prijzen Instellen" of "Zonneplan Dynamisch"
4. Klik "**Opslaan**"

### Stap 3: Huishouden Selecteren
1. Je ziet het huishouden verschijnen
2. Klik erop om het te selecteren
3. Het wordt "Actief" (blauw gemarkeerd)

### Stap 4: Tarieven Instellen (als van toepassing)
1. Scroll naar "Tarieven voor [Huishouden]"
2. Vul de prijzen in:
   - Gas prijs (€/m³)
   - Water prijs (€/m³)
   - Elektriciteit hoog tarief (€/kWh)
   - Elektriciteit laag tarief (€/kWh)
3. Klik "**Tarieven Opslaan**"

---

## 📱 Mobiele Toegang

### Belangrijk!
**Beide devices moeten dezelfde URL gebruiken** voor data-synchronisatie!

### Opstelling

#### Op Desktop/Laptop:
1. Start de app: `npm run dev`
2. Noteer de **Network URL**: `http://192.168.0.X:5173`
3. Open deze URL in je desktop browser (NIET localhost!)

#### Op Mobiel:
1. Zorg dat mobiel in **hetzelfde WiFi-netwerk** is als laptop
2. Open dezelfde URL: `http://192.168.0.X:5173`
3. Alles is automatisch gesynchroniseerd!

### Functies Mobiel:
- ✅ Responsive design (automatisch aangepast aan schermgrootte)
- ✅ Menu-toggle (☰ knop) op kleine schermen
- ✅ Alle data real-time gesynchroniseerd
- ✅ Volledig touch-optimized

---

## 🎯 Functionaliteit

### Dashboard
- **Statistieken**: Gasverbruik, waterverbruik, elektriciteit, totale kosten
- **Trends**: Grafieken van het verbruik over tijd
- **P1 Meter**: Live energieverbruik (als HomeWizard geconnecteerd)
- **Dynamische Tarieven**: Zonneplan integratie (optioneel)

### Meterstanden Invoeren
- **Handmatig invoeren**: Datum + waarde
- **Uitlezen P1 Meter**: Automatisch ophalen via HomeWizard
- **Bulk Import**: Excel/CSV bestand uploaden met historische data

### AI Analyse (Placeholder)
Voor toekomstige AI-functies

### Instellingen
- Huishoudens beheren
- Tarieven instellen
- HomeWizard P1 integratie
- Leverancier keuze

---

## 🔧 Commando's

| Commando | Beschrijving |
|----------|------------|
| `npm install` | Installeer alle dependencies |
| `npm run dev` | Start development server met hot reload |
| `npm run build` | Bouw optimized production versie |
| `npm run preview` | Preview production build lokaal |
| `npm run lint` | Controleer code op fouten |

---

## 🐛 Troubleshooting

### "Port 5173 is already in use"
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID [PID] /F

# macOS/Linux
lsof -i :5173
kill -9 [PID]
```

Of start op ander port:
```bash
npm run dev -- --port 3000
```

### Data wordt niet opgeslagen
1. **Check je browser console** (F12)
2. **Zorg dat beide devices dezelfde URL gebruiken** (niet localhost vs IP!)
3. **Probeer IndexedDB reset**:
   - DevTools → Application → IndexedDB → UtilityInsight-DB → Delete

### "Geen huishouden geselecteerd" op mobiel
- Zorg dat desktop en mobiel dezelfde origin gebruiken (beide IP-adres)
- IndexedDB is origin-specifiek - localhost en IP zijn verschillende databases!

### HomeWizard P1 Meter werkt niet
1. **Check het IP-adres**: Ga naar `http://[IP-van-P1-meter]/api/v1/data` in browser
2. **Zorg dat beide devices in hetzelfde netwerk zijn**
3. **P1 Meter offline?**: Controleer of de meter aan staat en correct is ingesteld

### App is traag
- Zorg dat je geen honderden meterstanden hebt zonder te archiveren
- Clear cache: DevTools → Application → Clear site data
- Probeer `npm run build` en `npm run preview` voor production mode

### Browser error: "crypto.randomUUID is not a function"
- Dit zou nu niet meer moeten gebeuren (is gerepareerd)
- Als het toch gebeurt, clear cache en herlaad de pagina

### Fout bij Excel import
- Zorg dat je Excel file kolommen heeft met namen als: "Datum", "Gas", "Water", "Elektriciteit"
- Controleer datumformaat (YYYY-MM-DD of similar)
- Try CSV format i.p.v. Excel

---

## 📊 Data Storage

### Waar worden gegevens opgeslagen?
Alle data wordt opgeslagen in **IndexedDB** (browser local storage):
- **Database naam**: `UtilityInsight-DB`
- **Opslag**: Max ~50MB (afhankelijk van browser)
- **Sync**: Niet automatisch naar cloud

### Data Backup
Momenteel geen cloud sync. Voor backup:
1. Exporteer je meter standen naar Excel
2. Bewaar je instellingen ergens veilig

---

## 🔐 Privacy & Security

- ✅ Alle data wordt **lokaal opgeslagen** (niet naar server)
- ✅ Geen cloud synchronisatie
- ✅ Geen login/authentication vereist
- ✅ Geen tracking of analytics
- ⚠️ Data is **niet versleuteld** op lokale opslag

---

## 📞 Support

### Controleer eerst:
1. Node.js en npm zijn geïnstalleerd
2. Dependencies zijn geïnstalleerd (`npm install`)
3. Je gebruikt dezelfde URL op alle devices (IP-adres, niet localhost)
4. Browser console heeft geen errors (F12)
5. Cache is geleegd (DevTools → Application → Clear site data)

### Logs Controleren:
```bash
# Open browser DevTools (F12)
# Ga naar Console tab
# Kijk voor rode errors
```

---

## 📝 Tips & Tricks

- 💡 Exporteer je meter data regelmatig als backup
- 💡 Gebruik de bulk import voor oude meterstanden
- 💡 Check je tarieven regelmatig voor correctheid
- 💡 HomeWizard P1 meter geeft live verbruik (handig om apparaten te zien)
- 💡 Op mobiel: bookmark de Network URL voor snelle toegang

---

## 🚀 Next Steps

1. App starten: `npm run dev`
2. Huishouden toevoegen via Settings
3. Eerste meterstand invoeren
4. Dashboard bekijken met trends
5. Op mobiel: dezelfde URL gebruiken

Veel plezier met het bijhouden van je meterstanden! 📊
