import { INodeProperties } from 'n8n-workflow';

export const organizationOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['organization'] } },
        options: [
            {
                name: 'Alle abrufen',
                value: 'getAll',
                description: 'Liste aller Organisationen abrufen',
                action: 'Get all organizations',
            },
            {
                name: 'Abrufen',
                value: 'get',
                description: 'Eine Organisation per ID abrufen',
                action: 'Get an organization',
            },
            {
                name: 'Suchen',
                value: 'search',
                description: 'Organisationen per Name suchen',
                action: 'Search organizations',
            },
            {
                name: 'Erstellen',
                value: 'create',
                description: 'Neue Organisation anlegen',
                action: 'Create an organization',
            },
            {
                name: 'Aktualisieren',
                value: 'update',
                description: 'Bestehende Organisation aktualisieren',
                action: 'Update an organization',
            },
            {
                name: 'Mitglieder abrufen',
                value: 'members',
                description: 'Alle Benutzer einer Organisation abrufen',
                action: 'Get members of an organization',
            },
        ],
        default: 'getAll',
    },
];

export const organizationFields: INodeProperties[] = [
    // ─── GET (single) / UPDATE ───────────────────────────────────────────────────
    {
        displayName: 'Organisations-ID',
        name: 'organizationId',
        type: 'number',
        required: true,
        displayOptions: { show: { resource: ['organization'], operation: ['get', 'update', 'members'] } },
        default: 0,
    },

    // ─── GET ALL ─────────────────────────────────────────────────────────────────
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        displayOptions: { show: { resource: ['organization'], operation: ['getAll'] } },
        typeOptions: { minValue: 1, maxValue: 500 },
        default: 25,
    },
    {
        displayName: 'Seite',
        name: 'page',
        type: 'number',
        displayOptions: { show: { resource: ['organization'], operation: ['getAll'] } },
        typeOptions: { minValue: 1 },
        default: 1,
    },
    {
        displayName: 'Name (Filter)',
        name: 'nameFilter',
        type: 'string',
        displayOptions: { show: { resource: ['organization'], operation: ['getAll'] } },
        default: '',
        placeholder: 'z. B. ACME GmbH',
        description: 'Gibt nur Organisationen zurück, deren Name diesen Begriff enthält',
    },

    // ─── MEMBERS ─────────────────────────────────────────────────────────────────
    {
        displayName: 'Limit',
        name: 'membersLimit',
        type: 'number',
        displayOptions: { show: { resource: ['organization'], operation: ['members'] } },
        typeOptions: { minValue: 1, maxValue: 500 },
        default: 100,
        description: 'Maximale Anzahl zurückzugebender Mitglieder',
    },

    // ─── SEARCH ──────────────────────────────────────────────────────────────────
    {
        displayName: 'Suchbegriff',
        name: 'query',
        type: 'string',
        required: true,
        displayOptions: { show: { resource: ['organization'], operation: ['search'] } },
        default: '',
        placeholder: 'z. B. ACME GmbH',
    },
    {
        displayName: 'Limit',
        name: 'searchLimit',
        type: 'number',
        displayOptions: { show: { resource: ['organization'], operation: ['search'] } },
        typeOptions: { minValue: 1, maxValue: 500 },
        default: 25,
    },

    // ─── CREATE ──────────────────────────────────────────────────────────────────
    {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        displayOptions: { show: { resource: ['organization'], operation: ['create'] } },
        default: '',
        description: 'Name der Organisation',
    },
    {
        displayName: 'Weitere Felder',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Feld hinzufügen',
        default: {},
        displayOptions: { show: { resource: ['organization'], operation: ['create'] } },
        options: [
            {
                displayName: 'Domain',
                name: 'domain',
                type: 'string',
                default: '',
                placeholder: 'firma.de',
                description: 'E-Mail-Domain der Organisation',
            },
            {
                displayName: 'Domain-Zuweisung',
                name: 'domainAssignment',
                type: 'boolean',
                default: false,
                description:
                    'Wenn aktiv, werden Benutzer mit passender Domain automatisch dieser Organisation zugewiesen',
            },
            {
                displayName: 'Notiz',
                name: 'note',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Aktiv',
                name: 'active',
                type: 'boolean',
                default: true,
            },
        ],
    },

    // ─── UPDATE ──────────────────────────────────────────────────────────────────
    {
        displayName: 'Zu aktualisierende Felder',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Feld hinzufügen',
        default: {},
        displayOptions: { show: { resource: ['organization'], operation: ['update'] } },
        options: [
            { displayName: 'Name', name: 'name', type: 'string', default: '' },
            { displayName: 'Domain', name: 'domain', type: 'string', default: '' },
            { displayName: 'Notiz', name: 'note', type: 'string', default: '' },
        ],
    },
];
