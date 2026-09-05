CREATE TABLE IF NOT EXISTS "linked_accounts" (
	"discord_user_id" text PRIMARY KEY NOT NULL,
	"minecraft_uuid" varchar(32) NOT NULL,
	"minecraft_username" varchar(16) NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verification_method" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_user_id" text NOT NULL,
	"minecraft_uuid" varchar(32) NOT NULL,
	"minecraft_username" varchar(16) NOT NULL,
	"code" varchar(16) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
	"discord_user_id" text PRIMARY KEY NOT NULL,
	"ai_provider" varchar(16) DEFAULT 'default' NOT NULL,
	"ai_model" varchar(64),
	"encrypted_api_key" text,
	"custom_base_url" text,
	"preferred_class" varchar(32),
	"goals" text,
	"budget" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"discord_user_id" text NOT NULL,
	"role" varchar(16) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(768),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(64) NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"category" varchar(64) NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_documents_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_settings" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "linked_accounts_minecraft_uuid_idx" ON "linked_accounts" USING btree ("minecraft_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_codes_discord_user_idx" ON "verification_codes" USING btree ("discord_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_messages_user_created_idx" ON "conversation_messages" USING btree ("discord_user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_chunks_document_idx" ON "knowledge_chunks" USING btree ("document_id");