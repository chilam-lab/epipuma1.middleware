SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				$<res_celda:raw> as gridid, 
				urlejemplar, 
				fechacolecta
FROM snib 
WHERE 	spid = $<spid> AND 
		especievalidabusqueda <> ''
		and fechacolecta <> ''
		and $<res_celda:raw> is not null
		-- gridid_16km is not null
		$<sfosil:raw>