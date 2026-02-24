import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';
import { gunzipSync } from 'zlib';

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
            subQueue,
        } = await request.json();

        if (!connectionString || !entityName || !entityType) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        if (entityType === 'topic' && !subscription) {
            return NextResponse.json({ error: 'Subscription name is required for topics' }, { status: 400 });
        }

        sbClient = new ServiceBusClient(connectionString);

        const receiverOptions = subQueue === 'deadLetter' ? { subQueueType: 'deadLetter' as const } : undefined;

        const receiver =
            entityType === 'queue'
                ? sbClient.createReceiver(entityName, receiverOptions)
                : sbClient.createReceiver(entityName, subscription, receiverOptions);

        try {
            const receivedMessages = await receiver.receiveMessages(maxMessages, { maxWaitTimeInMs: 5000 });

            const messages = receivedMessages.map((msg) => {
                let body = msg.body;

                if (Buffer.isBuffer(body) && body.length >= 2 && body[0] === 0x1f && body[1] === 0x8b) {
                    try {
                        const decompressed = gunzipSync(body);
                        body = decompressed.toString('utf-8');
                    } catch (e) {
                        console.error('Failed to decompress message:', e);
                    }
                }

                if (typeof body === 'string') {
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                    }
                }

                return {
                    messageId: msg.messageId,
                    body: body,
                    properties: msg.applicationProperties || {},
                    enqueuedTimeUtc: msg.enqueuedTimeUtc,
                    sequenceNumber: msg.sequenceNumber?.toString(),
                };
            });

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
