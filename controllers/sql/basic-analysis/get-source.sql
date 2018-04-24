-- source para tabla: sp_snib
SELECT 
spid, 
${res_celda_sp:raw} as cells, 
icount(${res_celda_sp:raw}) as ni
FROM sp_snib
WHERE 
spid = ${spid}
and especievalidabusqueda <> ''
and ${spid} is not null

/*
-- source para tabla: snib
SELECT 
	spid, 
	array_agg(distinct ${res_celda_snib:raw}) as cells, 
	icount(array_agg(distinct ${res_celda_snib:raw})) as ni
FROM snib
WHERE 
	spid = ${spid} ${fosil:raw}
	and especievalidabusqueda <> ''
	and ${spid} is not null
group by spid
*/