SELECT 
	ARRAY(
		SELECT 	gridid_${grid_resolution:raw}km as gridid
		FROM snib_grid_${grid_resolution:raw}km AS a
		JOIN sp_snib as b
		ON a.spid = b.spid
		WHERE a.aniocolecta <> 9999 and 
			  a.mescolecta <> 99 and
			  a.diacolecta <> 99 and
			  a.diacolecta <> -1 and
			  ${where_target:raw} and
			  '${lim_inf:raw}' <= make_date(a.aniocolecta, a.mescolecta, a.diacolecta) and 
			   make_date(a.aniocolecta, a.mescolecta, a.diacolecta) <= '${lim_sup:raw}'
		GROUP BY a.gridid_${grid_resolution:raw}km
		ORDER BY RANDOM()
)::integer[] as training_cells