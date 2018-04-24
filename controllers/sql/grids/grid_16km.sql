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
    		  'gridid', gridid_16km
    		)
    	)
    )
  ) AS json
FROM grid_16km_aoi
LEFT JOIN america
-- ON ST_Intersects(america.geom, grid_16km_aoi.small_geom)
ON ST_Intersects(grid_16km_aoi.small_geom,america.geom)
WHERE america.country = 'MEXICO' or america.country = 'UNITED STATES, THE'
