WITH t1 AS (
	SELECT DISTINCT footprint_region, country, fgid 
	FROM (	SELECT a.footprint_region, b.country, b.fgid 
			FROM grid_geojson_64km_aoi AS a 
			JOIN aoi AS b 
			ON b.gid = ANY(a.gid)) AS t0 
			ORDER BY footprint_region
),
regions AS (
	SELECT footprint_region
	FROM grid_geojson_64km_aoi
)
SELECT DISTINCT t1.footprint_region, 
				(SELECT string_agg(t1.country::varchar, '; ') AS country FROM t1 WHERE t1.footprint_region = r.footprint_region),
				(SELECT t1.fgid FROM t1 WHERE t1.footprint_region = r.footprint_region LIMIT 1 )
FROM regions AS r
JOIN t1
ON t1.footprint_region = r.footprint_region;