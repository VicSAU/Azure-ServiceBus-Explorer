# Azure Service Bus Explorer

A modern, web-based Azure Service Bus Explorer built with Next.js, allowing you to manage and interact with Azure Service Bus queues and topics through an intuitive UI.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-GPL%202.0-green)

## ✨ Features

- 🔌 **Connection Management**: Save and reuse Azure Service Bus connection strings with custom names
- 📋 **Entity Listing**: Browse queues and topics with real-time message counts
- 📨 **Send Messages**: Send messages to queues and topics with custom content
- 👀 **Peek Messages**: Preview messages without removing them from the queue
- 📥 **Receive Messages**: Receive and complete messages from queues
- 🔍 **Search & Filter**: Search through queues and topics with dead-letter filtering
- 💾 **SQLite Storage**: Persistent local storage for connection strings using Drizzle ORM
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 🔔 **Toast Notifications**: User-friendly notifications for all operations
- 🎯 **Icons**: Lucide React icons throughout the interface
- 🐳 **Docker Ready**: Production-ready Docker configuration

## 🚀 Prerequisites

- **Node.js**: v20.9.0 or higher
- **npm**: v10 or higher
- **Azure Service Bus**: An active Azure Service Bus namespace with connection string

## 📦 Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd servicebus_explorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run db:push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker compose up servicebus-explorer --build
   ```

2. **Access the application**
   The app will be available at [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Connecting to Azure Service Bus

1. **Enter Connection Details**
   - Paste your Azure Service Bus connection string
   - Optionally provide a friendly name for the connection
   - Click "Connect" to establish connection

2. **Save Connection** (Optional)
   - After connecting, click "Save Connection" to store it for future use
   - Saved connections appear in the dropdown menu for quick access

### Managing Queues and Topics

1. **View Entities**
   - After connecting, queues and topics are automatically listed
   - View message counts, including active and dead-letter messages
   - Use the search bar to filter entities

2. **Send Messages**
   - Select a queue or topic from the list
   - Navigate to the "Send" tab
   - Enter your message content (supports JSON)
   - Click "Send Message"

3. **Peek Messages**
   - Select a queue or topic
   - Go to the "Peek" tab
   - Enter the number of messages to peek (1-50)
   - Click "Peek Messages" to preview without dequeuing

4. **Receive Messages**
   - Select a queue
   - Go to the "Receive" tab
   - Specify the number of messages (1-50)
   - Click "Receive Messages" to dequeue and complete messages

## 🛠️ Technologies

- **Frontend**: Next.js 16.1, React 19, TypeScript
- **UI Components**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Database**: SQLite with Drizzle ORM
- **Azure SDK**: @azure/service-bus, @azure/identity
- **Notifications**: react-toastify
- **Build Tool**: Turbopack (dev), Webpack (prod)

## 📁 Project Structure

```
servicebus_explorer/
├── app/
│   ├── api/                    # API routes
│   │   ├── connections/        # Connection CRUD endpoints
│   │   └── servicebus/         # Service Bus operations
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── ConnectionPanel.tsx     # Connection management UI
│   ├── EntitiesList.tsx        # Queues/topics list
│   ├── MessageOperations.tsx   # Send/peek/receive UI
│   └── ServiceBusExplorer.tsx  # Main component
├── lib/
│   ├── db.ts                   # Database client
│   ├── schema.ts               # Drizzle schema
│   ├── serviceBusManager.ts    # API client
│   └── utils.ts                # Utilities
├── drizzle/                    # Database migrations
├── data/                       # SQLite database storage
├── Dockerfile                  # Production container
├── docker-compose.yml          # Docker orchestration
└── package.json
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

### Database Management

The application uses SQLite with Drizzle ORM for storing connection strings. The database is automatically created on first run.

**Schema**: Connections table with id, name, connectionString, createdAt, updatedAt

**Migrations**: File-based migrations in `drizzle/` folder

## 🔐 Security Notes

- Connection strings are stored locally in SQLite database
- Consider encrypting the database file in production environments
- Never commit connection strings to version control
- The `data/` directory is git-ignored by default

## 📝 License

GPL 2.0

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue in the repository.

---

**Built with ❤️ using Next.js and Azure Service Bus**
