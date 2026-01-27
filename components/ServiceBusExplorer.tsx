'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { ServiceBusManager, QueueInfo, TopicInfo } from '@/lib/serviceBusManager';
import { ConnectionPanel } from './ConnectionPanel';
import { EntitiesList } from './EntitiesList';
import { MessageOperations } from './MessageOperations';

export function ServiceBusExplorer() {
    const [manager] = useState(() => new ServiceBusManager());
    const [isConnected, setIsConnected] = useState(false);
    const [queues, setQueues] = useState<QueueInfo[]>([]);
    const [topics, setTopics] = useState<TopicInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<{ type: 'queue' | 'topic'; name: string } | null>(null);

    const handleConnect = async (connectionString: string) => {
        setIsLoading(true);
        try {
            await manager.connect(connectionString);
            setIsConnected(true);
            await loadEntities();
        } catch (error) {
            toast.error(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = () => {
        manager.disconnect();
        setIsConnected(false);
        setQueues([]);
        setTopics([]);
        setSelectedEntity(null);
        toast.info('Disconnected from Service Bus');
    };

    const loadEntities = async () => {
        setIsLoading(true);
        try {
            const [queuesData, topicsData] = await Promise.all([
                manager.listQueues(),
                manager.listTopics(),
            ]);
            setQueues(queuesData);
            setTopics(topicsData);
        } catch (error) {
            toast.error(`Failed to load entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <header className="text-center space-y-2">
                <h1 className="text-4xl font-bold mb-8 text-gray-800">🔍 Azure Service Bus Explorer</h1>
                <p className="text-lg">Explore and manage your Service Bus entities</p>
            </header>

            <ConnectionPanel
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                isConnected={isConnected}
            />

            <div className="grid md:grid-cols-[350px_1fr] gap-6">
                <EntitiesList
                    queues={queues}
                    topics={topics}
                    isLoading={isLoading}
                    onRefresh={loadEntities}
                    onSelectQueue={(name) => setSelectedEntity({ type: 'queue', name })}
                    onSelectTopic={(name) => setSelectedEntity({ type: 'topic', name })}
                    selectedEntity={selectedEntity}
                />
                <MessageOperations
                    manager={manager}
                    selectedEntity={selectedEntity}
                    isConnected={isConnected}
                />
            </div>
        </div>
    );
}
