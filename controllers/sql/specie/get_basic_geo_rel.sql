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
from sp_occ as cel, ( 	
		select 
			reinovalido,
			phylumdivisionvalido,
			clasevalida,
			ordenvalido,
			familiavalida,
			generovalido,
			epitetovalido, 
			(generovalido || ' ' || epitetovalido)  as label, 
			w2.spid as spid, 
			w2.Nij as Nij, 
			w2.Nj as Nj 
		from sp_snib 
		INNER JOIN ( 
			select 
				b.spids as spid, 
				COALESCE(a.counts,0) as Nij,
				b.occ as Nj 
			from ( 
				select 
					cast(sum(counts) as integer) as counts, 
					spids, 
					occ 
				from( 
					select 
						unnest(nbanimalia_counts||nbplantae_counts||nbfungi_counts||nbprotoctista_counts||nbprokaryotae_counts||nbanimalia_exoticas_counts||nbplantae_exoticas_counts||nbfungi_exoticas_counts||nbprotoctista_exoticas_counts||nbprokaryotae_exoticas_counts) as counts, 
						unnest(nbanimalia_spids||nbplantae_spids||nbfungi_spids||nbprotoctista_spids||nbprokaryotae_spids||nbanimalia_exoticas_spids||nbplantae_exoticas_spids||nbfungi_exoticas_spids||nbprotoctista_exoticas_spids||nbprokaryotae_exoticas_spids) as spids, 
						occ 
					from sp_occ 
					where spid = $<spid> -- 49405  
				) as d 
				group by spids, occ 
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
		ON sp_snib.spid = w2.spid   
		$<where_config:raw>
		--where sp_snib.spid <> 49405 and clasevalida = 'Mammalia' and epitetovalido <> ''
		union 
	 	select 
			cast('' as text) as reinovalido,
			cast('' as text) as phylumdivisionvalido,
			cast('' as text) as clasevalida,
			cast('' as text) as ordenvalido,
			cast('' as text) as familiavalida, 
			label as generovalido, 
			tag as epitetovalido, 
			(label || ' ' || tag) as label, 
			w2.spid as spid,
			w2.Nij as Nij, 
			w2.Nj as Nj 
		from raster_bins 
		INNER JOIN ( 
			select b.spids as spid, 
				COALESCE(a.counts,0) as Nij,
				b.occ as Nj 
			from ( 
				select 
					unnest(nbbio01_counts||nbbio02_counts||nbbio03_counts||nbbio04_counts||nbbio05_counts||nbbio06_counts||nbbio07_counts||nbbio08_counts||nbbio09_counts||nbbio10_counts||nbbio11_counts||nbbio12_counts||nbbio13_counts||nbbio14_counts||nbbio15_counts||nbbio16_counts||nbbio17_counts||nbbio18_counts||nbbio19_counts||nbelevacion_counts||nbpendiente_counts||nbtopidx_counts) as counts, 
					unnest(nbbio01_spids||nbbio02_spids||nbbio03_spids||nbbio04_spids||nbbio05_spids||nbbio06_spids||nbbio07_spids||nbbio08_spids||nbbio09_spids||nbbio10_spids||nbbio11_spids||nbbio12_spids||nbbio13_spids||nbbio14_spids||nbbio15_spids||nbbio16_spids||nbbio17_spids||nbbio18_spids||nbbio19_spids||nbelevacion_spids||nbpendiente_spids||nbtopidx_spids) as spids, 
					occ 
				from sp_occ 
				where spid = $<spid>  -- 69495
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
		$<where_config_raster:raw>
		-- where  layer = 'bio01'
		-- order by spid */
) as cal
where cel.spid = $<spid> -- 49405 
group by cal.spid, cal.reinovalido, cal.phylumdivisionvalido, cal.clasevalida,ordenvalido, cal.familiavalida, cal.generovalido, epitetovalido,  cal.label,  cal.nj,  cel.occ,  n 
ORDER BY epsilon;
			
			
			
			
			