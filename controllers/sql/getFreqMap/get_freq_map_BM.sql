with rawdata as ( 
	select cal.spid, sum(cal.Nij) as nij,  cal.nj,  
			cel.occ as ni,
			$<N> as n,
			--6473 as n, 
			CASE WHEN cal.Nj <> 0 then ln( get_score($<alpha>, cal.Nj::integer, sum(cal.Nij)::integer, cel.occ::integer, $<N>::integer) ) else 0 end as score 
	from sp_occ as cel, ( 
		select 	w2.spid as spid, 
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
					--where spid = 49405 
					 where spid = $<spid> 
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
		--where sp_snib.spid <> 49405 and clasevalida = 'Mammalia' and epitetovalido <> ''    
		order by spid 
	) as cal 
	where cel.spid =  $<spid> -- 49405 
	group by 	cal.spid, cal.nj, cel.occ, n ORDER BY spid DESC 
),  
gsptierra as ( 
	select * from sp_grid_terrestre 
) , 
apriori as (
	select ln( ni / ( n - ni::numeric) ) as val 
	from rawdata limit 1
) 
