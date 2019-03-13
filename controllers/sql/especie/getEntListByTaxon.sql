-- TODO: Se puede agregar los filtros como el verbo getSpecies
select 	
		(generovalido || ' ' || especieepiteto || ' ' || nombreinfra) as especie
		-- icount($<res_celda_sp:raw>) as occ
from sp_snib
where   
		lower(generovalido) like lower($<genero>||'%')
		$<epiteto:raw>
		$<nombreinfra:raw>
$<limite:raw>
-- limit 15