import { INodeProperties } from 'n8n-workflow';

export const customApiCallOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['customApiCall'] } },
        options: [
            {
                name: 'API-Aufruf ausführen',
                value: 'execute',
                action: 'Führe einen benutzerdefinierten Zammad-API-Aufruf aus',
            },
        ],
        default: 'execute',
    },
];

export const customApiCallFields: INodeProperties[] = [
    {
        displayName: 'HTTP-Methode',
        name: 'httpMethod',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['customApiCall'], operation: ['execute'] } },
        options: [
            { name: 'GET', value: 'GET' },
            { name: 'POST', value: 'POST' },
            { name: 'PUT', value: 'PUT' },
            { name: 'PATCH', value: 'PATCH' },
            { name: 'DELETE', value: 'DELETE' },
        ],
        default: 'GET',
    },
    {
        displayName: 'Endpunkt',
        name: 'endpoint',
        type: 'options',
        required: true,
        displayOptions: { show: { resource: ['customApiCall'], operation: ['execute'] } },
        default: '/api/v1/tickets/search',
        description:
            'Zammad-API-Endpunkt. Für dynamische IDs den Expression-Modus (fx) nutzen, z. B. <code>={{"/api/v1/tickets/" + $json.id}}</code>',
        options: [
            // ── Tickets ────────────────────────────────────────────────────────
            {
                name: '── Tickets ──────────────────────',
                value: '/api/v1/tickets',
                description: 'Trennlinie',
            },
            {
                name: 'Ticket: Alle abrufen (paginiert)',
                value: '/api/v1/tickets',
                description: 'GET → Liste aller Tickets',
            },
            {
                name: 'Ticket: Suchen (Elasticsearch)',
                value: '/api/v1/tickets/search',
                description: 'GET → Query-Parameter: query, limit, sort_by, order_by',
            },
            {
                name: 'Ticket: Einzeln abrufen /api/v1/tickets/{id}',
                value: '/api/v1/tickets/1',
                description: 'GET/PUT/DELETE → ID in Endpunkt per Expression ersetzen',
            },
            {
                name: 'Ticket: Erstellen',
                value: '/api/v1/tickets',
                description: 'POST → Neues Ticket anlegen',
            },
            // ── Artikel ────────────────────────────────────────────────────────
            {
                name: '── Artikel (Kommentare) ──────────',
                value: '/api/v1/ticket_articles',
                description: 'Trennlinie',
            },
            {
                name: 'Artikel: Alle abrufen',
                value: '/api/v1/ticket_articles',
                description: 'GET → Alle Ticket-Artikel',
            },
            {
                name: 'Artikel: Nach Ticket /api/v1/ticket_articles/by_ticket/{id}',
                value: '/api/v1/ticket_articles/by_ticket/1',
                description: 'GET → Alle Artikel eines Tickets (ID per Expression)',
            },
            {
                name: 'Artikel: Erstellen',
                value: '/api/v1/ticket_articles',
                description: 'POST → Kommentar/Notiz zu Ticket hinzufügen',
            },
            // ── Benutzer ───────────────────────────────────────────────────────
            {
                name: '── Benutzer ──────────────────────',
                value: '/api/v1/users',
                description: 'Trennlinie',
            },
            {
                name: 'Benutzer: Alle abrufen',
                value: '/api/v1/users',
                description: 'GET → Liste aller Benutzer',
            },
            {
                name: 'Benutzer: Suchen',
                value: '/api/v1/users/search',
                description: 'GET → Query-Parameter: query, limit',
            },
            {
                name: 'Benutzer: Einzeln /api/v1/users/{id}',
                value: '/api/v1/users/1',
                description: 'GET/PUT/DELETE → ID per Expression ersetzen',
            },
            {
                name: 'Benutzer: Aktueller (me)',
                value: '/api/v1/users/me',
                description: 'GET → Eingeloggter Benutzer / Token-Inhaber',
            },
            // ── Organisationen ─────────────────────────────────────────────────
            {
                name: '── Organisationen ────────────────',
                value: '/api/v1/organizations',
                description: 'Trennlinie',
            },
            {
                name: 'Organisation: Alle abrufen',
                value: '/api/v1/organizations',
                description: 'GET → Liste aller Organisationen',
            },
            {
                name: 'Organisation: Suchen',
                value: '/api/v1/organizations/search',
                description: 'GET → Query-Parameter: query, limit',
            },
            {
                name: 'Organisation: Einzeln /api/v1/organizations/{id}',
                value: '/api/v1/organizations/1',
                description: 'GET/PUT/DELETE → ID per Expression ersetzen',
            },
            // ── Gruppen & Rollen ───────────────────────────────────────────────
            {
                name: '── Gruppen & Rollen ──────────────',
                value: '/api/v1/groups',
                description: 'Trennlinie',
            },
            {
                name: 'Gruppen: Alle abrufen',
                value: '/api/v1/groups',
                description: 'GET → Liste aller Gruppen',
            },
            {
                name: 'Rollen: Alle abrufen',
                value: '/api/v1/roles',
                description: 'GET → Liste aller Rollen',
            },
            // ── Status & Prioritäten ───────────────────────────────────────────
            {
                name: '── Status & Prioritäten ──────────',
                value: '/api/v1/ticket_states',
                description: 'Trennlinie',
            },
            {
                name: 'Ticket-Status: Alle abrufen',
                value: '/api/v1/ticket_states',
                description: 'GET → z. B. new, open, closed …',
            },
            {
                name: 'Ticket-Prioritäten: Alle abrufen',
                value: '/api/v1/ticket_priorities',
                description: 'GET → z. B. 1 low, 2 normal, 3 high',
            },
            // ── Tags ───────────────────────────────────────────────────────────
            {
                name: '── Tags ──────────────────────────',
                value: '/api/v1/tag_list',
                description: 'Trennlinie',
            },
            {
                name: 'Tag-Liste: Alle verfügbaren Tags',
                value: '/api/v1/tag_list',
                description: 'GET → Alle konfigurierten Tags',
            },
            {
                name: 'Tags eines Tickets',
                value: '/api/v1/tags',
                description: 'GET → Query-Parameter: object=Ticket, o_id={ticket_id}',
            },
            // ── Übersichten ────────────────────────────────────────────────────
            {
                name: '── Sonstiges ─────────────────────',
                value: '/api/v1/overviews',
                description: 'Trennlinie',
            },
            {
                name: 'Übersichten (Overviews)',
                value: '/api/v1/overviews',
                description: 'GET → Konfigurierte Ticket-Übersichten',
            },
            // ── Custom Fields (Admin) ──────────────────────────────────────────
            {
                name: 'Custom Fields: Ticket-Attribute (Admin)',
                value: '/api/v1/object_manager_attributes',
                description: 'GET → Query-Parameter: object=Ticket — liefert alle Custom-Field-Namen (benötigt Admin-Token)',
            },
            {
                name: 'Custom Fields: Alle Objekte (Admin)',
                value: '/api/v1/object_manager_attributes',
                description: 'GET → Alle Object-Manager-Attribute (Admin)',
            },
            {
                name: 'Kalender: Alle abrufen',
                value: '/api/v1/calendars',
                description: 'GET → SLA-Kalender',
            },
            {
                name: 'SLAs: Alle abrufen',
                value: '/api/v1/slas',
                description: 'GET → SLA-Definitionen',
            },
            {
                name: 'Makros: Alle abrufen',
                value: '/api/v1/macros',
                description: 'GET → Makro-Definitionen',
            },
            {
                name: 'E-Mail-Adressen (Channels)',
                value: '/api/v1/channels',
                description: 'GET → Konfigurierte E-Mail-Channels (Admin)',
            },
            {
                name: 'System-Infos',
                value: '/api/v1/getting_started',
                description: 'GET → Zammad-Instanz-Informationen',
            },
        ],
    },
    {
        displayName: 'Query-Parameter',
        name: 'queryParameters',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        displayOptions: { show: { resource: ['customApiCall'], operation: ['execute'] } },
        placeholder: 'Parameter hinzufügen',
        default: {},
        description: 'URL-Query-Parameter (z. B. object=Ticket, per_page=100, query=*)',
        options: [
            {
                name: 'parameters',
                displayName: 'Parameter',
                values: [
                    { displayName: 'Name', name: 'name', type: 'string', default: '' },
                    { displayName: 'Wert', name: 'value', type: 'string', default: '' },
                ],
            },
        ],
    },
    {
        displayName: 'Body (JSON)',
        name: 'body',
        type: 'json',
        displayOptions: {
            show: {
                resource: ['customApiCall'],
                operation: ['execute'],
                httpMethod: ['POST', 'PUT', 'PATCH'],
            },
        },
        default: '{}',
        description: 'Request-Body als JSON-Objekt',
    },
];

