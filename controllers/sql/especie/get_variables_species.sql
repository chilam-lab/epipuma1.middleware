SELECT DISTINCT 
		$<ad_param:raw> as name,
		description,
		--phylumdivisionvalido as name,
		count(*) spp 
FROM sp_snib
WHERE 
	$<taxon:raw> <> ''
	--phylumdivisionvalido <> ''
	AND $<parent_taxon:raw> = $<parent_valor>
	--and reinovalido = 'Animalia'
	-- AND especievalidabusqueda <> ''
	AND especieepiteto <> ''
	AND array_length(cells_64km_$<region:raw>, 1) > 0 
--group by phylumdivisionvalido 
--order by phylumdivisionvalido
GROUP BY $<order_param:raw> ,
		description

ORDER BY $<ad_param:raw>,
	description