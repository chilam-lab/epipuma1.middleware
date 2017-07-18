SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				$<res_celda:raw> as gridid,
				-- gridid_16km as gridid,
				urlejemplar,
				fechacolecta,
				aniocolecta
FROM snib 
WHERE 	
		spid = $<spid> AND
		-- spid = 28923 AND
		especievalidabusqueda <> ''
		-- and aniocolecta is not null
		and fechacolecta <> ''
		and $<res_celda:raw> is not null
		-- and gridid_16km is not null
		$<sfosil:raw>