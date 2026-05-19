/**
 * Zammad API Testskript
 * Ausführen: ZAMMAD_URL=https://deine.zammad.de ZAMMAD_TOKEN=dein-token node test-zammad.mjs
 */

const BASE = process.env.ZAMMAD_URL?.replace(/\/$/, '');
const TOKEN = process.env.ZAMMAD_TOKEN;

if (!BASE || !TOKEN) {
    console.error('❌  Bitte Umgebungsvariablen setzen:');
    console.error('   ZAMMAD_URL=https://deine.zammad.de ZAMMAD_TOKEN=dein-api-token node test-zammad.mjs');
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

console.log(`\n${'─'.repeat(60)}\n✅  Tests abgeschlossen\n`);
