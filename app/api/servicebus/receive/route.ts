import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';

export async function POST(request: NextRequest) {
    let sbClient: ServiceBusClient | null = null;

    try {
        const {
            connectionString,
            entityName,
            entityType,
            subscription,
            maxMessages = 10,
            completeMessages = false,
        } = await request.json();

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
            const receivedMessages = await receiver.receiveMessages(maxMessages, { maxWaitTimeInMs: 5000 });

            const messages = receivedMessages.map((msg) => ({
                messageId: msg.messageId,
                body: msg.body,
                properties: msg.applicationProperties || {},
                enqueuedTimeUtc: msg.enqueuedTimeUtc,
                sequenceNumber: msg.sequenceNumber?.toString(),
            }));

            if (completeMessages) {
                for (const msg of receivedMessages) {
                    await receiver.completeMessage(msg);
                }
            }

            return NextResponse.json({ messages });
        } finally {
            await receiver.close();
        }
    } catch (error: any) {
        console.error('Receive messages error:', error);

        let errorMessage = error.message || 'Failed to receive messages';

        if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timed out. Port 5671 (AMQP) may be blocked by firewall.';
        } else if (error.code === 'EADDRNOTAVAIL') {
            errorMessage = 'Network address not available. Check your network configuration or VPN.';
        } else if (error.name === 'AggregateError') {
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
