select a.gridid_munkm as gridid, a.population, case
						when c.c is null then 0
						else c.c
					   end as c
from (select distinct b.gridid_munkm, b.population from grid_munkm_aoi as b) as a 
left join (
	select gridid_munkm, count(*) as c 
	from snib 
	WHERE especievalidabusqueda = 'COVID-19 CONFIRMADO' and aniocolecta <> 9999 and 
	  mescolecta <> 99 and
	  diacolecta <> 99 and
	  diacolecta <> -1 and
	'${lim_inf:raw}' <= make_date(aniocolecta, mescolecta, diacolecta) and 
	make_date(aniocolecta, mescolecta, diacolecta) < '${lim_sup:raw}'
	group by gridid_munkm) as c 
on a.gridid_munkm = c.gridid_munkm::integer;