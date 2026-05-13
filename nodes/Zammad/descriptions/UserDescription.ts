import { INodeProperties } from 'n8n-workflow';

export const userOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['user'] } },
        options: [
            {
                name: 'Alle abrufen',
                value: 'getAll',
                description: 'Liste aller Benutzer abrufen',
                action: 'Get all users',
            },
            {
                name: 'Abrufen',
                value: 'get',
                description: 'Einzelnen Benutzer per ID abrufen',
                action: 'Get a user',
            },
            {
                name: 'Suchen',
                value: 'search',
                description: 'Benutzer per Name, E-Mail oder Telefonnummer suchen',
                action: 'Search users',
            },
            {
                name: 'Erstellen',
                value: 'create',
                description: 'Neuen Benutzer anlegen',
                action: 'Create a user',
            },
            {
                name: 'Aktualisieren',
                value: 'update',
                description: 'Bestehenden Benutzer aktualisieren',
                action: 'Update a user',
            },
        ],
        default: 'search',
    },
];

export const userFields: INodeProperties[] = [
    // ─── GET (single) / UPDATE ───────────────────────────────────────────────────
    {
        displayName: 'Benutzer-ID',
        name: 'userId',
        type: 'number',
        required: true,
        displayOptions: { show: { resource: ['user'], operation: ['get', 'update'] } },
        default: 0,
        description: 'Eindeutige numerische ID des Benutzers',
    },

    // ─── GET ALL ─────────────────────────────────────────────────────────────────
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        displayOptions: { show: { resource: ['user'], operation: ['getAll'] } },
        typeOptions: { minValue: 1, maxValue: 500 },
        default: 25,
    },
    {
        displayName: 'Seite',
        name: 'page',
        type: 'number',
        displayOptions: { show: { resource: ['user'], operation: ['getAll'] } },
        typeOptions: { minValue: 1 },
        default: 1,
        description: 'Seitennummer für die Paginierung',
    },

    // ─── SEARCH ──────────────────────────────────────────────────────────────────
    {
        displayName: 'Suchbegriff',
        name: 'query',
        type: 'string',
        required: true,
        displayOptions: { show: { resource: ['user'], operation: ['search'] } },
        default: '',
        placeholder: 'z. B. +4912345678 oder Max Mustermann',
        description: 'Name, E-Mail, Telefonnummer oder Login',
    },
    {
        displayName: 'Limit',
        name: 'searchLimit',
        type: 'number',
        displayOptions: { show: { resource: ['user'], operation: ['search'] } },
        typeOptions: { minValue: 1, maxValue: 500 },
        default: 25,
    },

    // ─── CREATE ──────────────────────────────────────────────────────────────────
    {
        displayName: 'Vorname',
        name: 'firstname',
        type: 'string',
        required: true,
        displayOptions: { show: { resource: ['user'], operation: ['create'] } },
        default: '',
    },
    {
        displayName: 'Nachname',
        name: 'lastname',
        type: 'string',
        required: true,
        displayOptions: { show: { resource: ['user'], operation: ['create'] } },
        default: '',
    },
    {
        displayName: 'E-Mail',
        name: 'email',
        type: 'string',
        required: true,
        displayOptions: { show: { resource: ['user'], operation: ['create'] } },
        default: '',
        placeholder: 'user@firma.de',
    },
    {
        displayName: 'Weitere Felder',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Feld hinzufügen',
        default: {},
        displayOptions: { show: { resource: ['user'], operation: ['create'] } },
        options: [
            {
                displayName: 'Telefon',
                name: 'phone',
                type: 'string',
                default: '',
                placeholder: '+49 30 12345678',
            },
            {
                displayName: 'Mobiltelefon',
                name: 'mobile',
                type: 'string',
                default: '',
                placeholder: '+49 151 12345678',
            },
            {
                displayName: 'Organisation',
                name: 'organization',
                type: 'string',
                default: '',
                description: 'Name der Organisation (muss in Zammad vorhanden sein)',
            },
            {
                displayName: 'Notiz',
                name: 'note',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Rolle',
                name: 'roles',
                type: 'options',
                options: [
                    { name: 'Kunde', value: 'Customer' },
                    { name: 'Agent', value: 'Agent' },
                ],
                default: 'Customer',
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
        displayOptions: { show: { resource: ['user'], operation: ['update'] } },
        options: [
            { displayName: 'Vorname', name: 'firstname', type: 'string', default: '' },
            { displayName: 'Nachname', name: 'lastname', type: 'string', default: '' },
            {
                displayName: 'E-Mail',
                name: 'email',
                type: 'string',
                default: '',
                placeholder: 'user@firma.de',
            },
            { displayName: 'Telefon', name: 'phone', type: 'string', default: '' },
            { displayName: 'Mobiltelefon', name: 'mobile', type: 'string', default: '' },
            { displayName: 'Organisation', name: 'organization', type: 'string', default: '' },
            { displayName: 'Notiz', name: 'note', type: 'string', default: '' },
        ],
    },
];
