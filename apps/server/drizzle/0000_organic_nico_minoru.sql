CREATE TABLE "flight_packets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "flight_packets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"flight_id" integer NOT NULL,
	"raw_bytes" varchar(255) NOT NULL,
	"parsed_data" jsonb NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "flights_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(63) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"first_packet_at" timestamp,
	"duration_ms" integer
);
--> statement-breakpoint
ALTER TABLE "flight_packets" ADD CONSTRAINT "flight_packets_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE cascade ON UPDATE no action;