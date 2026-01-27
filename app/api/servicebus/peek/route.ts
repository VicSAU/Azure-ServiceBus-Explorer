import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';

export async function POST(request: NextRequest) {
    let sbClient: ServiceBusClient | null = null;

    try {
        const { connectionString, entityName, entityType, subscription, maxMessages = 10 } = await request.json();

        if (!connectionString || !entityName || !entityType) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        if (entityType === 'topic' && !subscription) {
            return NextResponse.json({ error: 'Subscription name is required for topics' }, { status: 400 });
        }

        sbClient = new ServiceBusClient(connectionString);

        const receiver =
            entityType === 'queue'
                ? sbClient.createReceiver(entityName)
                : sbClient.createReceiver(entityName, subscription);

        try {
            const peekedMessages = await receiver.peekMessages(maxMessages);

            const messages = peekedMessages.map((msg) => ({
                messageId: msg.messageId,
                body: msg.body,
                properties: msg.applicationProperties || {},
                enqueuedTimeUtc: msg.enqueuedTimeUtc,
                sequenceNumber: msg.sequenceNumber?.toString(),
            }));

            return NextResponse.json({ messages });
        } finally {
            await receiver.close();
        }
    } catch (error: any) {
        console.error('Peek messages error:', error);

        let errorMessage = error.message || 'Failed to peek messages';

        if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timed out. Port 5671 (AMQP) may be blocked by firewall.';
        } else if (error.code === 'EADDRNOTAVAIL') {
            errorMessage = 'Network address not available. Check your network configuration or VPN.';
        } else if (error.name === 'AggregateError') {
            // AggregateError usually indicates multiple connection failures (e.g., IPv4 and IPv6)
            errorMessage = 'Failed to connect to Service Bus. Port 5671 (AMQP) may be blocked by firewall or network configuration. ' +
                'Please ensure AMQP over TLS (port 5671) is accessible, or check with your network administrator.';
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    } finally {
        if (sbClient) {
            await sbClient.close();
        }
    }
}
