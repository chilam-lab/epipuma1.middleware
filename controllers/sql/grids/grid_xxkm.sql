SELECT
	json::json
FROM
	grid_geojson_$<grid_res>km_aoi
WHERE
	footprint_region=$<region>