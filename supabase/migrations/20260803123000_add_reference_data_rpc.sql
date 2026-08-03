create table if not exists public.dashboard_fertigation_plot_summary (
  location_id text not null, plot_id text primary key, treatment_id text, extent_acre numeric,
  variety text, date_of_planting date, total_n_kg numeric, total_p_kg numeric,
  total_k_kg numeric, total_mn_kg numeric, source_file text, source_sheet text
);
alter table public.dashboard_fertigation_plot_summary enable row level security;
revoke all on public.dashboard_fertigation_plot_summary from anon, authenticated;
insert into public.dashboard_fertigation_plot_summary values
('L003','P034','T1',0.46,'CO 86032','2026-05-01',105.80000000000001,52.900000000000006,55.2,9.2,'anthiyur_fertigation_chart.xlsx','PLOT A'),
('L003','P035','T2',0.44,'CO 86032','2026-05-01',60.28,37.84,40.04,17.6,'anthiyur_fertigation_chart.xlsx','PLOT B'),
('L003','P036','T3',0.43,'CO 86032','2026-05-01',92.26509999999999,32.030699999999996,47.1753,17.2,'anthiyur_fertigation_chart.xlsx','PLOT C'),
('L003','P037','T4',0.47,'CO 86032','2026-05-01',57.0815,19.025599999999997,38.055899999999994,18.8,'anthiyur_fertigation_chart.xlsx','PLOT D'),
('L003','P038','T5',0.39,'CO 86032','2026-05-01',71.05254000000001,33.6297,35.5251,15.6,'anthiyur_fertigation_chart.xlsx','PLOT E'),
('L002','P029','T1',0.14,'CO 86032','2026-04-04',32.41,16.2,16.89,2.8,'athani_fertigation_chart.xlsx','T1A'),
('L002','P030','T2',0.18,'CO 86032','2026-04-04',24.72,15.6,16.48,3.6,'athani_fertigation_chart.xlsx','T2B'),
('L002','P031','T3',0.13,'CO 86032','2026-04-04',27.88,2.69,21.53,2.6,'athani_fertigation_chart.xlsx','T3C'),
('L002','P032','T4',0.2,'CO 86032','2026-04-04',24.88,8.296,16.592,4.1,'athani_fertigation_chart.xlsx','T4D'),
('L002','P033','T5',0.15,'CO 86032','2026-04-04',27.13,12.84,13.57,3,'athani_fertigation_chart.xlsx','T5'),
('L001','P002','T2',0.09,'CO 86032','2026-02-03',16.3962,7.7607,8.1981,3.6,'college_fertigation_chart.xlsx','T2'),
('L001','P016','T2',0.09,'CO 86032','2026-02-03',16.3962,7.7607,8.1981,3.6,'college_fertigation_chart.xlsx','T2'),
('L001','P009','T9',0.09,'CO 86032','2026-02-03',12.2967,7.7607,8.1981,3.6,'college_fertigation_chart.xlsx','T9'),
('L001','P023','T9',0.09,'CO 86032','2026-02-03',12.2967,7.7607,8.1981,3.6,'college_fertigation_chart.xlsx','T9'),
('L001','P004','T4',0.09,'CO 86032','2026-02-03',8.1981,3.6431999999999998,7.287299999999999,3.6,'college_fertigation_chart.xlsx','T4'),
('L001','P018','T4',0.09,'CO 86032','2026-02-03',8.1981,3.6431999999999998,7.287299999999999,3.6,'college_fertigation_chart.xlsx','T4'),
('L001','P005','T5',0.09,'CO 86032','2026-02-03',8.1981,3.6431999999999998,7.287299999999999,3.6,'college_fertigation_chart.xlsx','T5'),
('L001','P019','T5',0.09,'CO 86032','2026-02-03',8.1981,3.6431999999999998,7.287299999999999,3.6,'college_fertigation_chart.xlsx','T5'),
('L001','P006','T6',0.09,'CO 86032','2026-02-03',8.1981,3.6431999999999998,7.287299999999999,3.6,'college_fertigation_chart.xlsx','T6'),
('L001','P020','T6',0.09,'CO 86032','2026-02-03',8.1981,3.6431999999999998,7.287299999999999,3.6,'college_fertigation_chart.xlsx','T6'),
('L001','P007','T7',0.09,'CO 86032','2026-02-03',8.1981,3.6431999999999998,7.287299999999999,3.6,'college_fertigation_chart.xlsx','T7'),
('L001','P021','T7',0.09,'CO 86032','2026-02-03',8.1981,3.6431999999999998,7.287299999999999,3.6,'college_fertigation_chart.xlsx','T7'),
('L001','P008','T8',0.09,'CO 86032','2026-02-03',12.2967,7.7607,8.1981,3.6,'college_fertigation_chart.xlsx','T8'),
('L001','P022','T8',0.09,'CO 86032','2026-02-03',12.2967,7.7607,8.1981,3.6,'college_fertigation_chart.xlsx','T8'),
('L001','P010','T10',0.09,'CO 86032','2026-02-03',12.2967,7.7607,8.1981,3.6,'college_fertigation_chart.xlsx','T10'),
('L001','P024','T10',0.09,'CO 86032','2026-02-03',12.2967,7.7607,8.1981,3.6,'college_fertigation_chart.xlsx','T10'),
('L001','P011','T11',0.09,'CO 86032','2026-02-03',12.2967,7.7607,8.1981,3.6,'college_fertigation_chart.xlsx','T11'),
('L001','P025','T11',0.09,'CO 86032','2026-02-03',12.2967,7.7607,8.1981,3.6,'college_fertigation_chart.xlsx','T11'),
('L001','P012','T12',0.09,'CO 86032','2026-02-03',15.5952,2.1860999999999997,8.854199999999999,3.6,'college_fertigation_chart.xlsx','T12'),
('L001','P026','T12',0.09,'CO 86032','2026-02-03',15.5952,2.1860999999999997,8.854199999999999,3.6,'college_fertigation_chart.xlsx','T12'),
('L001','P013','T13',0.09,'CO 86032','2026-02-03',18.729,3.2427,11.7324,3.6,'college_fertigation_chart.xlsx','T13'),
('L001','P027','T13',0.09,'CO 86032','2026-02-03',18.729,3.2427,11.7324,3.6,'college_fertigation_chart.xlsx','T13'),
('L001','P014','T14',0.09,'CO 86032','2026-02-03',20.7,10.35,10.799999999999999,3.6,'college_fertigation_chart.xlsx','T14'),
('L001','P028','T14',0.09,'CO 86032','2026-02-03',20.7,10.35,10.799999999999999,3.6,'college_fertigation_chart.xlsx','T14'),
('L001','P003','T3',0.09,'CO 86032','2026-02-03',10.9305,3.6431999999999998,7.287299999999999,3.6,'college_fertigation_chart.xlsx','T3'),
('L001','P017','T3',0.09,'CO 86032','2026-02-03',10.9305,3.6431999999999998,7.287299999999999,3.6,'college_fertigation_chart.xlsx','T3')
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
