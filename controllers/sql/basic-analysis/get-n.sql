SELECT icount(cells) as n
FROM grid_geojson_${grid_resolution:raw}km_aoi
where footprint_region = ${footprint_region:raw}