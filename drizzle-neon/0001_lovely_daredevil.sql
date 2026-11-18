CREATE TABLE "cash_register_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"kind" varchar(16) NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"actor_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_register_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id" integer NOT NULL,
	"terminal_id" varchar(32) NOT NULL,
	"staff_user_id" integer NOT NULL,
	"status" varchar(16) DEFAULT 'open' NOT NULL,
	"opening_float" integer DEFAULT 0 NOT NULL,
	"cash_sales" integer DEFAULT 0 NOT NULL,
	"cash_refunds" integer DEFAULT 0 NOT NULL,
	"cash_in" integer DEFAULT 0 NOT NULL,
	"cash_out" integer DEFAULT 0 NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"actual_cash" integer,
	"expected_cash" integer,
	"variance" integer,
	"closed_by_user_id" integer
);
--> statement-breakpoint
ALTER TABLE "cash_register_movements" ADD CONSTRAINT "cash_register_movements_session_id_cash_register_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cash_register_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_register_movements" ADD CONSTRAINT "cash_register_movements_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "cash_register_sessions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "cash_register_sessions_staff_user_id_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "cash_register_sessions_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "register_movements_session_idx" ON "cash_register_movements" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "register_open_branch_terminal_unique" ON "cash_register_sessions" USING btree ("branch_id","terminal_id") WHERE "cash_register_sessions"."status" = 'open';--> statement-breakpoint
CREATE INDEX "register_sessions_branch_idx" ON "cash_register_sessions" USING btree ("branch_id","opened_at");