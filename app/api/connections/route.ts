import { NextRequest, NextResponse } from 'next/server';
import { getAllConnections, createConnection } from '@/lib/db';

export async function GET() {
    try {
        const connections = getAllConnections();
        return NextResponse.json({ connections });
    } catch (error: any) {
        console.error('Get connections error:', error);
        return NextResponse.json({ error: error.message || 'Failed to get connections' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, connectionString } = await request.json();

        if (!name || !connectionString) {
            return NextResponse.json({ error: 'Name and connection string are required' }, { status: 400 });
        }

        const connection = createConnection(name, connectionString);
        return NextResponse.json({ connection }, { status: 201 });
    } catch (error: any) {
        console.error('Create connection error:', error);

        if (error.message?.includes('UNIQUE constraint')) {
            return NextResponse.json({ error: 'A connection with this name already exists' }, { status: 409 });
        }

        return NextResponse.json({ error: error.message || 'Failed to create connection' }, { status: 500 });
    }
}
