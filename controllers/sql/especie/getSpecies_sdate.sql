SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				$<res_celda:raw> as gridid,
				-- gridid_16km as gridid,
				urlejemplar,
				fechacolecta,
				aniocolecta,
				--icount(sp_snib.cells_32km) as occ
				icount($<res_celda_sp:raw>) as occ
FROM snib 
join sp_snib
on snib.spid = sp_snib.spid
WHERE 	
		snib.spid = $<spid> AND
		-- spid = 28923 AND
		snib.especievalidabusqueda <> ''
		-- and aniocolecta is not null
		and fechacolecta <> ''
		and $<res_celda:raw> is not null
		-- and gridid_16km is not null
		$<sfosil:raw>