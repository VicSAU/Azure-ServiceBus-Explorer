'use client';

export interface QueueInfo {
    name: string;
    activeMessageCount?: number;
    deadLetterMessageCount?: number;
    scheduledMessageCount?: number;
}

export interface SubscriptionInfo {
    name: string;
    activeMessageCount?: number;
    deadLetterMessageCount?: number;
}

export interface TopicInfo {
    name: string;
    subscriptions?: SubscriptionInfo[];
}

export interface MessageInfo {
    messageId: string;
    body: any;
    properties: Record<string, any>;
    enqueuedTimeUtc?: Date;
    sequenceNumber?: string;
}

export class ServiceBusManager {
    private connectionString: string = '';

    async connect(connectionString: string): Promise<void> {
        try {
            const response = await fetch('/api/servicebus/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectionString }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to connect');
            }

            this.connectionString = connectionString;
        } catch (error) {
            this.disconnect();
            throw new Error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    disconnect(): void {
        this.connectionString = '';
    }

    isConnected(): boolean {
        return this.connectionString !== '';
    }

    async listQueues(): Promise<QueueInfo[]> {
        if (!this.connectionString) {
            throw new Error('Not connected to Service Bus');
        }

        const response = await fetch('/api/servicebus/queues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionString: this.connectionString }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to list queues');
        }

        return data.queues;
    }

    async listTopics(): Promise<TopicInfo[]> {
        if (!this.connectionString) {
            throw new Error('Not connected to Service Bus');
        }

        const response = await fetch('/api/servicebus/topics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionString: this.connectionString }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to list topics');
        }

        return data.topics;
    }

    async sendMessageToQueue(queueName: string, messageBody: any, properties?: Record<string, any>): Promise<void> {
        if (!this.connectionString) {
            throw new Error('Not connected to Service Bus');
        }

        const response = await fetch('/api/servicebus/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                connectionString: this.connectionString,
                entityName: queueName,
                entityType: 'queue',
                messageBody,
                properties,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send message');
        }
    }

    async sendMessageToTopic(topicName: string, messageBody: any, properties?: Record<string, any>): Promise<void> {
        if (!this.connectionString) {
            throw new Error('Not connected to Service Bus');
        }

        const response = await fetch('/api/servicebus/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                connectionString: this.connectionString,
                entityName: topicName,
                entityType: 'topic',
                messageBody,
                properties,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send message');
        }
    }

    async peekMessagesFromQueue(queueName: string, maxMessages: number = 10): Promise<MessageInfo[]> {
        if (!this.connectionString) {
            throw new Error('Not connected to Service Bus');
        }

        const response = await fetch('/api/servicebus/peek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                connectionString: this.connectionString,
                entityName: queueName,
                entityType: 'queue',
                maxMessages,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to peek messages');
        }

        return data.messages;
    }

    async peekMessagesFromSubscription(topicName: string, subscriptionName: string, maxMessages: number = 10): Promise<MessageInfo[]> {
        if (!this.connectionString) {
            throw new Error('Not connected to Service Bus');
        }

        const response = await fetch('/api/servicebus/peek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                connectionString: this.connectionString,
                entityName: topicName,
                entityType: 'topic',
                subscription: subscriptionName,
                maxMessages,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to peek messages');
        }

        return data.messages;
    }

    async receiveMessagesFromQueue(queueName: string, maxMessages: number = 10, completeMessages: boolean = false): Promise<MessageInfo[]> {
        if (!this.connectionString) {
            throw new Error('Not connected to Service Bus');
        }

        const response = await fetch('/api/servicebus/receive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                connectionString: this.connectionString,
                entityName: queueName,
                entityType: 'queue',
                maxMessages,
                completeMessages,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to receive messages');
        }

        return data.messages;
    }

    async receiveMessagesFromSubscription(
        topicName: string,
        subscriptionName: string,
        maxMessages: number = 10,
        completeMessages: boolean = false
    ): Promise<MessageInfo[]> {
        if (!this.connectionString) {
            throw new Error('Not connected to Service Bus');
        }

        const response = await fetch('/api/servicebus/receive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                connectionString: this.connectionString,
                entityName: topicName,
                entityType: 'topic',
                subscription: subscriptionName,
                maxMessages,
                completeMessages,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to receive messages');
        }

        return data.messages;
    }

    async peekDeadLetterMessagesFromQueue(queueName: string, maxMessages: number = 10): Promise<MessageInfo[]> {
        if (!this.connectionString) {
            throw new Error('Not connected to Service Bus');
        }

        const response = await fetch('/api/servicebus/peek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                connectionString: this.connectionString,
                entityName: queueName,
                entityType: 'queue',
                maxMessages,
                subQueue: 'deadLetter',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to peek deadletter messages');
        }

        return data.messages;
    }

    async peekDeadLetterMessagesFromSubscription(topicName: string, subscriptionName: string, maxMessages: number = 10): Promise<MessageInfo[]> {
        if (!this.connectionString) {
            throw new Error('Not connected to Service Bus');
        }

        const response = await fetch('/api/servicebus/peek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                connectionString: this.connectionString,
                entityName: topicName,
                entityType: 'topic',
                subscription: subscriptionName,
                maxMessages,
                subQueue: 'deadLetter',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to peek deadletter messages');
        }

        return data.messages;
    }

    async receiveDeadLetterMessagesFromQueue(queueName: string, maxMessages: number = 10, completeMessages: boolean = false): Promise<MessageInfo[]> {
        if (!this.connectionString) {
            throw new Error('Not connected to Service Bus');
        }

        const response = await fetch('/api/servicebus/receive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                connectionString: this.connectionString,
                entityName: queueName,
                entityType: 'queue',
                maxMessages,
                completeMessages,
                subQueue: 'deadLetter',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to receive deadletter messages');
        }

        return data.messages;
    }

    async receiveDeadLetterMessagesFromSubscription(
        topicName: string,
        subscriptionName: string,
        maxMessages: number = 10,
        completeMessages: boolean = false
    ): Promise<MessageInfo[]> {
        if (!this.connectionString) {
            throw new Error('Not connected to Service Bus');
        }

        const response = await fetch('/api/servicebus/receive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                connectionString: this.connectionString,
                entityName: topicName,
                entityType: 'topic',
                subscription: subscriptionName,
                maxMessages,
                completeMessages,
                subQueue: 'deadLetter',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to receive deadletter messages');
        }

        return data.messages;
    }
}
