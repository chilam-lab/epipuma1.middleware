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
gridspddiscarded as ( 
	select 	snib.spid, count(distinct snib.gridid) as num_gridids, 
			array_agg(distinct snib.gridid) as arg_discarded 
	from snib 
	join first_rawdata 
	on snib.spid = first_rawdata.spid
	-- $<filter_dates:raw>
	where (snib.especievalida = '' or snib.especievalida is null)  or ((EXTRACT(EPOCH FROM to_timestamp(fechacolecta, 'YYYY-MM--DD')) * 1000) < 631173600000 or (EXTRACT(EPOCH FROM to_timestamp(fechacolecta, 'YYYY-MM--DD')) * 1000) > 1577858400000 )  and (fechacolecta <> '' and fechacolecta is not null) 
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
		select unnest( 
					ARRAY[$<arg_gridids:raw>]
					--ARRAY[ 4544,  4708,  4712,  5039,  5057,  5228,  6815,  7147,  7173,  7516,  8596,  8918,  8927,  9106,  9113,  9451,  9480,  9650,  9673,  9777,  9781,  9813,  9816,  9839,  9842,  10016,  10348,  10525,  10526,  10539,  10701,  10702,  10703,  10715,  10833,  10879,  11252,  11412,  11430,  11607,  11717,  11759,  11784,  11964,  11966,  12073,  12286,  12445,  12463,  12669,  12780,  12978,  13483,  13652,  13660,  13728,  13834,  14079,  14225,  14260,  14363,  14438,  14541,  14773,  14906,  14937,  14961,  15068,  15072,  15082,  15246,  15311,  15426,  15437,  15488,  15623,  15788,  15817,  15818,  15977,  16140,  16316,  16349,  16476,  16832,  16836,  17011,  17227,  17359,  17360,  17364,  17540,  17717,  17720,  17890,  18437,  18440,  18595,  18776,  19482 ]
				) as gridid 
	) a2 
	on a2.gridid = sp_grid_terrestre.gridid 
	where   (animalia || plantae || fungi || protoctista || prokaryotae || animalia_exoticas || plantae_exoticas || fungi_exoticas 
			|| protoctista_exoticas || prokaryotae_exoticas || bio01 || bio02 || bio03 || bio04 || bio05 || bio06 || bio07 
			|| bio08 || bio09 || bio10 || bio11 || bio12 || bio13 || bio14 || bio15 || bio16 || bio17 || bio18 || bio19 || elevacion 
			|| pendiente || topidx ) @> 
			ARRAY[$<spid:value>]
			--ARRAY[49405]
), 
gridObjSize as ( 
	select count(*) as ni_length from gridObj 
),
getval_n_nj as ( 
	select 	
			first_rawdata.spid,
			first_rawdata.nj,
			case when COALESCE(num_gridids,0) > first_rawdata.nj then 0 else (first_rawdata.nj - COALESCE(num_gridids,0)) end as dis_nj, 
			first_rawdata.n as dis_n 
	from first_rawdata  
	left join gridspddiscarded  
	on gridspddiscarded.spid = first_rawdata.spid 
	group by 
			first_rawdata.spid,
			nj,  n, num_gridids 
	order by spid
	-- order by nj desc, dis_nj desc
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
			--ARRAY[ 4544,  4708,  4712,  5039,  5057,  5228,  6815,  7147,  7173,  7516,  8596,  8918,  8927,  9106,  9113,  9451,  9480,  9650,  9673,  9777,  9781,  9813,  9816,  9839,  9842,  10016,  10348,  10525,  10526,  10539,  10701,  10702,  10703,  10715,  10833,  10879,  11252,  11412,  11430,  11607,  11717,  11759,  11784,  11964,  11966,  12073,  12286,  12445,  12463,  12669,  12780,  12978,  13483,  13652,  13660,  13728,  13834,  14079,  14225,  14260,  14363,  14438,  14541,  14773,  14906,  14937,  14961,  15068,  15072,  15082,  15246,  15311,  15426,  15437,  15488,  15623,  15788,  15817,  15818,  15977,  16140,  16316,  16349,  16476,  16832,  16836,  17011,  17227,  17359,  17360,  17364,  17540,  17717,  17720,  17890,  18437,  18440,  18595,  18776,  19482 ]
		) as gridids 
	) as a 
	on a.gridids @> array[b.gridid]  
	group by spid 
	order by spid 
), 
getval_ni_nij as ( 
	select 	
		first_rawdata.spid,   
			case when first_rawdata.nij - COALESCE(nij_discarded,0) > 0 then first_rawdata.nij - COALESCE(nij_discarded,0) else 0 end as dis_nij, 
			first_rawdata.ni - gridObjSize.ni_length as dis_ni 
	from first_rawdata  
	left join gridspddiscarded_nij 
	on gridspddiscarded_nij.spid = first_rawdata.spid, gridObjSize 
	order by spid 
),


