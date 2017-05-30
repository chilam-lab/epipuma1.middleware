SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				$<res_celda:raw> as gridid,
				urlejemplar, 
				fechacolecta
FROM snib 
WHERE 	spid = $<spid> and
		--spid = 33553 AND
		especievalidabusqueda <> ''
		and cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf:raw>  as integer)
		and 
		cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup:raw>  as integer)  
				