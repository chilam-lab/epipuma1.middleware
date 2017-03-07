SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				gridid, 
				urlejemplar, 
				fechacolecta,
				case when ( 
					(EXTRACT(EPOCH FROM to_timestamp(fechacolecta, 'YYYY-MM-DD')) * 1000) < (EXTRACT(EPOCH FROM to_timestamp( $<lim_inf:raw> || '-01-01', 'YYYY-MM-DD')) * 1000) 
					 or  
					(EXTRACT(EPOCH FROM to_timestamp(fechacolecta, 'YYYY-MM-DD')) * 1000) > (EXTRACT(EPOCH FROM to_timestamp( $<lim_sup:raw> || '-01-01', 'YYYY-MM-DD')) * 1000)  
				) 
				then 1 
				else 0 
				end as discarded 
FROM snib 
WHERE 	spid = $<spid> AND 
		especievalidabusqueda <> ''