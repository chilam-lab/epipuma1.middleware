with rawdata as ( 
	select 
		cal.spid, sum(cal.Nij) as nij,  cal.nj,  cel.occ as ni,
		$<N> as n,
		-- 6473 as n  , 
		CASE WHEN cal.Nj <> 0 then ln( get_score($<alpha>, cal.Nj::integer, sum(cal.Nij)::integer, cel.occ::integer, $<N>::integer) ) else 0 end as score 
		from sp_occ as cel, ( 
			
		select 
				w2.spid as spid,
				w2.Nij as Nij, 
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
					where spid =  $<spid> -- 49405  
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
			--where layer = 'bio01'
			$<where_config_raster:raw>
			order by spid 
		
		) as cal 
		where cel.spid =  $<spid> -- 49405 
		group by 	cal.spid, cal.nj, cel.occ, n 
		ORDER BY spid DESC 
),
grid_spid as ( 
	SELECT gridid, 
			unnest( animalia||plantae||fungi||protoctista||prokaryotae||bio01||bio02||bio03||bio04||bio05||bio06|| bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19 ||elevacion || pendiente || topidx ) as spid 
	FROM public.grid_sp 
	where gridid = $<idGrid> 
), 
gridsps as ( 
	select gridid, spid, nom_sp, rango, label 
	from ( 
			( 
			select gridid, grid_spid.spid, generovalido || ' ' || epitetovalido as nom_sp, '' as rango, '' as label 
			from sp_snib join grid_spid on grid_spid.spid = sp_snib.spid 
			)
			union 
			( 
			select gridid, grid_spid.spid, '' as nom_sp, tag as rango, label 
			from raster_bins 
			join grid_spid 
			on grid_spid.spid = raster_bins.bid 
			) 
		) as total 
	where nom_sp <> ' ' and rango <> ' '  order by spid 
), 	
ind_scores as ( 
	select gridsps.*, score  
	from gridsps  
	join rawdata  
	on gridsps.spid = rawdata.spid 
	order by score desc 
),
cell_value as ( 
	select gridsps.gridid, (sum(score) + ln(rawdata.ni / (rawdata.n - rawdata.ni::numeric))) as cell_val 
	from gridsps  
	join rawdata 
	on gridsps.spid = rawdata.spid 
	group by gridsps.gridid, rawdata.ni, rawdata.n
)
select 	ind_scores.*, 
		case when cell_val <= -700 then 0.00 * 100 
			when cell_val >= 700 then 1.00 * 100 
			else exp(cell_val) / (1 + exp(cell_val)) * 100 
		end as prob 
from ind_scores 
join cell_value 
on ind_scores.gridid = cell_value.gridid
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	