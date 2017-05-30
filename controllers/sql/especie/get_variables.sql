select 
	distinct 
		$<taxon:raw> as name,
		--phylumdivisionvalido as name,
		count(*) spp 
from sp_snib 
where 
	$<taxon:raw> <> ''
	--phylumdivisionvalido <> ''
	and $<parent_taxon:raw> = $<parent_valor>
	--and reinovalido = 'Animalia'
	and especievalidabusqueda <> '' 
--group by phylumdivisionvalido 
--order by phylumdivisionvalido
group by $<taxon:raw> 
order by $<taxon:raw>