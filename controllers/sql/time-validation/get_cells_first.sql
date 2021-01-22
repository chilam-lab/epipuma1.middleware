SELECT ARRAY(
	SELECT gridid
	FROM (
		SELECT DISTINCT bar.gridid_${grid_resolution:raw}km as gridid,
						foo.c as c
		FROM (
			SELECT 	gridid_${grid_resolution:raw}km as gridid,
					1 as c
			FROM snib_grid_${grid_resolution:raw}km AS a
			JOIN sp_snib as b
			ON a.spid = b.spid
			WHERE a.aniocolecta <> 9999 and 
				  a.mescolecta <> 99 and
				  a.diacolecta <> 99 and
				  a.diacolecta <> -1 and
				  ${where_target:raw} and
				  '${lim_inf_first:raw}' <= make_date(a.aniocolecta, a.mescolecta, a.diacolecta) and 
				  make_date(a.aniocolecta, a.mescolecta, a.diacolecta) < '${lim_sup_first:raw}'
			GROUP BY a.gridid_${grid_resolution:raw}km, a.aniocolecta, a.mescolecta, a.diacolecta
			ORDER BY RANDOM()
		) AS foo
		RIGHT JOIN grid_${grid_resolution:raw}km_aoi as bar
		ON foo.gridid::integer = bar.gridid_${grid_resolution:raw}km::integer
	) as a
	WHERE ${first_config:raw}
	ORDER BY RANDOM()
)::integer[] AS first_cells