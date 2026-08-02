


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."field_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_code" "text" NOT NULL,
    "location_name" "text" NOT NULL,
    "plot" "text" NOT NULL,
    "treatment" "text" NOT NULL,
    "observation_day" integer NOT NULL,
    "observation_date" "date" NOT NULL,
    "plant_number" integer,
    "plant_height" numeric(10,2),
    "tiller_count" integer,
    "leaf_count" integer,
    "leaf_length" numeric(10,2),
    "leaf_width" numeric(10,2),
    "plant_count_1m" integer,
    "plant_count_5m" integer,
    "plant_count_15m" integer,
    "number_of_nodes" integer,
    "node_length" numeric(10,2),
    "germination_pct" numeric(5,2),
    "fertigation_date" "date",
    "white_potash_kg" numeric(12,3),
    "n_kg" numeric(12,3),
    "p2o5_kg" numeric(12,3),
    "k2o_kg" numeric(12,3),
    "mn_mixture" numeric(12,3),
    "urea" numeric(12,3),
    "map" numeric(12,3),
    "dap" numeric(12,3),
    "ssp" numeric(12,3),
    "mop" numeric(12,3),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    CONSTRAINT "field_entries_observation_day_check" CHECK ((("observation_day" >= 1) AND ("observation_day" <= 240))),
    CONSTRAINT "field_entries_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'Approved'::"text", 'Rejected'::"text"])))
);


ALTER TABLE "public"."field_entries" OWNER TO "postgres";


ALTER TABLE ONLY "public"."field_entries"
    ADD CONSTRAINT "field_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_entries"
    ADD CONSTRAINT "field_entries_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."field_entries"
    ADD CONSTRAINT "field_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



CREATE POLICY "Authenticated users can insert field entries" ON "public"."field_entries" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can read their own field entries" ON "public"."field_entries" FOR SELECT TO "authenticated" USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."field_entries" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."field_entries" TO "anon";
GRANT ALL ON TABLE "public"."field_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."field_entries" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







