SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				$<res_celda:raw> as gridid, 
				urlejemplar, 
				fechacolecta
FROM snib 
WHERE 	spid = $<spid> AND
		--spid = 31981 AND 
		especievalidabusqueda <> ''


