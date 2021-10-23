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
first_period AS (
	SELECT DISTINCT a.$<gridid:raw> AS gridid, 1 fp
	FROM $<snib_grid_xxkm:raw> AS a 
	JOIN spids_species AS b
	ON a.spid = b.spid
	WHERE $<where_filter_first:raw>
)
SELECT distinct a.$<gridid:raw> AS gridid, sum(a.occ) AS occ
FROM $<snib_grid_xxkm:raw> AS a 
JOIN spids_species AS b
ON a.spid = b.spid
JOIN gids_countries AS c
ON a.gid = c.gid
LEFT JOIN first_period AS d
ON a.$<gridid:raw> = d.gridid
WHERE 	
		--d.fp is null AND 
		a.$<gridid:raw> is not null
		$<where_filter:raw> 
GROUP BY a.$<gridid:raw>
