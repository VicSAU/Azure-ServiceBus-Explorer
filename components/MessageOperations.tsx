'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Send, Eye, Download, MessageCircle, CheckCircle, Filter, X } from 'lucide-react';
import JsonView from '@uiw/react-json-view';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { ServiceBusManager, SubscriptionInfo } from '@/lib/serviceBusManager';

interface MessageOperationsProps {
    manager: ServiceBusManager;
    selectedEntity: { type: 'queue' | 'topic'; name: string } | null;
    isConnected: boolean;
}

export function MessageOperations({ manager, selectedEntity, isConnected }: MessageOperationsProps) {
    const [messageBody, setMessageBody] = useState('');
    const [messageProperties, setMessageProperties] = useState('');
    const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
    const [selectedSubscription, setSelectedSubscription] = useState<string>('');
    const [subscriptions, setSubscriptions] = useState<SubscriptionInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [batchSize] = useState(10);
    const [canLoadMore, setCanLoadMore] = useState(false);
    const [viewDeadLetter, setViewDeadLetter] = useState(false);
    const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
    const [activeTab, setActiveTab] = useState('send');
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => {
        if (selectedEntity?.type === 'topic') {
            loadSubscriptions();
        } else {
            setSubscriptions([]);
            setSelectedSubscription('');
        }
    }, [selectedEntity]);

    const loadSubscriptions = async () => {
        if (!selectedEntity || selectedEntity.type !== 'topic') return;

        setIsLoadingSubscriptions(true);
        try {
            const topics = await manager.listTopics();
            const topic = topics.find(t => t.name === selectedEntity.name);
            if (topic?.subscriptions) {
                setSubscriptions(topic.subscriptions);
                if (topic.subscriptions.length > 0) {
                    setSelectedSubscription(topic.subscriptions[0].name);
                }
            }
        } catch (error) {
            console.error('Failed to load subscriptions:', error);
        } finally {
            setIsLoadingSubscriptions(false);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedEntity) {
            toast.warning('Please select a queue or topic first');
            return;
        }

        if (!messageBody.trim()) {
            toast.warning('Message body cannot be empty');
            return;
        }

        setIsLoading(true);
        try {
            let parsedBody: any;
            try {
                parsedBody = JSON.parse(messageBody);
            } catch {
                parsedBody = messageBody;
            }

            let parsedProperties: any = undefined;
            if (messageProperties.trim()) {
                try {
                    parsedProperties = JSON.parse(messageProperties);
                } catch (error) {
                    toast.error('Invalid JSON in properties');
                    setIsLoading(false);
                    return;
                }
            }

            if (selectedEntity.type === 'queue') {
                await manager.sendMessageToQueue(selectedEntity.name, parsedBody, parsedProperties);
            } else {
                await manager.sendMessageToTopic(selectedEntity.name, parsedBody, parsedProperties);
            }

            toast.success('Message sent successfully!');
            setMessageBody('');
            setMessageProperties('');
        } catch (error) {
            toast.error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePeekMessages = async (append = false) => {
        if (!selectedEntity) {
            toast.warning('Please select a queue or topic first');
            return;
        }

        if (selectedEntity.type === 'topic' && !selectedSubscription) {
            toast.warning('Please select a subscription');
            return;
        }

        setIsLoading(true);
        try {
            let messages;
            if (viewDeadLetter) {
                if (selectedEntity.type === 'queue') {
                    messages = await manager.peekDeadLetterMessagesFromQueue(selectedEntity.name, batchSize);
                } else {
                    messages = await manager.peekDeadLetterMessagesFromSubscription(selectedEntity.name, selectedSubscription, batchSize);
                }
            } else {
                if (selectedEntity.type === 'queue') {
                    messages = await manager.peekMessagesFromQueue(selectedEntity.name, batchSize);
                } else {
                    messages = await manager.peekMessagesFromSubscription(selectedEntity.name, selectedSubscription, batchSize);
                }
            }

            // Apply date filtering if enabled
            if (showDateFilter && (fromDate || toDate)) {
                const fromDateTime = fromDate ? new Date(fromDate).getTime() : 0;
                const toDateTime = toDate ? new Date(toDate).getTime() : Date.now() + 86400000; // +1 day

                messages = messages.filter(msg => {
                    if (!msg.enqueuedTimeUtc) return true;
                    const msgTime = new Date(msg.enqueuedTimeUtc).getTime();
                    return msgTime >= fromDateTime && msgTime <= toDateTime;
                });
            }

            if (append) {
                setReceivedMessages(prev => [...prev, ...messages]);
            } else {
                setReceivedMessages(messages);
            }

            setCanLoadMore(messages.length === batchSize);
            const queueType = viewDeadLetter ? 'deadletter' : 'main';
            toast.success(`Found ${messages.length} message(s) in ${queueType} queue`);
        } catch (error) {
            toast.error(`Failed to peek messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReceiveMessages = async (completeMessages: boolean, append = false) => {
        if (!selectedEntity) {
            toast.warning('Please select a queue or topic first');
            return;
        }

        if (selectedEntity.type === 'topic' && !selectedSubscription) {
            toast.warning('Please select a subscription');
            return;
        }

        setIsLoading(true);
        try {
            let messages;
            if (viewDeadLetter) {
                if (selectedEntity.type === 'queue') {
                    messages = await manager.receiveDeadLetterMessagesFromQueue(selectedEntity.name, batchSize, completeMessages);
                } else {
                    messages = await manager.receiveDeadLetterMessagesFromSubscription(
                        selectedEntity.name,
                        selectedSubscription,
                        batchSize,
                        completeMessages
                    );
                }
            } else {
                if (selectedEntity.type === 'queue') {
                    messages = await manager.receiveMessagesFromQueue(selectedEntity.name, batchSize, completeMessages);
                } else {
                    messages = await manager.receiveMessagesFromSubscription(
                        selectedEntity.name,
                        selectedSubscription,
                        batchSize,
                        completeMessages
                    );
                }
            }

            if (showDateFilter && (fromDate || toDate)) {
                const fromDateTime = fromDate ? new Date(fromDate).getTime() : 0;
                const toDateTime = toDate ? new Date(toDate).getTime() : Date.now() + 86400000; // +1 day

                messages = messages.filter(msg => {
                    if (!msg.enqueuedTimeUtc) return true;
                    const msgTime = new Date(msg.enqueuedTimeUtc).getTime();
                    return msgTime >= fromDateTime && msgTime <= toDateTime;
                });
            }

            if (append) {
                setReceivedMessages(prev => [...prev, ...messages]);
            } else {
                setReceivedMessages(messages);
            }

            setCanLoadMore(messages.length === batchSize);
            const action = completeMessages ? 'received and completed' : 'received';
            const queueType = viewDeadLetter ? 'deadletter' : 'main';
            toast.success(`${messages.length} message(s) ${action} from ${queueType} queue`);
        } catch (error) {
            toast.error(`Failed to receive messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <Card className="p-6">
                <p className="text-muted-foreground text-center py-8">Connect to Service Bus to perform operations</p>
            </Card>
        );
    }

    if (!selectedEntity) {
        return (
            <Card className="p-6">
                <p className="text-muted-foreground text-center py-8">Select a queue or topic to perform operations</p>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">
                    Operations: {selectedEntity.name} ({selectedEntity.type})
                </h2>
            </div>

            {selectedEntity.type === 'topic' && subscriptions.length > 0 && (
                <div className="mb-4 space-y-3">
                    <div>
                        <Label>Subscription</Label>
                        <Select
                            value={selectedSubscription}
                            onValueChange={setSelectedSubscription}
                            disabled={activeTab === 'send' || isLoadingSubscriptions}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingSubscriptions ? 'Loading subscriptions...' : 'Select subscription'} />
                            </SelectTrigger>
                            <SelectContent className="bg-stone-200">
                                {subscriptions.map((sub) => (
                                    <SelectItem key={sub.name} value={sub.name}>
                                        <div className="flex items-center justify-between w-full">
                                            <span>{sub.name}</span>
                                            {(sub.activeMessageCount !== undefined || sub.deadLetterMessageCount !== undefined) && (
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    ({sub.activeMessageCount ?? 0} active
                                                    {sub.deadLetterMessageCount ? `, ${sub.deadLetterMessageCount} DLQ` : ''})
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {activeTab === 'send' && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Send messages to the topic (not to individual subscriptions)
                            </p>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="viewDeadLetter"
                            checked={viewDeadLetter}
                            onChange={(e) => {
                                setViewDeadLetter(e.target.checked);
                                setReceivedMessages([]);
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="viewDeadLetter" className="cursor-pointer">
                            View Dead Letter Queue
                        </Label>
                    </div>
                </div>
            )}

            {selectedEntity.type === 'queue' && (
                <div className="mb-4">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="viewDeadLetterQueue"
                            checked={viewDeadLetter}
                            onChange={(e) => {
                                setViewDeadLetter(e.target.checked);
                                setReceivedMessages([]);
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="viewDeadLetterQueue" className="cursor-pointer">
                            View Dead Letter Queue
                        </Label>
                    </div>
                </div>
            )}

            <Tabs defaultValue="send" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="send" className="flex items-center gap-2 hover:bg-stone-200">
                        <Send className="h-4 w-4" />
                        Send
                    </TabsTrigger>
                    <TabsTrigger value="peek" className="flex items-center gap-2 hover:bg-stone-200">
                        <Eye className="h-4 w-4" />
                        Peek
                    </TabsTrigger>
                    <TabsTrigger value="receive" className="flex items-center gap-2 hover:bg-stone-200">
                        <Download className="h-4 w-4" />
                        Receive
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="send" className="space-y-4">
                    <div>
                        <Label htmlFor="message-body">Message Body (JSON or text)</Label>
                        <Textarea
                            id="message-body"
                            placeholder='{"key": "value"} or plain text'
                            value={messageBody}
                            onChange={(e) => setMessageBody(e.target.value)}
                            rows={6}
                        />
                    </div>

                    <div>
                        <Label htmlFor="message-properties">Properties (JSON, optional)</Label>
                        <Textarea
                            id="message-properties"
                            placeholder='{"customProperty": "value"}'
                            value={messageProperties}
                            onChange={(e) => setMessageProperties(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <Button onClick={handleSendMessage} disabled={isLoading} className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        {isLoading ? 'Sending...' : 'Send Message'}
                    </Button>
                </TabsContent>

                <TabsContent value="peek" className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setShowDateFilter(!showDateFilter)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                            >
                                {showDateFilter ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                                {showDateFilter ? 'Hide Filter' : 'Date Filter'}
                            </Button>
                        </div>

                        {showDateFilter && (
                            <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                                <div>
                                    <Label htmlFor="fromDate" className="text-xs">From Date/Time</Label>
                                    <Input
                                        id="fromDate"
                                        type="datetime-local"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="toDate" className="text-xs">To Date/Time</Label>
                                    <Input
                                        id="toDate"
                                        type="datetime-local"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={() => handlePeekMessages(false)} disabled={isLoading} className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            {isLoading ? 'Peeking...' : 'Peek Messages'}
                        </Button>
                        {receivedMessages.length > 0 && (
                            <Button onClick={() => setReceivedMessages([])} variant="outline" disabled={isLoading}>
                                Clear
                            </Button>
                        )}
                    </div>

                    {receivedMessages.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                                Showing {receivedMessages.length} message(s)
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {receivedMessages.map((msg, idx) => (
                                    <div key={idx} className="p-3 bg-muted rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-mono text-sm">
                                                <strong>ID:</strong> {msg.messageId}
                                            </div>
                                            {msg.enqueuedTimeUtc && (
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(msg.enqueuedTimeUtc).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            <strong className="font-mono text-sm">Body:</strong>
                                            <div className="mt-1 p-2 bg-white rounded border">
                                                {typeof msg.body === 'object' && msg.body !== null ? (
                                                    <JsonView value={msg.body} />
                                                ) : (
                                                    <pre className="font-mono text-sm whitespace-pre-wrap">{String(msg.body)}</pre>
                                                )}

                                            </div>
                                        </div>
                                        <pre className="font-mono text-xs text-muted-foreground mt-2">Properties:</pre>
                                        <JsonView value={msg.properties} />
                                    </div>
                                ))}
                            </div>
                            {canLoadMore && (
                                <Button onClick={() => handlePeekMessages(true)} disabled={isLoading} variant="outline" className="w-full">
                                    {isLoading ? 'Loading...' : 'Load More'}
                                </Button>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="receive" className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setShowDateFilter(!showDateFilter)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                            >
                                {showDateFilter ? <X className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
                                {showDateFilter ? 'Hide Filter' : 'Date Filter'}
                            </Button>
                        </div>

                        {showDateFilter && (
                            <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                                <div>
                                    <Label htmlFor="fromDateReceive" className="text-xs">From Date/Time</Label>
                                    <Input
                                        id="fromDateReceive"
                                        type="datetime-local"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="toDateReceive" className="text-xs">To Date/Time</Label>
                                    <Input
                                        id="toDateReceive"
                                        type="datetime-local"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={() => handleReceiveMessages(false, false)}
                            disabled={isLoading}
                            variant="outline"
                            className="flex-1"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {isLoading ? 'Receiving...' : 'Receive (Keep)'}
                        </Button>
                        <Button
                            onClick={() => handleReceiveMessages(true, false)}
                            disabled={isLoading}
                            variant="destructive"
                            className="flex-1"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {isLoading ? 'Receiving...' : 'Receive & Complete'}
                        </Button>
                        {receivedMessages.length > 0 && (
                            <Button onClick={() => setReceivedMessages([])} variant="outline" disabled={isLoading}>
                                Clear
                            </Button>
                        )}
                    </div>

                    {receivedMessages.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                                Showing {receivedMessages.length} message(s)
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {receivedMessages.map((msg, idx) => (
                                    <div key={idx} className="p-3 bg-muted rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-mono text-sm">
                                                <strong>ID:</strong> {msg.messageId}
                                            </div>
                                            {msg.enqueuedTimeUtc && (
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(msg.enqueuedTimeUtc).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            <strong className="font-mono text-sm">Body:</strong>
                                            <div className="mt-1 p-2 bg-white rounded border">
                                                {typeof msg.body === 'object' && msg.body !== null ? (
                                                    <JsonView value={msg.body} collapsed={1} />
                                                ) : (
                                                    <pre className="font-mono text-sm whitespace-pre-wrap">{String(msg.body)}</pre>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {canLoadMore && (
                                <div className="flex gap-2">
                                    <Button onClick={() => handleReceiveMessages(false, true)} disabled={isLoading} variant="outline" className="flex-1">
                                        {isLoading ? 'Loading...' : 'Load More (Keep)'}
                                    </Button>
                                    <Button onClick={() => handleReceiveMessages(true, true)} disabled={isLoading} variant="outline" className="flex-1">
                                        {isLoading ? 'Loading...' : 'Load More & Complete'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </Card>
    );
}
