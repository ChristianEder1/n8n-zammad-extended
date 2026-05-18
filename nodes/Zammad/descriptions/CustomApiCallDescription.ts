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
        type: 'string',
        required: true,
        displayOptions: { show: { resource: ['customApiCall'], operation: ['execute'] } },
        default: '',
        placeholder: '/api/v1/object_manager_attributes?object=Ticket',
        description:
            'Pfad des Zammad-API-Endpunkts. Muss mit / beginnen. Beispiele: /api/v1/tickets, /api/v1/users/search',
    },
    {
        displayName: 'Query-Parameter',
        name: 'queryParameters',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        displayOptions: { show: { resource: ['customApiCall'], operation: ['execute'] } },
        placeholder: 'Parameter hinzufügen',
        default: {},
        description: 'URL-Query-Parameter (z. B. object=Ticket, per_page=100)',
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
