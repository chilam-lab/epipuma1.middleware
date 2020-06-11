SELECT DISTINCT a.$<taxon> AS name, count(*) AS spp 
FROM sp_snib AS a
WHERE a.$<taxon> <> '' 
	AND a.especievalidabusqueda <> ''
	AND  array_length( array_intersection(ARRAY(SELECT cells 
		FROM grid_geojson_$<grid_res:raw>km_aoi
		WHERE footprint_region=$<region>)::integer[], a.cells_$<grid_res:raw>km), 1) > 0
GROUP BY a.reinovalido, a.$<taxon>