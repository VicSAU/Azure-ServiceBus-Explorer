import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusAdministrationClient } from '@azure/service-bus';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
    try {
        const { connectionString } = await request.json();

        if (!connectionString) {
            return NextResponse.json({ error: 'Connection string is required' }, { status: 400 });
        }

        const adminClient = new ServiceBusAdministrationClient(connectionString);
        const topics = [];

        let retryCount = 0;
        let success = false;

        while (!success && retryCount < MAX_RETRIES) {
            try {
                for await (const topic of adminClient.listTopics()) {
                    const subscriptions = [];
                    for await (const subscription of adminClient.listSubscriptions(topic.name)) {
                        subscriptions.push(subscription.subscriptionName);
                    }
                    topics.push({
                        name: topic.name,
                        subscriptions,
                    });
                }
                success = true;
            } catch (error: any) {
                retryCount++;
                if (retryCount >= MAX_RETRIES) {
                    throw error;
                }

                const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount - 1);
                console.log(`Retry ${retryCount}/${MAX_RETRIES} after ${delay}ms...`);
                await sleep(delay);
            }
        }

        return NextResponse.json({ topics });
    } catch (error: any) {
        console.error('List topics error:', error);

        let errorMessage = error.message || 'Failed to list topics';

        if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timed out. Port 5671 (AMQP) may be blocked by firewall.';
        } else if (error.code === 'EADDRNOTAVAIL') {
            errorMessage = 'Network address not available. Check your network configuration or VPN.';
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
