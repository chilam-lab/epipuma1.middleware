SELECT
	json::json
FROM
	grid_geojson_$<grid_res:raw>km_aoi
	--grid_geojson_16km_aoi
WHERE
	footprint_region=$<region:raw>