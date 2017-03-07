SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				gridid, 
				urlejemplar, 
				fechacolecta,
				case when fechacolecta <> '' then
					0
				else
					1
				end as discarded
FROM snib 
WHERE 	spid = $<spid> AND 
		especievalidabusqueda <> ''