'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Database, Plug, Save, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { SavedConnection } from '@/lib/db';

interface ConnectionPanelProps {
    onConnect: (connectionString: string) => Promise<void>;
    onDisconnect: () => void;
    isConnected: boolean;
}

export function ConnectionPanel({ onConnect, onDisconnect, isConnected }: ConnectionPanelProps) {
    const [connectionString, setConnectionString] = useState('');
    const [connectionName, setConnectionName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [savedConnections, setSavedConnections] = useState<SavedConnection[]>([]);
    const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');

    useEffect(() => {
        loadSavedConnections();
    }, []);

    const loadSavedConnections = async () => {
        try {
            const response = await fetch('/api/connections');
            if (response.ok) {
                const data = await response.json();
                setSavedConnections(data.connections);
            }
        } catch (error) {
            console.error('Failed to load saved connections:', error);
        }
    };

    const handleConnect = async () => {
        if (!connectionString.trim()) {
            toast.warning('Please enter a connection string');
            return;
        }

        setIsLoading(true);
        try {
            await onConnect(connectionString);
            toast.success('Connected to Service Bus successfully!');
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveConnection = async () => {
        if (!connectionName.trim() || !connectionString.trim()) {
            toast.warning('Please enter both connection name and connection string');
            return;
        }

        try {
            const response = await fetch('/api/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: connectionName, connectionString }),
            });

            if (response.ok) {
                setConnectionName('');
                await loadSavedConnections();
                toast.success('Connection saved successfully!');
            } else {
                const data = await response.json();
                toast.error(`Failed to save: ${data.error}`);
            }
        } catch (error) {
            toast.error('Failed to save connection');
        }
    };

    const handleSelectConnection = (value: string) => {
        setSelectedConnectionId(value);
        const connection = savedConnections.find(c => c.id.toString() === value);
        if (connection) {
            setConnectionString(connection.connectionString);
        }
    };

    const handleDeleteConnection = async () => {
        if (!selectedConnectionId) {
            toast.warning('Please select a connection to delete');
            return;
        }

        if (!confirm('Are you sure you want to delete this connection?')) {
            return;
        }

        try {
            const response = await fetch(`/api/connections/${selectedConnectionId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSelectedConnectionId('');
                setConnectionString('');
                await loadSavedConnections();
                toast.success('Connection deleted successfully!');
            } else {
                toast.error('Failed to delete connection');
            }
        } catch (error) {
            toast.error('Failed to delete connection');
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
                <Database className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">Connection</h2>
            </div>

            <div className="space-y-4">
                {savedConnections.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="saved-connection">Saved Connections</Label>
                        <div className="flex gap-2">
                            <Select value={selectedConnectionId} onValueChange={handleSelectConnection}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a saved connection" />
                                </SelectTrigger>
                                <SelectContent className="bg-stone-100">
                                    {savedConnections.map((conn) => (
                                        <SelectItem key={conn.id} value={conn.id.toString()}>
                                            {conn.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteConnection}
                                disabled={!selectedConnectionId}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="connection-string">Connection String</Label>
                    <Input
                        id="connection-string"
                        type="text"
                        placeholder="Endpoint=sb://..."
                        value={connectionString}
                        onChange={(e) => setConnectionString(e.target.value)}
                        disabled={isConnected}
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={isConnected ? onDisconnect : handleConnect}
                        disabled={isLoading || (!connectionString && !isConnected)}
                        className="flex-1"
                    >
                        <Plug className="h-4 w-4 mr-2" />
                        {isLoading ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                </div>

                {!isConnected && (
                    <div className="pt-4 border-t space-y-2">
                        <Label htmlFor="connection-name">Save Connection As</Label>
                        <Input
                            id="connection-name"
                            placeholder="My Service Bus"
                            value={connectionName}
                            onChange={(e) => setConnectionName(e.target.value)}
                        />
                        <Button onClick={handleSaveConnection} variant="secondary" className="w-full">
                            <Save className="h-4 w-4 mr-2" />
                            Save Connection
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}
