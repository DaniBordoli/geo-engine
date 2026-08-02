ALTER TABLE "scans" ADD COLUMN "share_of_voice" real;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "citation_rate" real;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "invisible_rate" real;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dashboard_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_dashboard_token_unique" UNIQUE("dashboard_token");