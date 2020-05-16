SELECT DISTINCT ${columns:raw}
        gridid_${grid_resolution:raw}km
FROM grid_${grid_resolution:raw}km_aoi
${where_filter:raw}