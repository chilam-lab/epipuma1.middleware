with rawdata as ( 
	select 
		cal.spid, 
		label, 
		cel.occ as ni, 
		sum(cal.Nij) as nij, cal.nj, 
		$<N> as n, -- 6473 as n, 
		round( cast(get_epsilon(cast(cal.nj as integer), cast(sum(cal.Nij) as integer), cast(cel.occ as integer), cast($<N> as integer)) as numeric),2) as epsilon, 
		round( cast(  ln(get_score($<alpha>, cast(cal.nj as integer), cast(sum(cal.Nij) as integer), cast(cel.occ as integer), cast($<N> as integer) ) )as numeric), 2) as score 
	from sp_occ as cel, ( 	
		
		select 	reinovalido,
				phylumdivisionvalido,
				clasevalida,
				ordenvalido,
				familiavalida,
				
				generovalido,
				epitetovalido,
				
				cast('' as text) as bioclim, 
				cast('' as text) as rango,
				
				(generovalido || ' ' || epitetovalido)  as label,
				
				w2.spid as spid, w2.Nij as Nij, w2.Nj as Nj 
		from sp_snib 
			INNER JOIN ( 
				select b.spids as spid, COALESCE(a.counts,0) as Nij,b.occ as Nj from ( select  cast(sum(counts) as integer) as counts, spids, occ 
				from( 
					select 
						unnest(nbanimalia_counts||nbplantae_counts||nbfungi_counts||nbprotoctista_counts||nbprokaryotae_counts||nbanimalia_exoticas_counts||nbplantae_exoticas_counts||nbfungi_exoticas_counts||nbprotoctista_exoticas_counts||nbprokaryotae_exoticas_counts) as counts, 
						unnest(nbanimalia_spids||nbplantae_spids||nbfungi_spids||nbprotoctista_spids||nbprokaryotae_spids||nbanimalia_exoticas_spids||nbplantae_exoticas_spids||nbfungi_exoticas_spids||nbprotoctista_exoticas_spids||nbprokaryotae_exoticas_spids) as spids, occ 
					from sp_occ 
					where spid = $<spid> -- 49405 -- $<spid> 
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
	where cel.spid =  $<spid> -- 49405 
	group by cal.spid, label, cel.occ, cal.nj, n 
),  
gsptierra as ( 
	select * from sp_grid_terrestre 
), 
prenorm as ( 
	select gsp.gridid as gridid, sum(rawdata.score) as tscore, array_agg(rawdata.spid|| '|' ||rawdata.label|| '|' ||rawdata.epsilon::text|| '|' ||rawdata.score::text|| '|' ||rawdata.nj::text) as array_sp 
	from ( 
		select unnest( animalia||plantae||fungi||protoctista||prokaryotae|| animalia_exoticas || plantae_exoticas || fungi_exoticas || protoctista_exoticas || prokaryotae_exoticas || bio01||bio02||bio03||bio04||bio05||bio06||bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19 ||elevacion || pendiente || topidx 
				) as spid, 
				gridid 
		from gsptierra 
	) as gsp 
	INNER JOIN rawdata ON rawdata.spid = gsp.spid  
	GROUP BY gridid 
	order by tscore desc 
), 
deciles as ( 
	SELECT gridid, tscore, array_sp, ntile(10) over (order by tscore) AS decil 
	FROM prenorm ORDER BY tscore 
) 
select 
	cast(round( cast(max(tscore) as numeric),2) as float) as l_sup, 
	cast(round( cast(min(tscore) as numeric),2) as float) as l_inf, 
	cast(round( cast(sum(tscore) as numeric),2) as float) as sum, 
	cast(round( cast(avg(tscore) as numeric),2) as float) as avg, 
	decil, array_agg(gridid) as gridids, 
	array_agg(array_to_string(array_sp,',')) as arraynames 
from deciles 
group by decil 
order by decil desc