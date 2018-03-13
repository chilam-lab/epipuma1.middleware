SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				$<res_celda:raw> as gridid,
				urlejemplar, 
				fechacolecta,
				--icount(sp_snib.cells_32km) as occ
				icount($<res_celda_sp:raw>) as occ
FROM snib 
join sp_snib
on snib.spid = sp_snib.spid
WHERE 	snib.spid = $<spid> and
		--spid = 33553 AND
		snib.especievalidabusqueda <> ''
		and $<res_celda:raw> is not null
		-- gridid_16km is not null
		$<sfosil:raw>
		and cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf:raw>  as integer)
		and 
		cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup:raw>  as integer)  
				