with first_rawdata as ( 
	select cal.spid, 
			sum(cal.Nij) as nij, 
			cal.nj, 
			cel.occ as ni, 
			$<N> as n -- 6473 as n 
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
		-- where sp_snib.spid <> 49405 and clasevalida = 'Mammalia' and epitetovalido <> ''
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
	where cel.spid =  $<spid>  and abs(get_epsilon(cal.nj::integer, nij::integer, cel.occ::integer, $<N>::integer)) > 0 
	group by 	cal.spid,  cal.nj, cel.occ, n
), 
gridspddiscarded as ( select 	gridid, ( animalia || plantae || fungi || protoctista || prokaryotae || animalia_exoticas || plantae_exoticas || fungi_exoticas || protoctista_exoticas || prokaryotae_exoticas || bio01 || bio02 || bio03 || bio04 || bio05 || bio06 || bio07 || bio08 || bio09 || bio10 || bio11 || bio12 || bio13 || bio14 || bio15 || bio16 || bio17 || bio18 || bio19 || elevacion || pendiente || topidx  ) as spids from sp_grid_terrestre 
			where gridid in ($<arg_gridids:raw>) 
), 
gridObj as ( 
	select sp_grid_terrestre.gridid, ( animalia || plantae || fungi || protoctista || prokaryotae || animalia_exoticas || plantae_exoticas || fungi_exoticas || protoctista_exoticas || prokaryotae_exoticas || bio01 || bio02 || bio03 || bio04 || bio05 || bio06 || bio07 || bio08 || bio09 || bio10 || bio11 || bio12 || bio13 || bio14 || bio15 || bio16 || bio17 || bio18 || bio19 || elevacion || pendiente || topidx  ) spids 
	from sp_grid_terrestre join ( select unnest( ARRAY[$<arg_gridids:raw>]) as gridid ) a2 on a2.gridid = sp_grid_terrestre.gridid 
	where   (animalia || plantae || fungi || protoctista || prokaryotae || animalia_exoticas || plantae_exoticas || fungi_exoticas || protoctista_exoticas || prokaryotae_exoticas || bio01 || bio02 || bio03 || bio04 || bio05 || bio06 || bio07 || bio08 || bio09 || bio10 || bio11 || bio12 || bio13 || bio14 || bio15 || bio16 || bio17 || bio18 || bio19 || elevacion || pendiente || topidx ) @> ARRAY[$<spid:value>] 
), 
gridObjSize as ( 
	select count(*) as ni_length from gridObj 
), 
getval_n_nj as ( 
	select 	first_rawdata.spid,  (first_rawdata.nj - sum(case when gridspddiscarded.gridid is NULL  then 0 else 1 end)) as dis_nj,  
			(first_rawdata.n - array_length(array[$<arg_gridids:raw>], 1)) as dis_n 
	from first_rawdata  left join gridspddiscarded on gridspddiscarded.spids @> ARRAY[first_rawdata.spid] 
	group by spid,  nj,  n  order by spid 
), 
getval_ni_nij as ( 
	select 	first_rawdata.spid,  (first_rawdata.nij - sum(case when gridObj.gridid is NULL  then 0 else 1 end)) as dis_nij, first_rawdata.ni - gridObjSize.ni_length as dis_ni 
	from first_rawdata  left join gridObj on gridObj.spids @> ARRAY[first_rawdata.spid], gridObjSize 
	group by spid, nij, ni, gridObjSize.ni_length 
	order by spid 
), 
-- queries similares desde este punto
rawdata as( 
	select 	getval_n_nj.spid,  
			dis_nij as nij, 
			dis_ni as ni, dis_nj as nj, 
			dis_n as n,
			case when dis_nij > dis_nj
			then 
				CASE WHEN dis_nj <> 0 then round(cast(get_epsilon(dis_nj::integer, dis_nj::integer, dis_ni::integer, dis_n::integer) as numeric),2) else 0 end
			when dis_nij > dis_ni
			then 
				CASE WHEN dis_nj <> 0 then round(cast(get_epsilon(dis_nj::integer, dis_ni::integer, dis_ni::integer, dis_n::integer) as numeric),2) else 0 end
			else
				CASE WHEN dis_nj <> 0 then round(cast(get_epsilon(dis_nj::integer, dis_nij::integer, dis_ni::integer, dis_n::integer) as numeric),2) else 0 end
			end 
			as epsilon,
			case when dis_nij > dis_nj
			then
				CASE WHEN dis_nj <> 0 then ln( get_score($<alpha>, dis_nj::integer, dis_nj::integer, dis_ni::integer, dis_n::integer) ) else 0 end
			when dis_nij > dis_ni
			then
				CASE WHEN dis_nj <> 0 then ln( get_score($<alpha>, dis_nj::integer, dis_ni::integer, dis_ni::integer, dis_n::integer) ) else 0 end
			else
				CASE WHEN dis_nj <> 0 then ln( get_score($<alpha>, dis_nj::integer, dis_nij::integer, dis_ni::integer, dis_n::integer) ) else 0 end
			end 
			as score
			--CASE WHEN dis_nj <> 0 then round(cast(get_epsilon(dis_nj::integer, dis_nij::integer, dis_ni::integer, dis_n::integer) as numeric),2) else 0 end as epsilon, 
			--CASE WHEN dis_nj <> 0 then ln( get_score($<alpha>, dis_nj::integer, dis_nij::integer, dis_ni::integer, dis_n::integer) ) else 0 end as score 
	from getval_n_nj  
	join getval_ni_nij 
	on getval_n_nj.spid = getval_ni_nij.spid  
	order by score  
), 
minmax_scores as ( 
	select min(score) as mineps, (max(score)) as maxeps from rawdata
), 
minmax_epsilon as ( 
	select min(epsilon) as mineps, (max(epsilon)) as maxeps from rawdata
), 
histogram_scores as ( 
	select mineps, maxeps, hist.bucket as bucket, hist.freq as freq 
	from ( 
		select CASE WHEN mineps-maxeps = 0 THEN 1 ELSE width_bucket(score, mineps, maxeps, 20) END as bucket, count(*) as freq 
		from minmax_scores, rawdata 
		group by bucket order by bucket 
	) as hist, minmax_scores
), 
histogram_epsilon as ( 
	select mineps, maxeps, hist.bucket as bucket, hist.freq as freq 
	from ( 
		select CASE WHEN mineps-maxeps = 0 THEN 1 ELSE width_bucket(epsilon, mineps, maxeps, 20) END as bucket, count(*) as freq 
		from minmax_epsilon, rawdata 
		group by bucket order by bucket 
	) as hist, minmax_epsilon
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
