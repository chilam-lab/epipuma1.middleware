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
fechas_result as (
	SELECT a.aniocolecta, sum(a.occ) AS occ, 0 as isfosil
	FROM $<snib_grid_xxkm:raw> AS a 
	JOIN spids_species AS b
	ON a.spid = b.spid
	JOIN gids_countries AS c
	ON a.gid = c.gid
	WHERE 	a.$<gridid:raw> is not null
			$<where_filter:raw> 
	GROUP BY a.aniocolecta
),
fosil_result as (
	SELECT a.aniocolecta, sum(a.occ) AS occ, 1 as isfosil
	FROM $<snib_grid_xxkm:raw> AS a 
	JOIN spids_species AS b
	ON a.spid = b.spid
	JOIN gids_countries AS c
	ON a.gid = c.gid
	WHERE 	a.$<gridid:raw> is not null
			$<where_filter_fosil:raw> 
			AND (ejemplarfosil = 'SI')
	GROUP BY a.aniocolecta
)
SELECT aniocolecta, occ, isfosil
from fechas_result
union
select aniocolecta, occ, isfosil
from fosil_result
where aniocolecta = 9999
order by aniocolecta
