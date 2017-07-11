/*getFreq sin filtros*/
with rawdata as (

	select
		-- out_generovalido,
		out_spid as spid,
		out_especievalidabusqueda as especievalidabusqueda,
		round(avg(out_nij),2) as nij,
		round(avg(out_nj),2) as nj,
		-- avg(out_ni),
		avg(out_ni)::int as ni,  
	 	avg(out_n)::int as n,
	 	out_reinovalido as reinovalido,
	 	out_phylumdivisionvalido as phylumdivisionvalido,
	 	out_clasevalida as clasevalida,
	 	out_ordenvalido as ordenvalido,
	 	out_familiavalida as familiavalida,
		round(avg(out_epsilon),2) as epsilon,
		round(avg(out_score),2) as score
	from iteratevalidationprocess($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda:raw>', '$<where_config:value>', '', 'bio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, '$<fossil:value>')
	-- from iteratevalidationprocess(5, 28923, 94544, 0.01, 0, array[]::int[], 'gridid_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio', true, 2, 2010, 2020)
	where out_spid is not null
	group by 	out_spid,
				out_especievalidabusqueda,
				out_reinovalido, out_phylumdivisionvalido, out_clasevalida, out_ordenvalido, out_familiavalida
	order by epsilon desc

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