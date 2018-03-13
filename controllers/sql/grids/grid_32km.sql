SELECT json_build_object(
  'type', 'FeatureCollection',
  'crs',  json_build_object(
    'type', 'name',
    'properties', json_build_object(
      'name', 'urn:ogc:def:crs:EPSG::4326')),
    'features', json_agg(
      json_build_object(
        'type', 'Feature',
    		'geometry', ST_AsGeoJSON(small_geom)::json,
    		'properties', json_build_object(
    		  'gridid', gridid_32km
    		)
    	)
    )
  ) as json
FROM grid_32km_aoi
LEFT JOIN america
ON ST_Intersects(grid_32km_aoi.small_geom, america.geom)
WHERE america.country = 'MEXICO';
-- SELECT 
--     json_agg(
--       json_build_object(
--         'type', 'Feature',
--         'geometry', ST_AsGeoJSON(small_geom)::json,
--         'properties', json_build_object(
--           'gridid', gridid_32km
--         )
--       )
--     )
-- AS json
-- FROM grid_32km_aoi
-- LEFT JOIN america
-- ON ST_Intersects(grid_32km_aoi.small_geom, america.geom)
-- WHERE america.country = 'MEXICO';