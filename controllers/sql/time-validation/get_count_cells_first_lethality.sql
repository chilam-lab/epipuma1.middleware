WITH positivos as (
	SELECT *
	FROM (
		SELECT a.gridid,
			   CASE 
			   	WHEN b.occ is null THEN 0
			   	ELSE b.occ
			   END AS occ
		FROM
			( 
				SELECT DISTINCT gridid_${grid_resolution:raw}km AS gridid
				FROM grid_${grid_resolution:raw}km_aoi 
			) AS a
		LEFT JOIN (
			SELECT 	gridid_${grid_resolution:raw}km as gridid, 
			sum(a.occ::integer) AS occ
			FROM snib_grid_${grid_resolution:raw}km AS a
			JOIN sp_snib as b
			ON a.spid = b.spid
			WHERE a.aniocolecta <> 9999 and 
				  a.mescolecta <> 99 and
				  a.diacolecta <> 99 and
				  a.diacolecta <> -1 and
				  ((generovalido = 'COVID-19' AND especieepiteto = 'CONFIRMADO')) and 
				  '${lim_inf_first:raw}' <= make_date(a.aniocolecta, a.mescolecta, a.diacolecta) and 
			  	  make_date(a.aniocolecta, a.mescolecta, a.diacolecta) < '${lim_sup_first:raw}'
			GROUP BY a.gridid_${grid_resolution:raw}km
		) AS b
		ON a.gridid=b.gridid::integer
	) AS foo
	ORDER BY occ
), fallecidos as (
	SELECT *
	FROM (
		SELECT a.gridid,
			   CASE 
			   	WHEN b.occ is null THEN 0
			   	ELSE b.occ
			   END AS occ
		FROM
			( 
				SELECT DISTINCT gridid_${grid_resolution:raw}km AS gridid
				FROM grid_${grid_resolution:raw}km_aoi 
			) AS a
		LEFT JOIN (
			SELECT 	gridid_${grid_resolution:raw}km as gridid, 
			sum(a.occ::integer) AS occ
			FROM snib_grid_${grid_resolution:raw}km AS a
			JOIN sp_snib as b
			ON a.spid = b.spid
			WHERE a.aniocolecta <> 9999 and 
				  a.mescolecta <> 99 and
				  a.diacolecta <> 99 and
				  a.diacolecta <> -1 and
				  ((generovalido = 'COVID-19' AND especieepiteto = 'FALLECIDO')) and 
				  make_date(a.aniocolecta, a.mescolecta, a.diacolecta) < '${lim_inf:raw}'
			GROUP BY a.gridid_${grid_resolution:raw}km
		) AS b
		ON a.gridid=b.gridid::integer
	) AS foo
	ORDER BY occ
) 
SELECT a.gridid,
	   CASE 
		WHEN b.occ = 0 THEN 0
		ELSE a.occ::float / (b.occ)::float 
	   END as occ
FROM fallecidos as a
LEFT JOIN positivos as b
ON a.gridid = b.gridid
ORDER BY occ, random()