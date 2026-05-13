import { INodeProperties } from 'n8n-workflow';

export const tagOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['tag'] } },
        options: [
            {
                name: 'Alle abrufen',
                value: 'getAll',
                description: 'Alle Tags eines Tickets abrufen',
                action: 'Get all tags of a ticket',
            },
            {
                name: 'Hinzufügen',
                value: 'add',
                description: 'Tag zu einem Ticket hinzufügen',
                action: 'Add a tag to a ticket',
            },
            {
                name: 'Entfernen',
                value: 'remove',
                description: 'Tag von einem Ticket entfernen',
                action: 'Remove a tag from a ticket',
            },
        ],
        default: 'getAll',
    },
];

export const tagFields: INodeProperties[] = [
    {
        displayName: 'Ticket-ID',
        name: 'ticketId',
        type: 'number',
        required: true,
        displayOptions: { show: { resource: ['tag'], operation: ['getAll', 'add', 'remove'] } },
        default: 0,
        description: 'ID des Tickets',
    },
    {
        displayName: 'Tag',
        name: 'tag',
        type: 'string',
        required: true,
        displayOptions: { show: { resource: ['tag'], operation: ['add', 'remove'] } },
        default: '',
        placeholder: 'z. B. dringend',
        description: 'Name des Tags (Groß-/Kleinschreibung beachten)',
    },
];
