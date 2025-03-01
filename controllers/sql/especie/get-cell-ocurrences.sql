WITH spids_species AS (
	SELECT spid, reinovalido, phylumdivisionvalido
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
	SELECT cast(a.$<gridid:raw> as text) AS gridid, "$<col_name:raw>" as entidad
	FROM $<grid_table:raw> AS a 
	WHERE ST_Intersects(a.the_geom, ST_SetSRID(ST_Point($<longitud:raw>, $<latitud:raw>), 4326))
)
SELECT a.especievalidabusqueda AS species,
	   cast( make_date(aniocolecta,mescolecta,diacolecta) as text) as fechacolecta,
	   a.$<gridid:raw> AS gridid,
	   entidad,
	   a.reinovalido as edad,
	   a.phylumdivisionvalido as genero,
	   count(*) as num_casos
FROM snib AS a 
JOIN spids_species AS b
ON a.spid = b.spid
JOIN grid_ids AS d
ON d.gridid = a.$<gridid:raw>
WHERE 	a.$<gridid:raw> is not null
		$<where_filter:raw> 
		-- AND a.the_geom is not null 
		-- AND a.urlejemplar is not null
GROUP BY species, a.reinovalido, a.phylumdivisionvalido, fechacolecta, aniocolecta, mescolecta, diacolecta, a.gridid_munkm, entidad
order by make_date(aniocolecta, mescolecta, diacolecta) desc
