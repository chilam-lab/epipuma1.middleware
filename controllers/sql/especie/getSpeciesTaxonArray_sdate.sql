with spid_occ as (
	SELECT 
		--icount(array_agg(distinct gridid_16km)) as occ
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
		$<taxones:raw> AND
		--snib.spid = 27333 and
		a.reinovalido <> '' and
		a.phylumdivisionvalido <> '' and
		a.clasevalida <> '' and
		a.ordenvalido <> '' and
		a.familiavalida <> '' and
		a.generovalido <> '' and
		a.especievalidabusqueda <> '' and
		-- a.especieepiteto <> '' and
		a.aniocolecta is not null and aniocolecta <> 9999 and
		--gridid_16km is not null
		$<res_celda_snib:raw> is not null
		$<sfosil:raw> 
		--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)
	--GROUP BY a.spid
	GROUP BY true
	-- a.spid
)
SELECT DISTINCT st_asgeojson(a.the_geom) as json_geom, 
				a.$<res_celda:raw> as gridid,
				--gridid_16km as gridid,
				a.urlejemplar,
				a.aniocolecta,
				(SELECT sum(occ) FROM spid_occ) as occ
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
		$<taxones:raw> AND
		a.reinovalido <> '' and
		a.phylumdivisionvalido <> '' and
		a.clasevalida <> '' and
		a.ordenvalido <> '' and
		a.familiavalida <> '' and
		a.generovalido <> '' and
		a.especievalidabusqueda <> '' and
		-- a.especieepiteto <> '' and
		a.aniocolecta is not null and aniocolecta <> 9999 and
		--gridid_16km is not null
		$<res_celda_snib:raw> is not null
		$<sfosil:raw> 
		--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)
		
		