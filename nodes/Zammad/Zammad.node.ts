import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IDataObject,
    NodeOperationError,
} from 'n8n-workflow';

import {
    ticketOperations,
    ticketFields,
    articleOperations,
    articleFields,
    userOperations,
    userFields,
    organizationOperations,
    organizationFields,
    tagOperations,
    tagFields,
} from './descriptions';

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

/**
 * Baut aus den UI-Filtern einen Elasticsearch-kompatiblen Zammad-Query-String.
 * Leere Filter ergeben "*" (alle Tickets).
 */
function buildTicketQuery(filters: IDataObject): string {
    const parts: string[] = [];

    const status = filters.status as string[] | undefined;
    if (status && status.length > 0) {
        const joined = status.map((s) => `"${s}"`).join(' ');
        parts.push(`state.name:(${joined})`);
    }

    const priority = filters.priority as string[] | undefined;
    if (priority && priority.length > 0) {
        const joined = priority.map((p) => `"${p}"`).join(' ');
        parts.push(`priority.name:(${joined})`);
    }

    if (filters.group) {
        parts.push(`group.name:"${esc(String(filters.group))}"`);
    }

    if (filters.owner) {
        parts.push(`owner.email:"${esc(String(filters.owner))}"`);
    }

    if (filters.customer) {
        parts.push(`customer.email:"${esc(String(filters.customer))}"`);
    }

    if (filters.organization) {
        parts.push(`organization.name:"${esc(String(filters.organization))}"`);
    }

    if (filters.createdAfter) {
        const d = new Date(filters.createdAfter as string);
        if (!isNaN(d.getTime())) {
            parts.push(`created_at:>=${d.toISOString()}`);
        }
    }

    if (filters.updatedAfter) {
        const d = new Date(filters.updatedAfter as string);
        if (!isNaN(d.getTime())) {
            parts.push(`updated_at:>=${d.toISOString()}`);
        }
    }

    if (filters.customQuery) {
        parts.push(`(${String(filters.customQuery)})`);
    }

    return parts.length > 0 ? parts.join(' AND ') : '*';
}

/**
 * Baut je nach gewähltem Suchtyp den passenden Query-String.
 */
function buildSearchQuery(query: string, searchIn: string): string {
    const escaped = esc(query);
    switch (searchIn) {
        case 'phone':
            // Suche in Kundenprofil-Telefonnummer
            return `customer.phone:"${escaped}" OR customer.mobile:"${escaped}"`;
        case 'number':
            return `number:${query}`;
        case 'title':
            return `title:"${escaped}"`;
        default:
            // fulltext – unverändert übergeben
            return query;
    }
}

