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


