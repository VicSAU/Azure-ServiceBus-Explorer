'use client';

import { useState } from 'react';
import { RefreshCw, Search, List, MessageSquare, Mail, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { QueueInfo, TopicInfo } from '@/lib/serviceBusManager';

interface EntitiesListProps {
    queues: QueueInfo[];
    topics: TopicInfo[];
    isLoading: boolean;
    onRefresh: () => void;
    onSelectQueue: (name: string) => void;
    onSelectTopic: (name: string) => void;
    selectedEntity: { type: 'queue' | 'topic'; name: string } | null;
}

export function EntitiesList({
    queues,
    topics,
    isLoading,
    onRefresh,
    onSelectQueue,
    onSelectTopic,
    selectedEntity,
}: EntitiesListProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredQueues = queues.filter((q) =>
        q.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTopics = topics.filter((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <List className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-semibold">Entities</h2>
                </div>
                <Button onClick={onRefresh} disabled={isLoading} variant="outline" size="sm" className="hover:bg-stone-200">
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Loading...' : 'Refresh'}
                </Button>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search queues or topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <Tabs defaultValue="queues">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="queues" className="flex items-center gap-2 hover:bg-stone-200">
                            <Mail className="h-4 w-4" />
                            Queues ({filteredQueues.length})
                        </TabsTrigger>
                        <TabsTrigger value="topics" className="flex items-center gap-2 hover:bg-stone-200">
                            <MessageSquare className="h-4 w-4" />
                            Topics ({filteredTopics.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="queues" className="space-y-2 mt-4 ">
                        {filteredQueues.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No queues found</p>
                        ) : (
                            filteredQueues.map((queue) => (
                                <div
                                    key={queue.name}
                                    onClick={() => onSelectQueue(queue.name)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedEntity?.type === 'queue' && selectedEntity?.name === queue.name
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-stone-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        <span className="font-medium">{queue.name}</span>
                                    </div>
                                    {queue.activeMessageCount !== undefined && (
                                        <div className="text-sm opacity-80 mt-2 ml-6 items-center gap-3">
                                            <span>✓ Active messages: {queue.activeMessageCount}</span>
                                            {queue.deadLetterMessageCount! > 0 && (
                                                <span className="mt-2 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    DeadLetter: {queue.deadLetterMessageCount}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="topics" className="space-y-2 mt-4">
                        {filteredTopics.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No topics found</p>
                        ) : (
                            filteredTopics.map((topic) => (
                                <div
                                    key={topic.name}
                                    onClick={() => onSelectTopic(topic.name)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedEntity?.type === 'topic' && selectedEntity?.name === topic.name
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-accent'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="font-medium">{topic.name}</span>
                                    </div>
                                    {topic.subscriptions && topic.subscriptions.length > 0 && (
                                        <div className="text-sm opacity-80 mt-2 ml-6">
                                            Subscriptions: {topic.subscriptions.map(sub => sub.name).join(', ')}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </Card>
    );
}
