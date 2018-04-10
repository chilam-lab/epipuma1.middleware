SELECT DISTINCT st_asgeojson(the_geom) as json_geom, 
				$<res_celda_snib:raw> as gridid, 
				urlejemplar,
				fechacolecta,
				--icount(sp_snib.cells_32km) as occ
				icount($<res_celda_sp:raw>) as occ
FROM snib 
join sp_snib
on snib.spid = sp_snib.spid
WHERE 	--spid = 33553 AND
		snib.spid = $<spid> AND 
		snib.especievalidabusqueda <> ''
		and 
		(
			cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( $<lim_inf>  as integer)
			and 
			cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( $<lim_sup>  as integer)
			or fechacolecta = ''
		)
		and $<res_celda_snib:raw> is not null
		-- gridid_16km is not null
		$<sfosil:raw>
		--order by $<res_celda:raw> desc
		