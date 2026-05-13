import { INodeProperties } from 'n8n-workflow';

export const articleOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['article'] } },
        options: [
            {
                name: 'Alle abrufen',
                value: 'getAll',
                description: 'Alle Artikel (Kommentare) eines Tickets abrufen',
                action: 'Get all articles of a ticket',
            },
            {
                name: 'Hinzufügen',
                value: 'create',
                description: 'Neuen Artikel / Antwort zu einem Ticket hinzufügen',
                action: 'Add an article to a ticket',
            },
        ],
        default: 'getAll',
    },
];

export const articleFields: INodeProperties[] = [
    // ─── Ticket-ID für beide Operationen ─────────────────────────────────────────
    {
        displayName: 'Ticket-ID',
        name: 'ticketId',
        type: 'number',
        required: true,
        displayOptions: { show: { resource: ['article'], operation: ['getAll', 'create'] } },
        default: 0,
        description: 'ID des Tickets, dessen Artikel abgerufen oder ergänzt werden sollen',
    },

    // ─── CREATE ──────────────────────────────────────────────────────────────────
    {
        displayName: 'Nachricht',
        name: 'body',
        type: 'string',
        required: true,
        typeOptions: { rows: 5 },
        displayOptions: { show: { resource: ['article'], operation: ['create'] } },
        default: '',
        description: 'Inhalt des neuen Artikels',
    },
    {
        displayName: 'Weitere Felder',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Feld hinzufügen',
        default: {},
        displayOptions: { show: { resource: ['article'], operation: ['create'] } },
        options: [
            {
                displayName: 'Betreff',
                name: 'subject',
                type: 'string',
                default: '',
                description: 'Betreff des Artikels',
            },
            {
                displayName: 'Typ',
                name: 'type',
                type: 'options',
                options: [
                    { name: 'Notiz', value: 'note' },
                    { name: 'E-Mail', value: 'email' },
                    { name: 'Telefon', value: 'phone' },
                    { name: 'Web', value: 'web' },
                ],
                default: 'note',
            },
            {
                displayName: 'Inhaltstyp',
                name: 'contentType',
                type: 'options',
                options: [
                    { name: 'Klartext (text/plain)', value: 'text/plain' },
                    { name: 'HTML (text/html)', value: 'text/html' },
                ],
                default: 'text/plain',
            },
            {
                displayName: 'Interne Notiz',
                name: 'internal',
                type: 'boolean',
                default: false,
                description: 'Wenn aktiv, ist der Artikel nur für Agenten sichtbar',
            },
            {
                displayName: 'An (To)',
                name: 'to',
                type: 'string',
                default: '',
                description: 'Empfänger-E-Mail (nur bei Typ "E-Mail")',
            },
            {
                displayName: 'CC',
                name: 'cc',
                type: 'string',
                default: '',
                description: 'CC-Empfänger (nur bei Typ "E-Mail")',
            },
        ],
    },
];
