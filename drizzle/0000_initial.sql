CREATE TABLE "connections" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"name" text NOT NULL,
	"connectionString" text NOT NULL,
	"createdAt" text DEFAULT (datetime('now')) NOT NULL,
	"updatedAt" text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "connections_name_unique" ON "connections" ("name");
