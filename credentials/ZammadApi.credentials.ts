import {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class ZammadApi implements ICredentialType {
    name = 'zammadApi';
    displayName = 'Zammad API';
    documentationUrl = 'https://docs.zammad.org/en/latest/api/intro.html';

    properties: INodeProperties[] = [
        {
            displayName: 'Base URL',
            name: 'baseUrl',
            type: 'string',
            default: 'https://ticket.supportportal.online',
            placeholder: 'https://your-zammad.example.com',
            description: 'URL eures Zammad-Servers (ohne abschließenden Slash)',
            required: true,
        },
        {
            displayName: 'API Token',
            name: 'apiToken',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            description:
                'API-Token aus dem Zammad-Profil (Profil → Token-Zugang → neues Token erstellen)',
            required: true,
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '=Token token={{$credentials.apiToken}}',
            },
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: '={{$credentials.baseUrl}}',
            url: '/api/v1/users/me',
        },
    };
}
