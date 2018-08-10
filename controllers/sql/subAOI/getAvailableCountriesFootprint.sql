with available_countries as(
	SELECT country, fgid, array_agg(gid) as gids
	FROM aoi
	where country in ('MEXICO', 'COLOMBIA', 'UNITED STATES, THE')
	group by fgid, country
)
select available_countries.country, fgid, grid_geojson_16km_aoi.footprint_region
from available_countries
join grid_geojson_16km_aoi
on available_countries.gids @> grid_geojson_16km_aoi.gid
order by fgid
