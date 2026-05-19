/**
 * Zammad API Testskript
 *
 * Variante A – .env Datei (empfohlen):
 *   Kopiere .env.example → .env und trage deine Daten ein, dann:
 *   node test-zammad.mjs
 *
 * Variante B – Umgebungsvariablen direkt:
 *   ZAMMAD_URL=https://deine.zammad.de ZAMMAD_TOKEN=dein-token node test-zammad.mjs
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

// .env Datei laden (falls vorhanden), ohne externe Abhängigkeiten
try {
    const envPath = resolve(process.cwd(), '.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) process.env[key] = val;
    }
} catch {
    // .env nicht vorhanden – Umgebungsvariablen müssen direkt gesetzt sein
}

const BASE = process.env.ZAMMAD_URL?.replace(/\/$/, '');
const TOKEN = process.env.ZAMMAD_TOKEN;

if (!BASE || !TOKEN) {
    console.error('❌  Credentials fehlen. Entweder .env Datei anlegen (siehe .env.example)');
    console.error('   oder: ZAMMAD_URL=https://... ZAMMAD_TOKEN=... node test-zammad.mjs');
    process.exit(1);
}

async function get(path, qs = {}) {
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
        headers: { Authorization: `Token token=${TOKEN}`, 'Content-Type': 'application/json' },
    });
    return { status: res.status, body: await res.json() };
}

async function test(label, fn) {
    process.stdout.write(`\n▶  ${label} ... `);
    try {
        const result = await fn();
        console.log('✅  OK');
        console.log('   ', JSON.stringify(result).slice(0, 200));
    } catch (e) {
        console.log('❌  FEHLER:', e.message);
    }
}

console.log(`\n🔍  Zammad API Tests gegen: ${BASE}\n${'─'.repeat(60)}`);

// 1. Verbindung / Auth prüfen
await test('Auth: aktueller Benutzer (GET /api/v1/users/me)', async () => {
    const { status, body } = await get('/api/v1/users/me');
    if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body)}`);
    return { login: body.login, email: body.email, role: body.role_ids };
});

// 2. Elasticsearch verfügbar?
await test('Elasticsearch: Suche query=* limit=1', async () => {
    const { status, body } = await get('/api/v1/tickets/search', { query: '*', limit: '1' });
    if (body.error) throw new Error(body.error);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    const count = body.result?.length ?? 0;
    return { es_aktiv: true, treffer: count, total: body.count };
});

// 3. Ticket-Liste (ohne ES)
await test('Ticket: Alle abrufen (GET /api/v1/tickets, limit=3)', async () => {
    const { status, body } = await get('/api/v1/tickets', { per_page: '3', page: '1' });
    if (status !== 200) throw new Error(`HTTP ${status}`);
    const count = Array.isArray(body) ? body.length : Object.keys(body).length;
    return { tickets_gefunden: count };
});

// 4. Custom-Field-Suche (tickettype="Kunde")
await test('Elasticsearch: Custom Field tickettype:"Kunde"', async () => {
    const { status, body } = await get('/api/v1/tickets/search', { query: 'tickettype:"Kunde"', limit: '3' });
    if (body.error) throw new Error(body.error);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    return { treffer: body.result?.length ?? 0 };
});

// 5. Benutzer-Suche
await test('Benutzer: Suche query=* limit=1', async () => {
    const { status, body } = await get('/api/v1/users/search', { query: '*', limit: '1' });
    if (status !== 200) throw new Error(`HTTP ${status}`);
    return { treffer: Array.isArray(body) ? body.length : '?' };
});

// ── DIAGNOSE: Rohe Antwortstrukturen ────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}\n  DIAGNOSE – Rohe API-Antworten\n${'═'.repeat(60)}`);

// 6. GET /api/v1/tickets (ohne expand) – Strukturcheck
await test('DIAGNOSE: GET /api/v1/tickets ohne expand (limit=2)', async () => {
    const { status, body } = await get('/api/v1/tickets', { per_page: '2', page: '1' });
    if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body).slice(0, 300)}`);
    const isArray = Array.isArray(body);
    const keys = isArray ? `[Array mit ${body.length} Einträgen]` : Object.keys(body).join(', ');
    console.log('\n  Roh-Keys:', keys);
    if (!isArray && body.tickets) console.log('  body.tickets:', JSON.stringify(body.tickets).slice(0, 100));
    if (!isArray && body.assets?.Ticket) {
        const ticketIds = Object.keys(body.assets.Ticket);
        console.log('  assets.Ticket IDs:', ticketIds.slice(0, 5));
    }
    if (isArray && body.length > 0) console.log('  Ticket[0] keys:', Object.keys(body[0]).join(', '));
    return { isArray, anzahl: isArray ? body.length : JSON.stringify(body.tickets ?? '?') };
});

// 7. GET /api/v1/tickets?expand=true – Strukturcheck
await test('DIAGNOSE: GET /api/v1/tickets?expand=true (limit=2)', async () => {
    const { status, body } = await get('/api/v1/tickets', { per_page: '2', page: '1', expand: 'true' });
    if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body).slice(0, 300)}`);
    const isArray = Array.isArray(body);
    const keys = isArray ? `[Array mit ${body.length} Einträgen]` : Object.keys(body).join(', ');
    console.log('\n  Roh-Keys:', keys);
    if (isArray && body.length > 0) {
        const t = body[0];
        console.log('  Ticket[0] state:', t.state, '| priority:', t.priority, '| group:', t.group);
        console.log('  Ticket[0] alle Keys:', Object.keys(t).join(', '));
    }
    return { isArray, anzahl: isArray ? body.length : '(kein Array)' };
});

// 8. ES Suche – rohe Antwortstruktur
await test('DIAGNOSE: ES Suche /api/v1/tickets/search query=* limit=2', async () => {
    const { status, body } = await get('/api/v1/tickets/search', { query: '*', limit: '2' });
    if (status !== 200) throw new Error(`HTTP ${status}: ${JSON.stringify(body).slice(0, 300)}`);
    const keys = Object.keys(body).join(', ');
    console.log('\n  Roh-Keys:', keys);
    if (body.result) console.log('  body.result (Typ):', Array.isArray(body.result) ? `Array[${body.result.length}]` : typeof body.result);
    if (Array.isArray(body.result) && body.result.length > 0) console.log('  result[0]:', JSON.stringify(body.result[0]));
    if (body.assets?.Ticket) console.log('  assets.Ticket IDs:', Object.keys(body.assets.Ticket).slice(0, 5));
    return { keys, result_count: body.result?.length ?? 0, total: body.count ?? '?' };
});

// 9. Ticket-Stati (wichtig für Filter!)
await test('DIAGNOSE: Alle Ticket-Stati (GET /api/v1/ticket_states)', async () => {
    const { status, body } = await get('/api/v1/ticket_states');
    if (status !== 200) throw new Error(`HTTP ${status}`);
    const states = Array.isArray(body) ? body : [];
    console.log('\n  Stati:');
    for (const s of states) console.log(`    id=${s.id} name="${s.name}" active=${s.active}`);
    return { anzahl: states.length };
});

// 10. Ticket-Prioritäten (wichtig für Filter!)
await test('DIAGNOSE: Alle Ticket-Prioritäten (GET /api/v1/ticket_priorities)', async () => {
    const { status, body } = await get('/api/v1/ticket_priorities');
    if (status !== 200) throw new Error(`HTTP ${status}`);
    const prios = Array.isArray(body) ? body : [];
    console.log('\n  Prioritäten:');
    for (const p of prios) console.log(`    id=${p.id} name="${p.name}" active=${p.active}`);
    return { anzahl: prios.length };
});

console.log(`\n${'─'.repeat(60)}\n✅  Tests abgeschlossen\n`);
