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
SELECT array(
			SELECT DISTINCT a.$<gridid:raw>
			FROM $<snib_grid_xxkm:raw> AS a 
			JOIN spids_species AS b
			ON a.spid = b.spid
			JOIN gids_countries AS c
			ON a.gid = c.gid
			WHERE 	a.$<gridid:raw> is not null
					$<where_filter:raw> 
		)::integer[]