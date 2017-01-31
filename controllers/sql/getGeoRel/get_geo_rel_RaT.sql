with first_rawdata as( 
		select 	cal.spid,cal.reinovalido,cal.phylumdivisionvalido,cal.clasevalida,ordenvalido,cal.familiavalida,cal.generovalido,epitetovalido, 
				cal.label, 
				sum(cal.Nij) as nij,
				cal.nj, 
				cel.occ as Ni, 
				$<N> as n 
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
		where cel.spid = $<spid>
		group by 
			cal.spid, cal.reinovalido, cal.phylumdivisionvalido, cal.clasevalida,ordenvalido, cal.familiavalida, 
			cal.generovalido,epitetovalido,  cal.label,  cal.nj,  cel.occ,  n
), 
gridspddiscarded as ( 
	select 	snib.spid, count(distinct snib.gridid) as num_gridids, 
			array_agg(distinct snib.gridid) as arg_discarded 
	from snib 
	join first_rawdata on snib.spid = first_rawdata.spid
	$<filter_dates:raw>
	
	group by snib.spid 
), 
gridObj as ( 
	select sp_grid_terrestre.gridid, 
			( animalia || plantae || fungi || protoctista || prokaryotae || animalia_exoticas || plantae_exoticas 
				|| fungi_exoticas || protoctista_exoticas || prokaryotae_exoticas || bio01 || bio02 || bio03 || bio04 
				|| bio05 || bio06 || bio07 || bio08 || bio09 || bio10 || bio11 || bio12 || bio13 || bio14 || bio15 
				|| bio16 || bio17 || bio18 || bio19 || elevacion || pendiente || topidx  
			) spids 
	from sp_grid_terrestre 
	join ( 
		select unnest( ARRAY[$<arg_gridids:raw>]
				) as gridid 
	) a2 
	on a2.gridid = sp_grid_terrestre.gridid 
	where   (animalia || plantae || fungi || protoctista || prokaryotae || animalia_exoticas || plantae_exoticas || fungi_exoticas 
			|| protoctista_exoticas || prokaryotae_exoticas || bio01 || bio02 || bio03 || bio04 || bio05 || bio06 || bio07 
			|| bio08 || bio09 || bio10 || bio11 || bio12 || bio13 || bio14 || bio15 || bio16 || bio17 || bio18 || bio19 || elevacion 
			|| pendiente || topidx ) @> ARRAY[$<spid:value>] 
), 
gridObjSize as ( 
	select count(*) as ni_length from gridObj 
), 
getval_n_nj as ( 
	select 	first_rawdata.reinovalido, first_rawdata.phylumdivisionvalido, first_rawdata.clasevalida, first_rawdata.ordenvalido, 
			first_rawdata.familiavalida, first_rawdata.generovalido, first_rawdata.epitetovalido, first_rawdata.spid,  
			first_rawdata.label,  
			case when COALESCE(num_gridids,0) > first_rawdata.nj then 0 else (first_rawdata.nj - COALESCE(num_gridids,0)) end as dis_nj, 
			first_rawdata.n as dis_n 
	from first_rawdata  
	left join gridspddiscarded  
	on gridspddiscarded.spid = first_rawdata.spid 
	group by first_rawdata.reinovalido, first_rawdata.phylumdivisionvalido, first_rawdata.clasevalida, first_rawdata.ordenvalido, 
			first_rawdata.familiavalida, first_rawdata.generovalido, first_rawdata.epitetovalido, first_rawdata.spid,  
			first_rawdata.label,  nj,  n, num_gridids 
	order by spid 
), 
gridspddiscarded_nij as ( 
	select spid  , count(gridid) as nij_discarded  
	from ( 
		select spid, 
				unnest(  gridspddiscarded.arg_discarded ) as gridid  
		from  gridspddiscarded  
	) as b 
	join ( 
		select (  
			ARRAY[$<arg_gridids:raw>] 
		) as gridids 
	) as a 
	on a.gridids @> array[b.gridid]  
	group by spid 
	order by spid 
), 
getval_ni_nij as ( 
	select 	first_rawdata.reinovalido, first_rawdata.phylumdivisionvalido, first_rawdata.clasevalida, first_rawdata.ordenvalido, first_rawdata.familiavalida, 
			first_rawdata.generovalido, first_rawdata.epitetovalido, first_rawdata.spid,  first_rawdata.label,  
			case when first_rawdata.nij - COALESCE(nij_discarded,0) >= 0 then first_rawdata.nij - COALESCE(nij_discarded,0) else 0 end as dis_nij, 
			first_rawdata.ni - gridObjSize.ni_length as dis_ni 
	from first_rawdata  
	left join gridspddiscarded_nij 
	on gridspddiscarded_nij.spid = first_rawdata.spid, gridObjSize 
	order by spid 
) 
select getval_n_nj.reinovalido, getval_n_nj.phylumdivisionvalido, getval_n_nj.clasevalida, getval_n_nj.ordenvalido, 
		getval_n_nj.familiavalida, getval_n_nj.generovalido, getval_n_nj.epitetovalido, getval_n_nj.spid,  
		case when dis_nj - dis_nij >= 0 then dis_nij else dis_nj end as nij, 
		dis_ni as ni, dis_nj as nj, dis_n as n, 
		case when dis_nj - dis_nij >= 0 then  CASE WHEN dis_nj <> 0  then round(cast(get_epsilon(dis_nj::integer, dis_nij::integer, dis_ni::integer, dis_n::integer) as numeric),2)  else 0  end else CASE WHEN dis_nj <> 0  then round(cast(get_epsilon(dis_nj::integer, dis_nj::integer, dis_ni::integer, dis_n::integer) as numeric),2)  else 0 end end as epsilon, 
		case when dis_nj - dis_nij >= 0 then  CASE WHEN dis_nj <> 0  then round(cast(ln(get_score(0.01, dis_nj::integer, dis_nij::integer, dis_ni::integer, dis_n::integer)) as numeric),2)  else 0  end else CASE WHEN dis_nj <> 0  then round(cast(ln(get_score(0.01, dis_nj::integer, dis_nj::integer, dis_ni::integer, dis_n::integer)) as numeric),2)  else 0  end end as score 
from getval_n_nj  
join getval_ni_nij 
on getval_n_nj.spid = getval_ni_nij.spid  
order by epsilon
	
	