rawdata as( 
	select 	getval_n_nj.spid,  
			dis_nij as nij, 
			dis_ni as ni, 
			dis_nj as nj, 
			dis_n as n,
			/*case when dis_nij > dis_nj
			then 
				CASE WHEN dis_nj <> 0 then round(cast(get_epsilon(dis_nj::integer, dis_nj::integer, dis_ni::integer, dis_n::integer) as numeric),2) else 0 end
			when dis_nij > dis_ni
			then 
				CASE WHEN dis_nj <> 0 then round(cast(get_epsilon(dis_nj::integer, dis_ni::integer, dis_ni::integer, dis_n::integer) as numeric),2) else 0 end
			else
				CASE WHEN dis_nj <> 0 then round(cast(get_epsilon(dis_nj::integer, dis_nij::integer, dis_ni::integer, dis_n::integer) as numeric),2) else 0 end
			end 
			as epsilon,*/
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
	-- where abs(get_epsilon(dis_nj::integer, dis_nij::integer, dis_ni::integer, dis_n::integer)) > 0 
	order by score
	--order by nij desc, nj desc
), 

/*
 * 
 * -- VERIFICAR LA VALIDACION DE EPSILON !!!
rawdata as ( 
	select 
		cal.spid, 
		sum(cal.Nij) as nij, 
		cal.nj, 
		cel.occ as ni, 
		--6473 as n,
		$<N> as n,
		
		case when dis_nij > dis_nj
		then
			CASE WHEN dis_nj <> 0 then ln( get_score($<alpha>, dis_nj::integer, dis_nj::integer, dis_ni::integer, dis_n::integer) ) else 0 end
		when dis_nij > dis_ni
		then
			CASE WHEN dis_nj <> 0 then ln( get_score($<alpha>, dis_nj::integer, dis_ni::integer, dis_ni::integer, dis_n::integer) ) else 0 end
		else
			CASE WHEN dis_nj <> 0 then ln( get_score($<alpha>, dis_nj::integer, dis_nij::integer, dis_ni::integer, dis_n::integer) ) else 0 end
		end as score 
		
		--CASE WHEN cal.Nj <> 0 then ln( get_score($<alpha>, cal.Nj::integer, sum(cal.Nij)::integer, cel.occ::integer, $<N>::integer) ) else 0 end as score
		
		
	from sp_occ as cel, ( 
		select 	w2.spid as spid, 
					w2.Nij as Nij, 
					w2.Nj as Nj 
			from sp_snib 
			INNER JOIN ( 
				select b.spids as spid, COALESCE(a.counts,0) as Nij,b.occ as Nj 
				from ( 
					select  cast(sum(counts) as integer) as counts, spids, occ 
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
			--where sp_snib.spid <> $<spid> and clasevalida = 'Mammalia' and epitetovalido <> ''    
			order by spid
			) as cal 
			where 	cel.spid =  $<spid>  and 
					abs(get_epsilon(cal.nj::integer, nij::integer, cel.occ::integer, $<N>::integer)) > 0 
			group by 	cal.spid,  cal.nj, cel.occ, n
), 
*/

gsptierra as ( 
	select * from sp_grid_terrestre 
), 
prenorm as ( 
	select gsptierra.gridid, 
		   COALESCE(prgeom.tscore + prgeom.ln_sum,0) as tscore 
		   from ( 
		   	select 	gsp.gridid as gridid, sum(rawdata.score) as tscore, 
		   			ln( rawdata.ni / ( rawdata.n - rawdata.ni::numeric)) as ln_sum 
		   	from ( 
		   		select 
		   			unnest( animalia||plantae||fungi||protoctista||prokaryotae|| bio01||bio02||bio03||bio04||bio05|| bio06||bio07||bio08||bio09||bio10|| bio11||bio12||bio13||bio14||bio15|| bio16||bio17||bio18||bio19 ) as spid, gridid from gsptierra ) as gsp 
		   		INNER JOIN rawdata 
		   		ON rawdata.spid = gsp.spid 
		   		GROUP BY gridid , rawdata.ni, rawdata.n 
		   	) as prgeom 
		   	FULL JOIN gsptierra 
		   	ON prgeom.gridid = gsptierra.gridid 
), 
minmax as ( 
	select 	min(tscore) as mineps, 
			(max(tscore)+0.1) as maxeps from prenorm
),
histogram as ( 
	select 	mineps, 
			maxeps, 
			hist.bucket as bucket, 
			hist.freq as freq 
	from ( 
		select 	CASE WHEN mineps-maxeps = 0 THEN 1 ELSE width_bucket(tscore, mineps, maxeps, 20) END as bucket, 
				count(*) as freq 
		from minmax, 
			 prenorm 
		group by bucket 
		order by bucket 
	) as hist, minmax 
) 
select 	b1.bucket, 
		b1.freq, 
		round(cast(mineps + ((maxeps - mineps)/20) * (b1.bucket-1) as numeric), 2) as min, 
		round(cast(mineps + ((maxeps - mineps)/20) * (b1.bucket) as numeric), 2) as max 
from ( 
	select 
		a2.bucket as bucket,COALESCE(a1.freq,0) as freq 
	from ( 
		select bucket,freq from histogram 
	) as a1 
	RIGHT JOIN ( 
		select 
			a.n as bucket 
		from generate_series(1, 20) as a(n) 
	) as a2 
	ON a1.bucket = a2.bucket
) as b1, minmax