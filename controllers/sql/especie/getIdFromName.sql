select array_agg(especievalidabusqueda) as species_found, array_agg(spid) as ids
from sp_snib
where  especievalidabusqueda in ($<species_list:raw>)
group by true