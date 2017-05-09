with first_rawdata as( 
	select 	cal.spid,
			sum(cal.Nij) as nij,
			cal.nj, 
			cel.occ as Ni,
			$<N> as n 
			--6473 as n    
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
) , 
apriori as (
	select ln( ni / ( n - ni::numeric) ) as val from rawdata limit 1
) 
select gsptierra.gridid, prgeom.tscore as tscore 
from ( 
	select gsp.gridid as gridid, sum(rawdata_scores.score) as tscore 
	from ( 
		select unnest( 
			animalia||plantae||fungi||protoctista||prokaryotae|| animalia_exoticas || plantae_exoticas || fungi_exoticas || protoctista_exoticas || prokaryotae_exoticas || bio01||bio02||bio03||bio04||bio05||bio06||bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19 ||elevacion || pendiente || topidx 
		) as spid, gridid 
		from gsptierra 
	) as gsp 
	RIGHT JOIN ( 
		select *  from rawdata where score is not null 
	) as rawdata_scores 
	ON rawdata_scores.spid = gsp.spid 
	GROUP BY gridid 
) as prgeom 
right JOIN gsptierra 
ON prgeom.gridid = gsptierra.gridid  
where prgeom.tscore is not null  
order by tscore desc
	