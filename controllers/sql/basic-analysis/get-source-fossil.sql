SELECT 
spid, 
array_agg(distinct ${res_celda_snib:raw}) as cells, 
icount(array_agg(distinct ${res_celda_snib:raw})) as ni
FROM snib
WHERE 
spid = ${spid} ${fosil:raw}
and especievalidabusqueda <> ''
and ${spid} is not null
group by spid;