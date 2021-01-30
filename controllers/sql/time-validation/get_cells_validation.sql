SELECT * 
FROM (
	SELECT DISTINCT t0.gridid,
		   not (t1.c is null) as pre
	FROM (
		SELECT DISTINCT bar.gridid_${grid_resolution:raw}km AS gridid,
			   foo.c
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
				  '${lim_inf:raw}' <= make_date(a.aniocolecta, a.mescolecta, a.diacolecta) and
				  make_date(a.aniocolecta, a.mescolecta, a.diacolecta) < '${lim_sup:raw}'
			GROUP BY a.gridid_${grid_resolution:raw}km, a.aniocolecta, a.mescolecta, a.diacolecta
			ORDER BY RANDOM()
		) as foo
		RIGHT JOIN grid_${grid_resolution:raw}km_aoi as bar
		ON foo.gridid::integer = bar.gridid_${grid_resolution:raw}km::integer
		WHERE ${training_period_condition:raw}
	) as t0
	LEFT JOIN (
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
			  make_date(a.aniocolecta, a.mescolecta, a.diacolecta) BETWEEN '${lim_inf_validation:raw}' and '${lim_sup_validation:raw}'
		GROUP BY a.gridid_${grid_resolution:raw}km, a.aniocolecta, a.mescolecta, a.diacolecta
		ORDER BY RANDOM()
	) as t1
	ON t0.gridid=t1.gridid::integer
) as foo
ORDER BY RANDOM()