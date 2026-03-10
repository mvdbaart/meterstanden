import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../data/db.json');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Ensure the data directory exists
async function ensureDb() {
    try {
        await fs.access(dbPath);
    } catch {
        const initialData = {
            households: [],
            meter_readings: [],
            tariffs: []
        };
        await fs.mkdir(path.dirname(dbPath), { recursive: true });
        await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2));
    }
}

async function readDb() {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
}

async function saveDb(data) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// API Routes
app.get('/api/households', async (req, res) => {
    const db = await readDb();
    res.json(db.households);
});

app.post('/api/households', async (req, res) => {
    const db = await readDb();
    const existingIndex = db.households.findIndex(h => h.id === req.body.id);
    if (existingIndex >= 0) {
        db.households[existingIndex] = req.body;
    } else {
        db.households.push(req.body);
    }
    await saveDb(db);
    res.json(req.body);
});

app.get('/api/tariffs/:household_id', async (req, res) => {
    const db = await readDb();
    const tariffs = db.tariffs.find(t => t.household_id === req.params.household_id);
    res.json(tariffs || null);
});

app.post('/api/tariffs', async (req, res) => {
    const db = await readDb();
    const existingIndex = db.tariffs.findIndex(t => t.household_id === req.body.household_id);
    if (existingIndex >= 0) {
        db.tariffs[existingIndex] = req.body;
    } else {
        db.tariffs.push(req.body);
    }
    await saveDb(db);
    res.json(req.body);
});

app.get('/api/meter_readings/:household_id', async (req, res) => {
    const db = await readDb();
    let readings = db.meter_readings.filter(r => r.household_id === req.params.household_id);
    if (req.query.type) {
        readings = readings.filter(r => r.type === req.query.type);
    }
    res.json(readings);
});

app.post('/api/meter_readings', async (req, res) => {
    const db = await readDb();
    const reading = req.body;
    const existingIndex = db.meter_readings.findIndex(r => r.id === reading.id);
    if (existingIndex >= 0) {
        db.meter_readings[existingIndex] = reading;
    } else {
        db.meter_readings.push(reading);
    }
    await saveDb(db);
    res.json(reading);
});

app.put('/api/meter_readings/:id', async (req, res) => {
    const db = await readDb();
    const index = db.meter_readings.findIndex(r => r.id === req.params.id);
    if (index >= 0) {
        db.meter_readings[index] = { ...db.meter_readings[index], ...req.body };
        await saveDb(db);
        res.json(db.meter_readings[index]);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.delete('/api/meter_readings/:id', async (req, res) => {
    const db = await readDb();
    db.meter_readings = db.meter_readings.filter(r => r.id !== req.params.id);
    await saveDb(db);
    res.json({ success: true });
});

app.post('/api/meter_readings/batch', async (req, res) => {
    const db = await readDb();
    const readings = req.body;
    for (const reading of readings) {
        const existingIndex = db.meter_readings.findIndex(r => r.id === reading.id);
        if (existingIndex >= 0) {
            db.meter_readings[existingIndex] = reading;
        } else {
            db.meter_readings.push(reading);
        }
    }
    await saveDb(db);
    res.json({ count: readings.length });
});

ensureDb().then(() => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running at http://0.0.0.0:${port}`);
    });
});
