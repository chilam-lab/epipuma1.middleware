/*getMap sin filtros*/
WITH source AS (
	SELECT spid, $<res_celda:raw> as cells 
	FROM sp_snib 
	WHERE 
		spid = $<spid>		
		and especievalidabusqueda <> ''
),
target AS (
	SELECT  spid,
			$<res_celda:raw> as cells 
	FROM sp_snib 
	--WHERE clasevalida = 'Mammalia'
	$<where_config:raw>	 
	and especievalidabusqueda <> ''
	
	union
	
	SELECT  bid as spid,
			$<res_celda:raw> as cells 
	FROM raster_bins 
	$<where_config_raster:raw>	 
),
counts AS (
	SELECT 	target.spid,
			target.cells,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni
	FROM source,target
	where target.spid <> $<spid>
	and icount(target.cells) > $<min_occ:raw>
),
rawdata as (
	SELECT 	--counts.spid,
			counts.cells,
			round( cast(  ln(   
				get_score(
					$<alpha>,
					--0.01,
					cast(counts.nj as integer), 
					cast(counts.niyj as integer), 
					cast(counts.ni as integer), 
					cast($<N> as integer)
					--cast(14707 as integer)
				)
			)as numeric), 2) as score
	FROM counts 
	--ORDER BY epsilon desc
),
basic_score as (
	select 	unnest(cells) as gridid, 
		sum(score) as tscore
	from rawdata
	group by gridid
	order by tscore desc
),
allgridis as(
	select $<res_grid:raw> as gridid from grid_16km_aoi
),
prenorm as (
	select 	allgridis.gridid, 
			COALESCE(tscore, 0) as tscore 
	from basic_score
	right join allgridis
	on basic_score.gridid = allgridis.gridid
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
