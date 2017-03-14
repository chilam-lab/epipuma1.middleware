/*getGeoRel con proceso de validación y tiempo*/
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
	
	union
	
	SELECT  bid as spid,
			cells 
	FROM raster_bins 
	$<where_config_raster:raw>	
	
),
-- celdas de ni resultantes despues de filtro de tiempo y validación
filter_ni_tv AS (
	SELECT 	spid,
			array_agg(distinct gridid) - array[ $<arg_gridids:raw> ] as cells
			--icount(array_agg(distinct gridid)) as ni
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
-- celdas de nj resultantes despues de filtro de tiempo 
filter_nj_tv AS (
	SELECT 	
		snib.spid, 
		array_agg(distinct gridid) - array[ $<arg_gridids:raw> ] as cells
		--icount(array_agg(distinct gridid)) as nj
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
	
	union
		
	SELECT  bid as spid,
			cells
			--icount(cells) as nj
	FROM raster_bins 
	$<where_config_raster:raw>
		
),
-- celdas de nij resultantes despues de filtro de tiempo 
filter_nij_tv AS(
	select 	filter_nj_tv.spid, 
			filter_ni_tv.cells & filter_nj_tv.cells AS cells
			--icount(filter_ni_tiempo.ids_ni & filter_nj_tiempo.ids_nj) AS niyj
	FROM filter_nj_tv, filter_ni_tv
	--order by spid
),
counts AS (
	SELECT 	target.spid,
			icount(filter_nj_tv.cells) as nj,
			icount(filter_ni_tv.cells) as ni,
			icount(filter_nij_tv.cells) as niyj,
			$<N> - icount(array[$<arg_gridids:raw> ]) as n
			--14707 - icount(array[$<arg_gridids:raw> ]) as n,
	FROM 	target, 
			filter_ni_tv, filter_nj_tv, filter_nij_tv
	where 	
			target.spid <> $<spid>
			--target.spid <> 33553
			--and source.spid = filter_ni.spid
			and target.spid = filter_nj_tv.spid
			and target.spid = filter_nij_tv.spid
			--and filter_nj.nj > $<min_occ:raw>
			and icount(filter_nj_tv.cells) > 0
			--and filter_nj.nj < filter_nij.niyj
			order by spid
),
rawdata as (
	SELECT 	round( cast(  
			get_epsilon(
				$<alpha>,
				--0.01,
				cast(counts.nj as integer), 
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast($<N> as integer)
				--cast(14707 as integer)
		)as numeric), 2)  as epsilon,
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
	ORDER BY epsilon desc
), 
minmax_scores as ( 
	select 	min(score) as mineps, (max(score)) as maxeps from rawdata
), 
minmax_epsilon as ( 
	select min(epsilon) as mineps, (max(epsilon)) as maxeps 
	from rawdata
), 
histogram_scores as ( 
	select mineps, maxeps, hist.bucket as bucket, hist.freq as freq 
	from ( 
		select CASE WHEN mineps-maxeps = 0 THEN 1 ELSE width_bucket(score, mineps, maxeps, 20) END as bucket, count(*) as freq 
		from minmax_scores, rawdata 
		group by bucket 
		order by bucket 
	) as hist, minmax_scores
), 
histogram_epsilon as ( 
	select mineps, maxeps, hist.bucket as bucket, hist.freq as freq 
	from ( 
		select CASE WHEN mineps-maxeps = 0 THEN 1 ELSE width_bucket(epsilon, mineps, maxeps, 20) END as bucket, count(*) as freq 
		from minmax_epsilon, 
		rawdata 
		group by bucket 
		order by bucket 
	) as hist, 
	minmax_epsilon
) 
select 	b1.bucket, 
		round( cast( b1.freq_score as numeric ), 2 ) as freq_score, 
		trunc(cast(minmax_scores.mineps + ((minmax_scores.maxeps - minmax_scores.mineps)/20) * (b1.bucket-1) as numeric), 2) as min_score, 
		trunc(cast(minmax_scores.mineps + ((minmax_scores.maxeps - minmax_scores.mineps)/20) * (b1.bucket) as numeric), 2) as max_score, 
		round( cast( b1.freq_epsilon as numeric ), 2 ) as freq_epsilon, 
		trunc(cast(minmax_epsilon.mineps + ((minmax_epsilon.maxeps - minmax_epsilon.mineps)/20) * (b1.bucket-1) as numeric), 2) as min_epsilon, 
		trunc(cast(minmax_epsilon.mineps + ((minmax_epsilon.maxeps - minmax_epsilon.mineps)/20) * (b1.bucket) as numeric), 2) as max_epsilon 
from ( 
	select 	c.bucket as bucket, 
			c.freq as freq_score, 
			d.freq as freq_epsilon 
	from  ( 
		select a2.bucket as bucket, COALESCE(a1.freq,0) as freq 
		from ( 
			select bucket, freq from histogram_scores  
		) as a1 
		RIGHT JOIN ( 
			select a.n as bucket 
			from generate_series(1, 20) as a(n) 
		) as a2 ON a1.bucket = a2.bucket 
	) as c 
	FULL JOIN ( 
		select a2.bucket as bucket, COALESCE(a1.freq,0) as freq 
		from ( 
			select bucket, freq 
			from histogram_epsilon 
		) as a1 
		RIGHT JOIN ( 
			select a.n as bucket 
			from generate_series(1, 20) as a(n) 
		) as a2 
		ON a1.bucket = a2.bucket 
	) as d 
	ON c.bucket = d.bucket 
) as b1, 
minmax_scores, 
minmax_epsilon



