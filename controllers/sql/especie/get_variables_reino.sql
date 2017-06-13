select distinct $<taxon> as name, count(*) spp 
from sp_snib 
where $<taxon> <> '' and especievalidabusqueda <> '' 
group by reinovalido order by $<taxon>