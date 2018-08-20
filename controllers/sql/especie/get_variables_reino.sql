SELECT DISTINCT a.$<taxon> AS name, count(*) AS spp 
FROM sp_snib AS a
WHERE a.$<taxon> <> '' 
	AND a.especievalidabusqueda <> ''
	AND  array_length( array_intersection(ARRAY(SELECT cells 
		FROM grid_geojson_64km_aoi
		WHERE footprint_region=$<region>)::integer[], a.cells_64km), 1) > 0
GROUP BY a.reinovalido, a.$<taxon>