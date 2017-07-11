SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				$<res_celda:raw> as gridid, 
				urlejemplar, 
				fechacolecta
FROM snib 
WHERE 	--spid = 33553 AND
		spid = $<spid> AND 
		especievalidabusqueda <> ''
		and 
		(
			cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf>  as integer)
			and 
			cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup>  as integer)
			or fechacolecta = ''
		)
		and $<res_celda:raw> is not null
		-- gridid_16km is not null
		$<sfosil:raw>
		--order by $<res_celda:raw> desc
		