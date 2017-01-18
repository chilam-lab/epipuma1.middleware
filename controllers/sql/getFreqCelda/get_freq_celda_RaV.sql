with first_rawdata as( 
	select 	cal.spid,
			sum(cal.Nij) as nij,
			cal.nj, 
			cel.occ as Ni,
			$<N> as n 
			--6473 as n    
	from sp_occ as cel, ( 
	
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
	--where cel.spid =  49405
	 where cel.spid =  $<spid>
	group by 
		cal.spid, 
		cal.nj,  
		cel.occ,  
		n
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
rawdata as( 
	select 	getval_n_nj.spid,  
			dis_nij as nij, 
			dis_ni as ni, 
			dis_nj as nj, 
			dis_n as n,
			case when dis_nij > dis_nj
			then
				CASE WHEN dis_nj <> 0 then ln( get_score($<alpha>, dis_nj::integer, dis_nj::integer, dis_ni::integer, dis_n::integer) ) else 0 end
			when dis_nij > dis_ni
			then
				CASE WHEN dis_nj <> 0 then ln( get_score($<alpha>, dis_nj::integer, dis_ni::integer, dis_ni::integer, dis_n::integer) ) else 0 end
			else
				CASE WHEN dis_nj <> 0 then ln( get_score($<alpha>, dis_nj::integer, dis_nij::integer, dis_ni::integer, dis_n::integer) ) else 0 end
			end as score 
	from getval_n_nj  
	join getval_ni_nij 
	on getval_n_nj.spid = getval_ni_nij.spid  
	order by score
	--order by nij desc, nj desc
), 
gsptierra as ( 
	select * from sp_grid_terrestre 
), 
prenorm as ( 
	select gsptierra.gridid, COALESCE(prgeom.tscore,0) as tscore 
	from ( 
		select 
			gsp.gridid as gridid, sum(rawdata.score) as tscore 
		from ( 
			select 
				unnest( animalia||plantae||fungi||protoctista||prokaryotae|| bio01||bio02||bio03||bio04||bio05|| bio06||bio07||bio08||bio09||bio10|| bio11||bio12||bio13||bio14||bio15|| bio16||bio17||bio18||bio19 ) as spid, gridid 
			from gsptierra 
		) as gsp INNER JOIN rawdata ON rawdata.spid = gsp.spid GROUP BY gridid ) as prgeom FULL JOIN gsptierra ON prgeom.gridid = gsptierra.gridid 
), 
minmax as ( 
	select min(tscore) as mineps, (max(tscore)+0.1) as maxeps from prenorm
),
histogram as ( 
	select mineps, maxeps, hist.bucket as bucket, hist.freq as freq 
	from ( select 	CASE WHEN mineps-maxeps = 0 THEN 1 ELSE width_bucket(tscore, mineps, maxeps, 20) END as bucket, count(*) as freq from minmax, prenorm group by bucket order by bucket ) as hist, minmax 
) 
select 	b1.bucket, 
		b1.freq, 
		round(cast(mineps + ((maxeps - mineps)/20) * (b1.bucket-1) as numeric), 2) as min, 
		round(cast(mineps + ((maxeps - mineps)/20) * (b1.bucket) as numeric), 2) as max 
from ( 
	select 
		a2.bucket as bucket,COALESCE(a1.freq,0) as freq 
	from ( 
		select bucket,freq 
		from histogram 
	) as a1 
	RIGHT JOIN ( 
		select a.n as bucket from generate_series(1, 20) as a(n) 
	) as a2 
	ON a1.bucket = a2.bucket
) as b1, 
minmax
	