with spid_occ as (
	select 
		--icount(array_agg(distinct gridid_16km)) as occ
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
			$<res_celda_snib:raw> is not null
			--gridid_16km is not null
			$<sfosil:raw> 
			--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)
	group by spid
)
SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				$<res_celda:raw> as gridid,
				--gridid_16km as gridid,
				urlejemplar,
				--fechacolecta,
				aniocolecta,
				spid_occ.occ as occ
FROM snib 
join aoi
on snib.gid = aoi.gid,
spid_occ
WHERE 	
		--aoi.fgid = 19 and
		aoi.fgid = $<id_country:raw> and
		--snib.spid = 27333 and
		snib.spid = $<spid> AND
		snib.especievalidabusqueda <> '' and
		$<res_celda_snib:raw> is not null and
		--gridid_16km is not null and
		aniocolecta is not null and aniocolecta <> 9999
		$<sfosil:raw> 
		--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)