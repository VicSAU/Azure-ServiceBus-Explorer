import { NextRequest, NextResponse } from 'next/server';
import { getConnectionById, updateConnection, deleteConnection } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const connection = getConnectionById(parseInt(id));

        if (!connection) {
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }

        return NextResponse.json({ connection });
    } catch (error: any) {
        console.error('Get connection error:', error);
        return NextResponse.json({ error: error.message || 'Failed to get connection' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { name, connectionString } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const connection = updateConnection(parseInt(id), name, connectionString);
        return NextResponse.json({ connection });
    } catch (error: any) {
        console.error('Update connection error:', error);

        if (error.message === 'Connection not found') {
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }

        return NextResponse.json({ error: error.message || 'Failed to update connection' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const success = deleteConnection(parseInt(id));

        if (!success) {
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete connection error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete connection' }, { status: 500 });
    }
}
