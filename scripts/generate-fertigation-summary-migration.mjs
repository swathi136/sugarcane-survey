import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const root = process.cwd();
const input = path.join(root, "public/data/fertigation_plot_summary.csv");
const output = path.join(root, "supabase/migrations/20260803123000_add_reference_data_rpc.sql");
const rows = Papa.parse(fs.readFileSync(input, "utf8"), { header: true, skipEmptyLines: true }).data;
const quote = (value) => value === "" || value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const number = (value) => value === "" || value == null ? "null" : String(Number(value));
const values = rows.map((r) => `(${[
  quote(r.location_id), quote(r.plot_id), quote(r.treatment_id), number(r.extent_acre),
  quote(r.variety), quote(r.date_of_planting), number(r.total_n_kg), number(r.total_p_kg),
  number(r.total_k_kg), number(r.total_mn_kg), quote(r.source_file), quote(r.source_sheet),
].join(",")})`).join(",\n");

const sql = `create table if not exists public.dashboard_fertigation_plot_summary (
  location_id text not null, plot_id text primary key, treatment_id text, extent_acre numeric,
  variety text, date_of_planting date, total_n_kg numeric, total_p_kg numeric,
  total_k_kg numeric, total_mn_kg numeric, source_file text, source_sheet text
);
alter table public.dashboard_fertigation_plot_summary enable row level security;
revoke all on public.dashboard_fertigation_plot_summary from anon, authenticated;
insert into public.dashboard_fertigation_plot_summary values
${values}
on conflict (plot_id) do update set
  location_id=excluded.location_id,treatment_id=excluded.treatment_id,extent_acre=excluded.extent_acre,
  variety=excluded.variety,date_of_planting=excluded.date_of_planting,total_n_kg=excluded.total_n_kg,
  total_p_kg=excluded.total_p_kg,total_k_kg=excluded.total_k_kg,total_mn_kg=excluded.total_mn_kg,
  source_file=excluded.source_file,source_sheet=excluded.source_sheet;

create or replace function public.get_dashboard_reference_data()
returns jsonb language sql stable security definer
set search_path = pg_catalog, public, pg_temp as $$
select jsonb_build_object(
  'locations',(select coalesce(jsonb_agg(to_jsonb(x) order by location_id),'[]') from public.dashboard_location_master x),
  'plots',(select coalesce(jsonb_agg(to_jsonb(x) order by plot_id),'[]') from public.dashboard_plot_master x),
  'treatments',(select coalesce(jsonb_agg(to_jsonb(x) order by location_id,treatment_id),'[]') from public.dashboard_treatment_master x),
  'cropStageSplit',(select coalesce(jsonb_agg(to_jsonb(x) order by location_id,crop_stage),'[]') from public.dashboard_crop_stage_split x),
  'fertilizerStock',(select coalesce(jsonb_agg(to_jsonb(x) order by location_id,fertilizer),'[]') from public.dashboard_fertilizer_stock x),
  'fertigationSummary',(select coalesce(jsonb_agg(to_jsonb(x) order by location_id,plot_id),'[]') from public.dashboard_fertigation_plot_summary x)
);
$$;
revoke all on function public.get_dashboard_reference_data() from public;
grant execute on function public.get_dashboard_reference_data() to anon, authenticated;
`;
fs.writeFileSync(output, sql);
console.log(`Generated ${path.relative(root, output)} with ${rows.length} rows.`);
