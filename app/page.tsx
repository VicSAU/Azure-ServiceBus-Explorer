import { ServiceBusExplorer } from '@/components/ServiceBusExplorer';

export default function Home() {
    return (
        <main className="min-h-screen bg-stone-100 p-8">
            <ServiceBusExplorer />
        </main>
    );
}
