ALTER TABLE "linked_accounts" ADD COLUMN "default_profile_id" varchar(64);--> statement-breakpoint
ALTER TABLE "verification_codes" ADD COLUMN "desired_default_profile_id" varchar(64);