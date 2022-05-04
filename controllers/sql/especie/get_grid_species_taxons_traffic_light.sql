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
)
SELECT DISTINCT a.$<gridid:raw> AS gridid, 'f' as p, sum(a.occ) AS occ
FROM $<snib_grid_xxkm:raw> AS a 
JOIN spids_species AS b
ON a.spid = b.spid
WHERE a.$<gridid:raw> is not null and
	$<where_filter_first:raw> 
GROUP BY a.$<gridid:raw>
UNION ALL
SELECT distinct a.$<gridid:raw> AS gridid, 't' as p, sum(a.occ) AS occ
FROM $<snib_grid_xxkm:raw> AS a 
JOIN spids_species AS b
ON a.spid = b.spid
WHERE a.$<gridid:raw> is not null
		$<where_filter:raw> 
GROUP BY a.$<gridid:raw>