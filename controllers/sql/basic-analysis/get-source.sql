SELECT 
spid, 
array_agg(distinct ${res_celda_sp:raw}) as cells, 
icount(array_agg(distinct ${res_celda_sp:raw})) as ni
FROM sp_snib
WHERE 
spid = ${spid}
and especievalidabusqueda <> ''
and ${spid} is not null
group by spid;