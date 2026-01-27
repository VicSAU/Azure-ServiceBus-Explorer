'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Send, Eye, Download, MessageCircle, CheckCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { ServiceBusManager } from '@/lib/serviceBusManager';

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
    const [subscriptions, setSubscriptions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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

        try {
            const topics = await manager.listTopics();
            const topic = topics.find(t => t.name === selectedEntity.name);
            if (topic?.subscriptions) {
                setSubscriptions(topic.subscriptions);
                if (topic.subscriptions.length > 0) {
                    setSelectedSubscription(topic.subscriptions[0]);
                }
            }
        } catch (error) {
            console.error('Failed to load subscriptions:', error);
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

    const handlePeekMessages = async () => {
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
            if (selectedEntity.type === 'queue') {
                messages = await manager.peekMessagesFromQueue(selectedEntity.name);
            } else {
                messages = await manager.peekMessagesFromSubscription(selectedEntity.name, selectedSubscription);
            }

            setReceivedMessages(messages);
            toast.success(`Found ${messages.length} message(s)`);
        } catch (error) {
            toast.error(`Failed to peek messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReceiveMessages = async (completeMessages: boolean) => {
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
            if (selectedEntity.type === 'queue') {
                messages = await manager.receiveMessagesFromQueue(selectedEntity.name, 10, completeMessages);
            } else {
                messages = await manager.receiveMessagesFromSubscription(
                    selectedEntity.name,
                    selectedSubscription,
                    10,
                    completeMessages
                );
            }

            setReceivedMessages(messages);
            const action = completeMessages ? 'received and completed' : 'received';
            toast.success(`${messages.length} message(s) ${action}`);
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
                <div className="mb-4">
                    <Label>Subscription</Label>
                    <Select value={selectedSubscription} onValueChange={setSelectedSubscription}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select subscription" />
                        </SelectTrigger>
                        <SelectContent>
                            {subscriptions.map((sub) => (
                                <SelectItem key={sub} value={sub}>
                                    {sub}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <Tabs defaultValue="send">
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
                    <Button onClick={handlePeekMessages} disabled={isLoading} className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        {isLoading ? 'Peeking...' : 'Peek Messages (non-destructive)'}
                    </Button>

                    {receivedMessages.length > 0 && (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {receivedMessages.map((msg, idx) => (
                                <div key={idx} className="p-3 bg-muted rounded-lg">
                                    <div className="font-mono text-sm">
                                        <strong>ID:</strong> {msg.messageId}
                                    </div>
                                    <div className="font-mono text-sm mt-2">
                                        <strong>Body:</strong>{' '}
                                        <pre className="mt-1 whitespace-pre-wrap">
                                            {typeof msg.body === 'object' ? JSON.stringify(msg.body, null, 2) : msg.body}
                                        </pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="receive" className="space-y-4">
                    <div className="flex gap-2">
                        <Button
                            onClick={() => handleReceiveMessages(false)}
                            disabled={isLoading}
                            variant="outline"
                            className="flex-1"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {isLoading ? 'Receiving...' : 'Receive (Keep)'}
                        </Button>
                        <Button
                            onClick={() => handleReceiveMessages(true)}
                            disabled={isLoading}
                            variant="destructive"
                            className="flex-1"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {isLoading ? 'Receiving...' : 'Receive & Complete'}
                        </Button>
                    </div>

                    {receivedMessages.length > 0 && (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {receivedMessages.map((msg, idx) => (
                                <div key={idx} className="p-3 bg-muted rounded-lg">
                                    <div className="font-mono text-sm">
                                        <strong>ID:</strong> {msg.messageId}
                                    </div>
                                    <div className="font-mono text-sm mt-2">
                                        <strong>Body:</strong>{' '}
                                        <pre className="mt-1 whitespace-pre-wrap">
                                            {typeof msg.body === 'object' ? JSON.stringify(msg.body, null, 2) : msg.body}
                                        </pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </Card>
    );
}
