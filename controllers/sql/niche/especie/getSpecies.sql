SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				gridid, 
				urlejemplar, 
				fechacolecta,
				0 as discarded
FROM snib 
WHERE 	spid = $<spid> AND 
		especievalidabusqueda <> ''


