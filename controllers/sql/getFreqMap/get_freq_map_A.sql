with rawdata as ( 
	select 
		cal.spid, sum(cal.Nij) as nij,  cal.nj,  cel.occ as ni,
		$<N> as n,
		-- 6473 as n  , 
		CASE WHEN cal.Nj <> 0 then ln( get_score($<alpha>, cal.Nj::integer, sum(cal.Nij)::integer, cel.occ::integer, $<N>::integer) ) else 0 end as score 
		from sp_occ as cel, ( 
			select 		w2.spid as spid, 
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
			union 
		 	select 
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
			-- order by spid 
		) as cal 
		where cel.spid =  $<spid> -- 49405 
		group by 	cal.spid, cal.nj, cel.occ, n 
		ORDER BY spid DESC 
),  
gsptierra as ( 
	select * from sp_grid_terrestre 
) , 
apriori as (
	select ln( ni / ( n - ni::numeric) ) as val from rawdata limit 1
) 
select gsptierra.gridid, COALESCE((prgeom.tscore + prgeom.ln_sum), apriori.val) as tscore 
from ( 
	select 	gsp.gridid as gridid, sum(rawdata_scores.score) as tscore, 
			ln( rawdata_scores.ni / ( rawdata_scores.n - rawdata_scores.ni::numeric) ) as ln_sum 
	from ( 
		select unnest( 
				animalia||plantae||fungi||protoctista||prokaryotae|| animalia_exoticas || plantae_exoticas || fungi_exoticas || protoctista_exoticas || prokaryotae_exoticas || bio01||bio02||bio03||bio04||bio05||bio06||bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19 ||elevacion || pendiente || topidx 
			) as spid, 
			gridid 
		from gsptierra 
	) as gsp 
	RIGHT JOIN ( 
		select *  
		from rawdata where score is not null 
	) as rawdata_scores 
	ON rawdata_scores.spid = gsp.spid 
	GROUP BY gridid , rawdata_scores.ni, rawdata_scores.n 
) as prgeom 
right JOIN gsptierra 
ON prgeom.gridid = gsptierra.gridid ,apriori 
where gsptierra.gridid is not null 
order by tscore desc 