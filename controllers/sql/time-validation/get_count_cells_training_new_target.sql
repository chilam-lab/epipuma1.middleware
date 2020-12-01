SELECT * 
FROM (

	SELECT a.gridid,
		   CASE 
		   	WHEN b.occ is null THEN 0
		   	ELSE b.occ
		   END AS occ
	FROM ( 
			SELECT gridid_${grid_resolution:raw}km AS gridid
			FROM grid_${grid_resolution:raw}km_aoi 
			WHERE NOT gridid_${grid_resolution:raw}km = ANY(ARRAY[${first_cells:raw}]::integer[])
			GROUP BY gridid
			ORDER BY RANDOM()
		) AS a
	LEFT JOIN (
		SELECT t0.gridid,
			   sum(t1.occ) as occ
		FROM (
			SELECT DISTINCT bar.gridid_${grid_resolution:raw}km AS gridid,
				   foo.c AS c
			FROM (
				SELECT unnest(ARRAY[${first_cells:raw}]::text[]) as gridid, 1 as c
			) as foo
			RIGHT JOIN grid_${grid_resolution:raw}km_aoi as bar
			ON foo.gridid::integer = bar.gridid_${grid_resolution:raw}km::integer
			WHERE c is null
		) as t0
		LEFT JOIN (
			SELECT 	gridid_${grid_resolution:raw}km as gridid,
					a.aniocolecta, a.mescolecta, a.diacolecta,
					1 as c,
					sum(a.occ) as occ
			FROM snib_grid_${grid_resolution:raw}km AS a
			JOIN sp_snib as b
			ON a.spid = b.spid
			WHERE a.aniocolecta <> 9999 and 
				  a.mescolecta <> 99 and
				  a.diacolecta <> 99 and
				  a.diacolecta <> -1 and
				  ${where_target:raw} and
				  make_date(a.aniocolecta, a.mescolecta, a.diacolecta) BETWEEN '${lim_inf:raw}' and '${lim_sup:raw}'
			GROUP BY a.gridid_${grid_resolution:raw}km, a.aniocolecta, a.mescolecta, a.diacolecta
		) as t1
		ON t0.gridid=t1.gridid::integer
		WHERE t1.c = 1
		GROUP BY t0.gridid 
		) AS b
	ON a.gridid=b.gridid::integer
) as foo
ORDER BY occ, random()
