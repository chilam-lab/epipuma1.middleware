with spid_occ as (
	select 
		-- icount(array_agg(distinct gridid_16km)) as occ
		icount(array_agg(distinct a.$<res_celda_snib:raw>)) as occ
	FROM snib AS a
	JOIN (
		SELECT UNNEST(gid) AS gid 
		--FROM grid_geojson_64km_aoi
		FROM ${res_celda_snib_tb:raw}
		--WHERE footprint_region=1 
		WHERE footprint_region=${region}
		) AS b
	ON a.gid = b.gid
	WHERE 	
		a.spid = $<spid> AND
		--snib.spid = 27333 and
		a.especievalidabusqueda <> '' and
		--gridid_16km is not null
		$<res_celda_snib:raw> is not null
		$<sfosil:raw> 
		--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)
	GROUP BY a.spid
)
SELECT DISTINCT st_asgeojson(a.the_geom) as json_geom, 
				--gridid_16km as gridid,
				a.$<res_celda_snib:raw> as gridid,
				a.urlejemplar, 
				--fechacolecta,
				a.aniocolecta,
				(SELECT occ FROM spid_occ) as occ
FROM snib AS a
JOIN (
	SELECT UNNEST(gid) AS gid 
	--FROM grid_geojson_64km_aoi
	FROM ${res_celda_snib_tb:raw}
	--WHERE footprint_region=1 
	WHERE footprint_region=${region}
	) AS b
ON a.gid = b.gid
WHERE 	
	--snib.spid = 27333 and
	a.spid = $<spid> AND
	a.especievalidabusqueda <> '' and
	--gridid_16km is not null
	$<res_celda_snib:raw> is not null
	$<sfosil:raw> 
	--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)