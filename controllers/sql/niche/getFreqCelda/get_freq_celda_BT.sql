/*getFreqCelda sin filtros*/
WITH source AS (
	SELECT spid, cells 
	FROM sp_snib 
	WHERE 
		spid = $<spid>
		--spid = 33553
		and especievalidabusqueda <> ''
),
target AS (
	SELECT  spid,
			cells 
	FROM sp_snib
	$<where_config:raw>
	--WHERE clasevalida = 'Mammalia'
	--WHERE ordenvalido = 'Carnivora'
	and especievalidabusqueda <> ''
),
-- el arreglo contiene las celdas donde la especie objetivo debe ser descartada 
filter_ni AS (
	SELECT 	spid,
			array_agg(distinct gridid) as ids_ni,
			icount(array_agg(distinct gridid)) as ni
	FROM snib 
			where --snib.fechacolecta <> ''
			/*((
			cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( 2000  as integer)
			and 
			cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( 2020  as integer)
			)
			or snib.fechacolecta = '')*/
			(case when $<caso> = 1 
				  then 
				  		fechacolecta <> '' 
				  when $<caso> = 2 
				  then
				  		cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf>  as integer)
						and 
						cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup>  as integer)
				  else
				  		((
						cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf>  as integer)
						and 
						cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup>  as integer)
						)
						or snib.fechacolecta = '')
			end) = true
			--and spid = 33553
			and spid = $<spid>
			and especievalidabusqueda <> ''
	group by spid
),
filter_nj AS (
	SELECT 	
		snib.spid, 
		array_agg(distinct gridid) as ids_nj,
		icount(array_agg(distinct gridid)) as nj
	FROM snib, target
	where --snib.fechacolecta <> ''
		/*((
		cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( 2000  as integer)
		and 
		cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( 2020  as integer)
		)
		or snib.fechacolecta = '')*/
		(case when $<caso> = 1 
			  then 
			  		fechacolecta <> '' 
			  when $<caso> = 2 
			  then
			  		cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf>  as integer)
					and 
					cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup>  as integer)
			  else
			  		((
					cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf>  as integer)
					and 
					cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup>  as integer)
					)
					or snib.fechacolecta = '')
		end) = true
		and snib.spid = target.spid
		and snib.especievalidabusqueda <> ''
	group by snib.spid
	--order by spid
	--limit 1
),
filter_nij AS(
	select 	distinct filter_nj.spid, 
			icount(filter_ni.ids_ni & filter_nj.ids_nj) AS niyj
	FROM filter_ni, filter_nj --, source, target
	--where filter_ni.spid = source.spid
	--and filter_nj.spid = target.spid
),
counts AS (
	SELECT 	--source.spid as source_spid,
			target.spid,
			filter_nj.ids_nj as cells,
			filter_nj.nj,
			filter_ni.ni,
			filter_nij.niyj,
			$<N> as n
			--14707 as n,
			
	FROM target, filter_ni, filter_nj, filter_nij
	where 	
			target.spid <> $<spid>
			--target.spid <> 33553
			--and source.spid = filter_ni.spid
			and target.spid = filter_nj.spid
			and target.spid = filter_nij.spid
			and filter_nj.nj > $<min_occ:raw>
			--and filter_nj.nj > 0
			--and filter_nj.nj < filter_nij.niyj
			order by spid
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
	select gridid from grid_20km_mx
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