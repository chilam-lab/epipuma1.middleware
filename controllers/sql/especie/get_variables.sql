SELECT DISTINCT 
		a.$<taxon:raw> as name,
		--phylumdivisionvalido as name,
		count(*) spp 
FROM sp_snib AS a
WHERE 
	a.$<taxon:raw> <> ''
	--a.phylumdivisionvalido <> ''
	AND a.$<parent_taxon:raw> = $<parent_valor>
	--and a.reinovalido = 'Animalia'
	AND a.especievalidabusqueda <> ''
	AND array_length( array_intersection( ARRAY(SELECT cells 
		FROM grid_geojson_64km_aoi
		WHERE footprint_region=$<region>)::integer[], a.cells_64km), 1) > 0 
--group by a.phylumdivisionvalido 
--order by a.phylumdivisionvalido
GROUP BY a.$<taxon:raw> 
ORDER BY a.$<taxon:raw>