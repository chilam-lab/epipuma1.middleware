SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				$<res_celda_snib:raw> as gridid,
				--gridid_16km as gridid, 
				urlejemplar, 
				fechacolecta,
				--icount(sp_snib.cells_32km) as occ
				icount($<res_celda_sp:raw>) as occ
				-- ejemplarfosil
FROM snib 
join sp_snib
on snib.spid = sp_snib.spid
WHERE 	
		snib.spid = $<spid> AND
		--snib.spid = 27332 AND 
		snib.especievalidabusqueda <> '' and
		$<res_celda_snib:raw> is not null
		--gridid_16km is not null
		$<sfosil:raw> 
		--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)


-- SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
-- 				gridid_16km as gridid,
-- 				urlejemplar,
-- 				fechacolecta,
-- 				aniocolecta,
-- 				0 as occ
-- 				--icount(sp_snib.cells_16km) as occ
-- FROM snib 
-- join sp_snib
-- on snib.spid = sp_snib.spid
-- join america
-- on st_intersects(america.geom, snib.the_geom) 
-- WHERE 	
-- 	snib.spid = 27333 
-- 	and snib.especievalidabusqueda <> ''
-- 	and fechacolecta <> ''
-- 	and gridid_16km is not null
-- 	and america.country = 'MEXICO'
