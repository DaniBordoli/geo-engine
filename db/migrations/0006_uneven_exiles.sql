ALTER TABLE "scans" ADD COLUMN "report_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "report_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_report_token_unique" UNIQUE("report_token");