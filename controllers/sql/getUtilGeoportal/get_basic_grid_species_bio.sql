with rawdata as (
	select cal.*, 
			cel.occ as Ni, 
			$<N> as n,  -- 6473 as n ---- 
			ln(get_score($<alpha>,cal.Nj,cal.Nij,cel.occ,$<N>)) as score
			
	from sp_occ as cel, (
	
		select 	reinovalido,phylumdivisionvalido,clasevalida,ordenvalido,familiavalida,generovalido,epitetovalido, 
					(generovalido || ' ' || epitetovalido)  as label, 
					w2.spid as spid, 
					w2.Nij as Nij, 
					w2.Nj as Nj 
			from sp_snib 
			INNER JOIN ( 
				select b.spids as spid, COALESCE(a.counts,0) as Nij,b.occ as Nj from ( select  cast(sum(counts) as integer) as counts, spids, occ 
				from( 
					select 
						unnest(nbanimalia_counts||nbplantae_counts||nbfungi_counts||nbprotoctista_counts||nbprokaryotae_counts||nbanimalia_exoticas_counts||nbplantae_exoticas_counts||nbfungi_exoticas_counts||nbprotoctista_exoticas_counts||nbprokaryotae_exoticas_counts) as counts, 
						unnest(nbanimalia_spids||nbplantae_spids||nbfungi_spids||nbprotoctista_spids||nbprokaryotae_spids||nbanimalia_exoticas_spids||nbplantae_exoticas_spids||nbfungi_exoticas_spids||nbprotoctista_exoticas_spids||nbprokaryotae_exoticas_spids) as spids, occ 
					from sp_occ 
					where spid = $<spid>  --49405 --  
				) as d 
				group by spids, occ 
			) as a 
			RIGHT JOIN ( 
				select idsp as spids,0 as counts,occ 
				from sp_idocc 
			) as b 
			ON a.spids = b.spids 
		) as w2 
		ON sp_snib.spid = w2.spid
		$<where_config:raw>
		 -- where 	sp_snib.spid <> 49405 and clasevalida = 'Mammalia' and epitetovalido <> ''   
		order by spid 
		
	) as cal 
	where cel.spid = $<spid> -- 49405 -- 
),  
grid_spid as ( 
	SELECT 	gridid, 
			unnest( animalia||plantae||fungi||protoctista||prokaryotae||bio01||bio02||bio03||bio04||bio05||bio06|| bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19 ||elevacion || pendiente || topidx ) as spid 
	FROM public.grid_sp 
	where gridid = $<idGrid>
	-- where gridid = 3151
), 
gridsps as ( 
	select gridid, spid, nom_sp, rango, label 
	from ( 
	( 
			select gridid, grid_spid.spid, generovalido || ' ' || epitetovalido as nom_sp, '' as rango, '' as label 
			from sp_snib 
			join grid_spid 
			on grid_spid.spid = sp_snib.spid 
	)
	union ( 
		select gridid, grid_spid.spid, '' as nom_sp, tag as rango, label 
		from raster_bins 
		join grid_spid 
		on grid_spid.spid = raster_bins.bid 
	) 
	) as total 
	where nom_sp <> ' ' and rango <> ' '  order by spid 
) 
select gridsps.*,  score 
from gridsps  
join rawdata 
on gridsps.spid = rawdata.spid 
order by score desc