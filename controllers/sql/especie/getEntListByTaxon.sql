-- TODO: Se puede agregar los filtros como el verbo getSpecies
select 	
		$<columnas:raw>,
		(generovalido || ' ' || especieepiteto || ' ' || nombreinfra) as especievalidabusqueda,
		icount($<res_celda_sp:raw>) as occ
from sp_snib
where   
		lower(generovalido) like lower($<genero>||'%')
		$<epiteto:raw>
		$<infra:raw>
		-- no importa que resolución sea, importa la región donde se esta buscando
		--and array_length(cells_64km_$<region:raw>,1) > 0
		and cells_64km_$<region:raw> <> array[]::integer[]
$<limite:raw>
-- limit 15