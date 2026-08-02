CREATE TYPE "public"."event_type" AS ENUM('scan_started', 'report_viewed', 'report_shared', 'checkout_clicked', 'paid');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "event_type" NOT NULL,
	"scan_id" uuid,
	"source" text,
	"medium" text,
	"campaign" text,
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "medium" text;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "campaign" text;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "referrer" text;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE set null ON UPDATE no action;