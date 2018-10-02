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
	AND array_length(a.cells_64km_$<region:raw>, 1) > 0 
--group by a.phylumdivisionvalido 
--order by a.phylumdivisionvalido
GROUP BY a.$<taxon:raw> 
ORDER BY a.$<taxon:raw>