/** Escape für Elasticsearch-Anführungszeichen */
function esc(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Extrahiert Tickets aus der Zammad-Suchantwort.
 * Zammad liefert: { assets: { Ticket: { "1": {...}, "2": {...} } }, result: [{id:1,type:"Ticket"},...] }
 * Das result-Array bewahrt die Sortierreihenfolge.
 */
function extractTicketsFromSearchResult(raw: IDataObject): IDataObject[] {
    if (raw.assets && (raw.assets as IDataObject).Ticket) {
        const ticketMap = (raw.assets as IDataObject).Ticket as Record<string, IDataObject>;
        const resultList = (raw.result as Array<{ id: number; type: string }>) || [];
        return resultList
            .filter((r) => r.type === 'Ticket')
            .map((r) => ticketMap[String(r.id)])
            .filter(Boolean);
    }
    // Fallback: falls Zammad direkt ein Array zurückgibt
    if (Array.isArray(raw)) return raw as IDataObject[];
    return [];
}

// ─── Node-Klasse ─────────────────────────────────────────────────────────────

export class Zammad implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Zammad Extended',
        name: 'zammadExtended',
        icon: 'file:zammad.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
        description:
            'Zammad Helpdesk – erweiterte Filter, Tickets, Artikel, Benutzer, Organisationen und Tags',
        defaults: { name: 'Zammad Extended' },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [{ name: 'zammadApi', required: true }],
        properties: [
            {
                displayName: 'Ressource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    { name: 'Ticket', value: 'ticket' },
                    { name: 'Artikel (Kommentar)', value: 'article' },
                    { name: 'Benutzer', value: 'user' },
                    { name: 'Organisation', value: 'organization' },
                    { name: 'Tag', value: 'tag' },
                ],
                default: 'ticket',
            },
            ...ticketOperations,
            ...ticketFields,
            ...articleOperations,
            ...articleFields,
            ...userOperations,
            ...userFields,
            ...organizationOperations,
            ...organizationFields,
            ...tagOperations,
            ...tagFields,
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        const credentials = await this.getCredentials('zammadApi');
        const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
        const apiToken = credentials.apiToken as string;

        // ── Generischer HTTP-Helfer ──────────────────────────────────────────────
        const req = async (
            method: 'GET' | 'POST' | 'PUT' | 'DELETE',
            path: string,
            opts: { qs?: IDataObject; body?: IDataObject } = {},
        ): Promise<unknown> => {
            return this.helpers.httpRequest({
                method,
                url: `${baseUrl}${path}`,
                headers: {
                    Authorization: `Token token=${apiToken}`,
                    'Content-Type': 'application/json',
                },
                qs: opts.qs,
                body: opts.body,
                json: true,
            });
        };

        const resource = this.getNodeParameter('resource', 0) as string;
        const operation = this.getNodeParameter('operation', 0) as string;

        for (let i = 0; i < items.length; i++) {
            try {
                // ════════════════════════════════════════════════════════════════════
                //  TICKET
                // ════════════════════════════════════════════════════════════════════
                if (resource === 'ticket') {

                    // ── GET (single) ────────────────────────────────────────────────
                    if (operation === 'get') {
                        const id = this.getNodeParameter('ticketId', i) as number;
                        const result = await req('GET', `/api/v1/tickets/${id}`);
                        returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
                    }

                    // ── GET ALL (mit Filtern über Zammad Search-API) ─────────────────
                    else if (operation === 'getAll') {
                        const limit = this.getNodeParameter('limit', i, 25) as number;
                        const sortBy = this.getNodeParameter('sortBy', i, 'created_at') as string;
                        const order = this.getNodeParameter('sortOrder', i, 'desc') as string;
                        const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

                        const query = buildTicketQuery(filters);

                        const raw = await req('GET', '/api/v1/tickets/search', {
                            qs: {
                                query,
                                limit: String(limit),
                                sort_by: sortBy,
                                order_by: order,
                            },
                        });

                        const tickets = extractTicketsFromSearchResult(raw as IDataObject);
                        for (const t of tickets) {
                            returnData.push({ json: t, pairedItem: { item: i } });
                        }
                    }

                    // ── SEARCH ──────────────────────────────────────────────────────
                    else if (operation === 'search') {
                        const rawQuery = this.getNodeParameter('query', i) as string;
                        const searchIn = this.getNodeParameter('searchIn', i, 'fulltext') as string;
                        const limit = this.getNodeParameter('searchLimit', i, 25) as number;

                        const query = buildSearchQuery(rawQuery, searchIn);

                        const raw = await req('GET', '/api/v1/tickets/search', {
                            qs: { query, limit: String(limit) },
                        });

                        const tickets = extractTicketsFromSearchResult(raw as IDataObject);
                        for (const t of tickets) {
                            returnData.push({ json: t, pairedItem: { item: i } });
                        }
                    }

                    // ── CREATE ──────────────────────────────────────────────────────
                    else if (operation === 'create') {
                        const title = this.getNodeParameter('title', i) as string;
                        const group = this.getNodeParameter('createGroup', i) as string;
                        const customerEmail = this.getNodeParameter('customerEmail', i) as string;
                        const articleBody = this.getNodeParameter('articleBody', i) as string;
                        const add = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

                        const body: IDataObject = {
                            title,
                            group,
                            customer: customerEmail,
                            state: add.state ?? 'new',
                            priority: add.priority ?? '2 normal',
                            article: {
                                subject: add.articleSubject ?? title,
                                body: articleBody,
                                type: add.articleType ?? 'note',
                                content_type: add.contentType ?? 'text/plain',
                                internal: add.internal ?? false,
                            },
                        };

                        if (add.owner) body.owner = add.owner;

                        const result = await req('POST', '/api/v1/tickets', { body });
                        returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
                    }

                    // ── UPDATE ──────────────────────────────────────────────────────
                    else if (operation === 'update') {
                        const id = this.getNodeParameter('ticketId', i) as number;
                        const fields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

                        const body: IDataObject = {};
                        if (fields.title) body.title = fields.title;
                        if (fields.group) body.group = fields.group;
                        if (fields.state) body.state = fields.state;
                        if (fields.priority) body.priority = fields.priority;
                        if (fields.owner) body.owner = fields.owner;
                        if (fields.customer) body.customer = fields.customer;

                        const result = await req('PUT', `/api/v1/tickets/${id}`, { body });
                        returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
                    }

                    // ── DELETE ──────────────────────────────────────────────────────
                    else if (operation === 'delete') {
                        const id = this.getNodeParameter('ticketId', i) as number;
                        await req('DELETE', `/api/v1/tickets/${id}`);
                        returnData.push({ json: { success: true, id }, pairedItem: { item: i } });
                    }

                }

                // ════════════════════════════════════════════════════════════════════
                //  ARTICLE
                // ════════════════════════════════════════════════════════════════════
                else if (resource === 'article') {

                    if (operation === 'getAll') {
                        const ticketId = this.getNodeParameter('ticketId', i) as number;
                        const result = await req('GET', `/api/v1/ticket_articles/by_ticket/${ticketId}`);
                        for (const article of result as IDataObject[]) {
                            returnData.push({ json: article, pairedItem: { item: i } });
                        }
                    }

                    else if (operation === 'create') {
                        const ticketId = this.getNodeParameter('ticketId', i) as number;
                        const body_ = this.getNodeParameter('body', i) as string;
                        const add = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

                        const body: IDataObject = {
                            ticket_id: ticketId,
                            subject: add.subject ?? '',
                            body: body_,
                            type: add.type ?? 'note',
                            content_type: add.contentType ?? 'text/plain',
                            internal: add.internal ?? false,
                        };

                        if (add.to) body.to = add.to;
                        if (add.cc) body.cc = add.cc;

                        const result = await req('POST', '/api/v1/ticket_articles', { body });
                        returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
                    }
                }

                // ════════════════════════════════════════════════════════════════════
                //  USER
                // ════════════════════════════════════════════════════════════════════
                else if (resource === 'user') {

                    if (operation === 'get') {
                        const id = this.getNodeParameter('userId', i) as number;
                        const result = await req('GET', `/api/v1/users/${id}`);
                        returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
                    }

                    else if (operation === 'getAll') {
                        const limit = this.getNodeParameter('limit', i, 25) as number;
                        const page = this.getNodeParameter('page', i, 1) as number;
                        const result = await req('GET', '/api/v1/users', {
                            qs: { per_page: String(limit), page: String(page) },
                        });
                        for (const user of result as IDataObject[]) {
                            returnData.push({ json: user, pairedItem: { item: i } });
                        }
                    }

                    else if (operation === 'search') {
                        const query = this.getNodeParameter('query', i) as string;
                        const limit = this.getNodeParameter('searchLimit', i, 25) as number;
                        const result = await req('GET', '/api/v1/users/search', {
                            qs: { query, limit: String(limit) },
                        });
                        for (const user of result as IDataObject[]) {
                            returnData.push({ json: user, pairedItem: { item: i } });
                        }
                    }

                    else if (operation === 'create') {
                        const firstname = this.getNodeParameter('firstname', i) as string;
                        const lastname = this.getNodeParameter('lastname', i) as string;
                        const email = this.getNodeParameter('email', i) as string;
                        const add = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

                        const body: IDataObject = { firstname, lastname, email };
                        if (add.phone) body.phone = add.phone;
                        if (add.mobile) body.mobile = add.mobile;
                        if (add.organization) body.organization = add.organization;
                        if (add.note) body.note = add.note;
                        if (add.roles) body.roles = [add.roles];

                        const result = await req('POST', '/api/v1/users', { body });
                        returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
                    }

                    else if (operation === 'update') {
                        const id = this.getNodeParameter('userId', i) as number;
                        const fields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

                        const body: IDataObject = {};
                        if (fields.firstname) body.firstname = fields.firstname;
                        if (fields.lastname) body.lastname = fields.lastname;
                        if (fields.email) body.email = fields.email;
                        if (fields.phone) body.phone = fields.phone;
                        if (fields.mobile) body.mobile = fields.mobile;
                        if (fields.organization) body.organization = fields.organization;
                        if (fields.note) body.note = fields.note;

                        const result = await req('PUT', `/api/v1/users/${id}`, { body });
                        returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
                    }
                }

                // ════════════════════════════════════════════════════════════════════
                //  ORGANIZATION
                // ════════════════════════════════════════════════════════════════════
                else if (resource === 'organization') {

                    if (operation === 'get') {
                        const id = this.getNodeParameter('organizationId', i) as number;
                        const result = await req('GET', `/api/v1/organizations/${id}`);
                        returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
                    }

                    else if (operation === 'getAll') {
                        const limit = this.getNodeParameter('limit', i, 25) as number;
                        const page = this.getNodeParameter('page', i, 1) as number;
                        const result = await req('GET', '/api/v1/organizations', {
                            qs: { per_page: String(limit), page: String(page) },
                        });
                        for (const org of result as IDataObject[]) {
                            returnData.push({ json: org, pairedItem: { item: i } });
                        }
                    }

                    else if (operation === 'search') {
                        const query = this.getNodeParameter('query', i) as string;
                        const limit = this.getNodeParameter('searchLimit', i, 25) as number;
                        const result = await req('GET', '/api/v1/organizations/search', {
                            qs: { query, limit: String(limit) },
                        });
                        for (const org of result as IDataObject[]) {
                            returnData.push({ json: org, pairedItem: { item: i } });
                        }
                    }

                    else if (operation === 'create') {
                        const name = this.getNodeParameter('name', i) as string;
                        const add = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

                        const body: IDataObject = { name };
                        if (add.domain) body.domain = add.domain;
                        if (add.note) body.note = add.note;
                        if (add.domainAssignment !== undefined) body.domain_assignment = add.domainAssignment;
                        if (add.active !== undefined) body.active = add.active;

                        const result = await req('POST', '/api/v1/organizations', { body });
                        returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
                    }

                    else if (operation === 'update') {
                        const id = this.getNodeParameter('organizationId', i) as number;
                        const fields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

                        const body: IDataObject = {};
                        if (fields.name) body.name = fields.name;
                        if (fields.domain) body.domain = fields.domain;
                        if (fields.note) body.note = fields.note;

                        const result = await req('PUT', `/api/v1/organizations/${id}`, { body });
                        returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
                    }
                }

                // ════════════════════════════════════════════════════════════════════
                //  TAG
                // ════════════════════════════════════════════════════════════════════
                else if (resource === 'tag') {

                    if (operation === 'getAll') {
                        const ticketId = this.getNodeParameter('ticketId', i) as number;
                        const result = await req('GET', '/api/v1/tags', {
                            qs: { object: 'Ticket', o_id: String(ticketId) },
                        });
                        returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
                    }

                    else if (operation === 'add') {
                        const ticketId = this.getNodeParameter('ticketId', i) as number;
                        const tag = this.getNodeParameter('tag', i) as string;
                        await req('POST', '/api/v1/tags/add', {
                            body: { object: 'Ticket', o_id: ticketId, item: tag },
                        });
                        returnData.push({ json: { success: true, ticket_id: ticketId, tag }, pairedItem: { item: i } });
                    }

                    else if (operation === 'remove') {
                        const ticketId = this.getNodeParameter('ticketId', i) as number;
                        const tag = this.getNodeParameter('tag', i) as string;
                        await req('DELETE', '/api/v1/tags/remove', {
                            body: { object: 'Ticket', o_id: ticketId, item: tag },
                        });
                        returnData.push({ json: { success: true, ticket_id: ticketId, tag }, pairedItem: { item: i } });
                    }
                }

            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: (error as Error).message },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
            }
        }

        return [returnData];
    }
}
