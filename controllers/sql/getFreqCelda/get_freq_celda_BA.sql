with rawdata as ( 
	select 
		cal.spid, 
		sum(cal.Nij) as nij, 
		cal.nj, 
		cel.occ as ni, 
		--6473 as n,
		$<N> as n,
		CASE WHEN cal.Nj <> 0 then ln( get_score($<alpha>, cal.Nj::integer, sum(cal.Nij)::integer, cel.occ::integer, $<N>::integer) ) else 0 end as score 
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