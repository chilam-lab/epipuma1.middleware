/*getFreq validacion*/
WITH source AS (
	SELECT spid, $<res_celda:raw> as cells 
	FROM sp_snib 
	WHERE 
		spid = $<spid>
		--spid = 33553
		and especievalidabusqueda <> ''
),
target AS (
	SELECT  spid,
			$<res_celda:raw> as cells 
	FROM sp_snib
	$<where_config:raw>
	--WHERE clasevalida = 'Mammalia'
	--WHERE ordenvalido = 'Carnivora'
	and especievalidabusqueda <> ''
),
filter_ni AS (
		SELECT 	spid, 
				icount( cells - array[$<arg_gridids:raw>] ) as ni,
				cells - array[$<arg_gridids:raw> ]  as cells
		FROM source 
), 
filter_nj AS(
		select 	spid, 
				icount(cells - array[$<arg_gridids:raw>]) AS nj,
				cells - array[ $<arg_gridids:raw> ]  AS cells
		FROM target 
),
filter_nij AS(
		select 	filter_nj.spid, 
				icount(filter_ni.cells & filter_nj.cells) AS niyj
				--icount(source.cells & target.cells & array[573324, 581126, 507259 ]) AS d_niyj
		FROM filter_ni, filter_nj
),
counts AS (
	SELECT 	filter_nij.niyj, 
			filter_ni.ni,
			filter_nj.nj,
			$<N> - icount(array[$<arg_gridids:raw>]) as n
			--14707 - icount(array[573324, 581126, 507259 ]) as n,
	FROM source, target, filter_ni, filter_nj, filter_nij
	where 	
			target.spid <> $<spid>
			--target.spid <> 33553
			and source.spid = filter_ni.spid
			and target.spid = filter_nj.spid
			and target.spid = filter_nij.spid
			and filter_nj.nj > $<min_occ:raw>
			--and (icount(target.cells) - filter_nj.d_nj) > 0
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