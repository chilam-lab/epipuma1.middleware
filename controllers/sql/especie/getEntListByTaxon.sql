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
$<limite:raw>
-- limit 15