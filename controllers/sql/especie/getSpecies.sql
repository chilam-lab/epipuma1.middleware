SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				$<res_celda:raw> as gridid,
				--gridid_16km as gridid, 
				urlejemplar, 
				fechacolecta
				-- ejemplarfosil
FROM snib 
WHERE 	
		spid = $<spid> AND
		-- spid = 28923 AND 
		especievalidabusqueda <> '' and
		$<res_celda:raw> is not null
		-- gridid_16km is not null
		$<sfosil:raw> 
		-- and (ejemplarfosil <> 'SI' or ejemplarfosil is null)


