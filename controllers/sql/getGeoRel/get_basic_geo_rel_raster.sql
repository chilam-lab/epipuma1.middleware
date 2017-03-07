select 
	cal.generovalido,
	epitetovalido,
	sum(cal.Nij) as nij,
	cal.nj, 
	cel.occ as Ni, 
	$<N> as n, 
	CASE WHEN cal.nj <> 0 
		then 
			round( cast(get_epsilon(cast(cal.nj as integer), cast(sum(cal.Nij) as integer), cast(cel.occ as integer), cast($<N> as integer)) as numeric),2) 
		else 
			0 
	end as epsilon, 
	CASE WHEN cal.nj <> 0 
		then 
			round( cast(  ln(get_score($<alpha>, cast(cal.nj as integer), cast(sum(cal.Nij) as integer), cast(cel.occ as integer), cast($<N> as integer) ) )as numeric), 2) 
		else 
			0 
	end as score,
	-- cal.spid,
	cal.reinovalido,
	cal.phylumdivisionvalido,
	cal.clasevalida,
	ordenvalido,
	cal.familiavalida 
	-- cal.label
	/*cal.spid,
	cal.reinovalido,
	cal.phylumdivisionvalido,
	cal.clasevalida,
	ordenvalido,
	cal.familiavalida,
	cal.generovalido,
	epitetovalido, 
	cal.label, 
	sum(cal.Nij) as nij,
	cal.nj, 
	cel.occ as Ni, 
	$<N> as n, 
	CASE WHEN cal.nj <> 0 then round( cast(get_epsilon(cast(cal.nj as integer), cast(sum(cal.Nij) as integer), cast(cel.occ as integer), cast($<N> as integer)) as numeric),2) else 0 end as epsilon, 
	CASE WHEN cal.nj <> 0 then round( cast(  ln(get_score($<alpha>, cast(cal.nj as integer), cast(sum(cal.Nij) as integer), cast(cel.occ as integer), cast($<N> as integer) ) )as numeric), 2) else 0 end as score*/ 
from sp_occ as cel, 
( 


	select 
		cast('' as text) as reinovalido,
		cast('' as text) as phylumdivisionvalido,
		cast('' as text) as clasevalida,
		cast('' as text) as ordenvalido,
		cast('' as text) as familiavalida, 
		label as generovalido, 
		tag as epitetovalido, 
		(label || ' ' || tag) as label, 
		w2.spid as spid,w2.Nij as Nij, 
		w2.Nj as Nj 
	from raster_bins 
	INNER JOIN ( 
		select 
			b.spids as spid, 
			COALESCE(a.counts,0) as Nij,
			b.occ as Nj 
		from ( 
			select 
				unnest(nbbio01_counts||nbbio02_counts||nbbio03_counts||nbbio04_counts||nbbio05_counts||nbbio06_counts||nbbio07_counts||nbbio08_counts||nbbio09_counts||nbbio10_counts||nbbio11_counts||nbbio12_counts||nbbio13_counts||nbbio14_counts||nbbio15_counts||nbbio16_counts||nbbio17_counts||nbbio18_counts||nbbio19_counts||nbelevacion_counts||nbpendiente_counts||nbtopidx_counts) as counts, 
				unnest(nbbio01_spids||nbbio02_spids||nbbio03_spids||nbbio04_spids||nbbio05_spids||nbbio06_spids||nbbio07_spids||nbbio08_spids||nbbio09_spids||nbbio10_spids||nbbio11_spids||nbbio12_spids||nbbio13_spids||nbbio14_spids||nbbio15_spids||nbbio16_spids||nbbio17_spids||nbbio18_spids||nbbio19_spids||nbelevacion_spids||nbpendiente_spids||nbtopidx_spids) as spids, 
				occ 
			from sp_occ 
			where spid =  $<spid>  
		) as a 
		RIGHT JOIN ( 
			select 
				idsp as spids,
				0 as counts,
				occ 
			from sp_idocc 
		) as b 
		ON a.spids = b.spids 
	) as w2 
	ON raster_bins.bid = w2.spid  
	-- layer = "bio01"
	$<where_config_raster:raw>
	order by spid 
	
	
	
) as cal 
where cel.spid =  $<spid>  
group by 
	cal.spid, 
	cal.reinovalido, 
	cal.phylumdivisionvalido, 
	cal.clasevalida,
	ordenvalido, 
	cal.familiavalida, 
	cal.generovalido, 
	epitetovalido,  
	cal.label,  
	cal.nj,  
	cel.occ,  
	n 
ORDER BY epsilon
	
	
	
	
	
	