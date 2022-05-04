WITH negativos as (
	SELECT * 
	FROM (

		SELECT a.gridid,
			   CASE 
			   	WHEN b.occ is null THEN 0
			   	ELSE b.occ
			   END AS occ
		FROM ( 
				SELECT DISTINCT gridid_${grid_resolution:raw}km AS gridid
				FROM grid_${grid_resolution:raw}km_aoi 
			) AS a
		LEFT JOIN (
			SELECT t0.gridid,
				   sum(t1.occ) as occ
			FROM (
				SELECT DISTINCT bar.gridid_${grid_resolution:raw}km AS gridid,
					   null as c
				FROM  grid_${grid_resolution:raw}km_aoi as bar
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
					  ((generovalido = 'COVID-19' AND especieepiteto = 'NEGATIVO')) and
					  make_date(a.aniocolecta, a.mescolecta, a.diacolecta) BETWEEN '${lim_inf_validation:raw}' and '${lim_sup_validation:raw}'
				GROUP BY a.gridid_${grid_resolution:raw}km, a.aniocolecta, a.mescolecta, a.diacolecta
			) as t1
			ON t0.gridid=t1.gridid::integer
			WHERE t1.c = 1
			GROUP BY t0.gridid 
			) AS b
		ON a.gridid=b.gridid::integer
	) as foo
	ORDER BY occ
), positivos as (
	SELECT * 
	FROM (

		SELECT a.gridid,
			   CASE 
			   	WHEN b.occ is null THEN 0
			   	ELSE b.occ
			   END AS occ
		FROM ( 
				SELECT DISTINCT gridid_${grid_resolution:raw}km AS gridid
				FROM grid_${grid_resolution:raw}km_aoi 
			) AS a
		LEFT JOIN (
			SELECT t0.gridid,
				   sum(t1.occ) as occ
			FROM (
				SELECT DISTINCT bar.gridid_${grid_resolution:raw}km AS gridid,
					   null as c
				FROM  grid_${grid_resolution:raw}km_aoi as bar
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
					  ((generovalido = 'COVID-19' AND especieepiteto = 'CONFIRMADO')) and
					  make_date(a.aniocolecta, a.mescolecta, a.diacolecta) BETWEEN '${lim_inf_validation:raw}' and '${lim_sup_validation:raw}'
				GROUP BY a.gridid_${grid_resolution:raw}km, a.aniocolecta, a.mescolecta, a.diacolecta
			) as t1
			ON t0.gridid=t1.gridid::integer
			WHERE t1.c = 1
			GROUP BY t0.gridid 
			) AS b
		ON a.gridid=b.gridid::integer
	) as foo
	ORDER BY occ
)
SELECT a.gridid,
	   CASE 
		WHEN a.occ + b.occ = 0 THEN 0
		ELSE a.occ::float / (a.occ + b.occ)::float 
	   END as occ
FROM positivos as a
LEFT JOIN negativos as b
ON a.gridid = b.gridid
ORDER BY occ, random()