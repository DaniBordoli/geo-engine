ALTER TABLE "scans" ADD COLUMN "order_id" text;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_order_id_unique" UNIQUE("order_id");