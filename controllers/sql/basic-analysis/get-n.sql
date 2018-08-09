--SELECT icount(cells) as n
--FROM grid_geojson_${grid_resolution:raw}km_aoi
--where footprint_region = ${footprint_region:raw}
with available_countries as(
	SELECT country, fgid, array_agg(gid) as gids
	FROM aoi
	group by fgid, country
)
select fgid as id_country, icount(cells) as n
from available_countries
join grid_geojson_${grid_resolution:raw}km_aoi
on available_countries.gids @> grid_geojson_${grid_resolution:raw}km_aoi.gid
where footprint_region = ${footprint_region:raw}
order by fgid
