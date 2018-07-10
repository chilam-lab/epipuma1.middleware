with arg_gids as (
	select array_agg(gid) as arg_ids 
	FROM aoi
	--where fgid = 28 
	where fgid = $<id_country:raw>
	group by fgid
)
SELECT
	json::json
	--footprint_region, gids
FROM
	--grid_geojson_16km_aoi, arg_gids
	grid_geojson_$<grid_res>km_aoi, arg_gids
WHERE
	gids @> arg_ids
	-- se descarta opcion de MX y US al mismo tiempo
	and footprint_region <> 3
	-- footprint_region=$<id_country>