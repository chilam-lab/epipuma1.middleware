WITH spids_species AS (
	SELECT spid 
	FROM sp_snib 
	$<species_filter:raw>
	AND spid is not null
), 
gids_countries AS (
	SELECT UNNEST(gid) AS gid 
	FROM $<resolution_view:raw>
	WHERE footprint_region=$<region:raw>
),
grid_ids AS(
	SELECT a.$<gridid:raw> AS gridid
	FROM $<grid_table:raw> AS a 
	WHERE ST_Intersects(a.the_geom, ST_SetSRID(ST_Point($<longitud:raw>, $<latitud:raw>), 4326))
)
SELECT a.especievalidabusqueda AS species,
	   -- ST_AsGeoJSON(a.the_geom) AS the_geom,
	   a.urlejemplar,
	   a.aniocolecta,
	   a.$<gridid:raw> AS gridid
FROM snib AS a 
JOIN spids_species AS b
ON a.spid = b.spid
JOIN gids_countries AS c
ON a.gid = c.gid
JOIN grid_ids AS d
ON d.gridid = a.$<gridid:raw>
WHERE 	a.$<gridid:raw> is not null
		$<where_filter:raw> 
		-- AND a.the_geom is not null 
		AND a.urlejemplar is not null
