with rawdata as ( 
	select 	cal.spid, label, 
			cel.occ as ni, 
			sum(cal.Nij) as nij, 
			cal.nj, 
			-- 6473 as n, 
			$<N> as n, 
			round( cast(get_epsilon(cast(cal.nj as integer), cast(sum(cal.Nij) as integer), cast(cel.occ as integer), cast($<N> as integer)) as numeric),2) as epsilon, 
			round( cast(  ln(get_score($<alpha>, cast(cal.nj as integer), cast(sum(cal.Nij) as integer), cast(cel.occ as integer), cast($<N> as integer) ) )as numeric), 2) as score 
	from sp_occ as cel, 
	( 
		select cast('' as text) as reinovalido,cast('' as text) as phylumdivisionvalido,cast('' as text) as clasevalida,cast('' as text) as ordenvalido,cast('' as text) as familiavalida,  
				cast('' as text) as generovalido, cast('' as text) as epitetovalido, 
				label as bioclim, tag as rango,	
				(label || ' ' || tag) as label,
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
					where spid =  $<spid> 
					-- where spid =   49405  
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
			-- where layer = 'bio01'
			$<where_config_raster:raw>
			order by spid 
	) as cal 
	where cel.spid =  $<spid>
	-- where cel.spid =  49405 
	group by cal.spid, label, cel.occ, cal.nj, n 
),  
gsptierra as ( 
	select * from sp_grid_terrestre 
), 
prenorm as ( 
	select 	gsp.gridid as gridid, 
			sum(rawdata.score) + ln(rawdata.ni / (rawdata.n - rawdata.ni::numeric)) as tscore, 
			array_agg(rawdata.spid|| '|' ||rawdata.label|| '|' ||rawdata.epsilon::text|| '|' ||rawdata.score::text|| '|' ||rawdata.nj::text) as array_sp 
	from ( 
		select unnest( 
					animalia||plantae||fungi||protoctista||prokaryotae|| animalia_exoticas || plantae_exoticas || fungi_exoticas || protoctista_exoticas || prokaryotae_exoticas || bio01||bio02||bio03||bio04||bio05||bio06||bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19 ||elevacion || pendiente || topidx 
				) as spid, 
				gridid 
		from gsptierra 
	) as gsp 
	INNER JOIN rawdata 
	ON rawdata.spid = gsp.spid  
	GROUP BY gridid , rawdata.ni, rawdata.n 
	order by tscore desc 
), 
deciles as ( 
	SELECT 	gridid, tscore, array_sp, 
			ntile(10) over (order by tscore) AS decil 
	FROM prenorm 
	ORDER BY tscore 
) 
select 	cast(round( cast(max(tscore) as numeric),2) as float) as l_sup, 
		cast(round( cast(min(tscore) as numeric),2) as float) as l_inf, 
		cast(round( cast(sum(tscore) as numeric),2) as float) as sum, 
		cast(round( cast(avg(tscore) as numeric),2) as float) as avg, 
		decil, array_agg(gridid) as gridids, 
		array_agg(array_to_string(array_sp,',')) as arraynames 
from deciles 
group by decil 
order by decil desc




