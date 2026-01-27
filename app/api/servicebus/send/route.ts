import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';

export async function POST(request: NextRequest) {
    let sbClient: ServiceBusClient | null = null;

    try {
        const { connectionString, entityName, entityType, messageBody, properties } = await request.json();

        if (!connectionString || !entityName || !entityType) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        sbClient = new ServiceBusClient(connectionString);

        const sender = sbClient.createSender(entityName);

        try {
            await sender.sendMessages({
                body: messageBody,
                applicationProperties: properties || {},
            });

            return NextResponse.json({ success: true });
        } finally {
            await sender.close();
        }
    } catch (error: any) {
        console.error('Send message error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send message' },
            { status: 500 }
        );
    } finally {
        if (sbClient) {
            await sbClient.close();
        }
    }
}
