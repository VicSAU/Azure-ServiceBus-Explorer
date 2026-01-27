import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusAdministrationClient } from '@azure/service-bus';

export async function POST(request: NextRequest) {
    try {
        const { connectionString } = await request.json();

        if (!connectionString) {
            return NextResponse.json({ error: 'Connection string is required' }, { status: 400 });
        }

        const adminClient = new ServiceBusAdministrationClient(connectionString);

        const queues = adminClient.listQueues();
        await queues.next();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Connection error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to connect to Service Bus' },
            { status: 500 }
        );
    }
}
