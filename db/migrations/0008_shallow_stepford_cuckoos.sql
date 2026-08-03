CREATE TABLE "domain_prompts" (
	"domain_key" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"lang" text NOT NULL,
	"prompts" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
