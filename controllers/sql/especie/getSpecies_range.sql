with spid_occ as (
	select 
		-- icount(array_agg(distinct gridid_16km)) as occ
		icount(array_agg(distinct $<res_celda_snib:raw>)) as occ
	FROM snib 
	join aoi
	on snib.gid = aoi.gid
	WHERE 	
			--aoi.fgid = 19 and
			aoi.fgid = $<id_country:raw> and
			--snib.spid = 27333 and
			snib.spid = $<spid> AND
			snib.especievalidabusqueda <> '' and
			--gridid_16km is not null
			$<res_celda_snib:raw> is not null
			$<sfosil:raw> 
			--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)
			and 
			(
				(
					aniocolecta >= cast($<lim_inf:raw>  as integer) 
					and 
					aniocolecta <= cast( $<lim_sup:raw>  as integer)
				) 
				or aniocolecta = 9999
			)
	group by spid
)
SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				$<res_celda_snib:raw> as gridid, 
				urlejemplar,
				-- fechacolecta,
				aniocolecta,
				spid_occ.occ as occ
FROM snib 
join aoi
on snib.gid = aoi.gid,
spid_occ
where
	--aoi.fgid = 19 and
	aoi.fgid = $<id_country:raw> and
	--snib.spid = 27333 and
	snib.spid = $<spid> AND
	snib.especievalidabusqueda <> '' and
	--gridid_16km is not null
	$<res_celda_snib:raw> is not null
	$<sfosil:raw> 
	--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)
	and 
	(
		(
			aniocolecta>= cast( $<lim_inf:raw>  as integer) 
			and 
			aniocolecta<= cast( $<lim_sup:raw>  as integer)
		) 
		or aniocolecta = 9999 
	)
		