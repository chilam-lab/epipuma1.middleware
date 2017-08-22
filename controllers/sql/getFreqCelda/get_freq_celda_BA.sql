with rawdata as (
	select
		out_cell as gridid,
		out_ni as ni,
		out_score as tscore
	from iteratevalidationprocessbycells($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>', '$<where_config:value>', '', 'bio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, false, '$<fossil:value>', '$<idtabla:value>')
	-- from iteratevalidationprocessbycells(1, 28923, 94544, 0.01, 0, array[]::int[], 'gridid_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio', true, 2, 2010, 2020, false)
	where out_cell is not null
),
apriori as (
	select ln( rawdata.ni / ( $<N> - rawdata.ni::numeric) ) as val
	-- select ln( rawdata.ni / ( 94544 - rawdata.ni::numeric) ) as val 
	from rawdata limit 1
),
prenorm as (
	select 	grid_16km_aoi.gridid_16km AS gridid, 
			COALESCE(tscore+apriori.val, apriori.val) as tscore 
	from rawdata
	right join grid_16km_aoi
	on rawdata.gridid = grid_16km_aoi.gridid_16km,
	apriori
	order by tscore desc
),
minmax as ( 
	select min(tscore) as mineps, (max(tscore)+0.1) as maxeps from prenorm
),
histogram as ( 
	select mineps, maxeps, hist.bucket as bucket, hist.freq as freq from ( select 	CASE WHEN mineps-maxeps = 0 THEN 1 ELSE width_bucket(tscore, mineps, maxeps, 20) END as bucket, count(*) as freq from minmax, prenorm group by bucket order by bucket ) as hist, minmax 
) 
select 	b1.bucket, 
		b1.freq, 
		round(cast(mineps + ((maxeps - mineps)/20) * (b1.bucket-1) as numeric), 2) as min, 
		round(cast(mineps + ((maxeps - mineps)/20) * (b1.bucket) as numeric), 2) as max 
from ( 
	select 
		a2.bucket as bucket,COALESCE(a1.freq,0) as freq 
	from ( select bucket,freq from histogram ) as a1 
	RIGHT JOIN ( 
		select a.n as bucket from generate_series(1, 20) as a(n) 
	) as a2 
	ON a1.bucket = a2.bucket
) as b1, 
minmax




