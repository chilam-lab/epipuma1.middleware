SELECT 
spid, 
array_agg(distinct ${res_celda_snib:raw}) as cells, 
icount(array_agg(distinct ${res_celda_snib:raw})) as ni
FROM snib
WHERE 
spid = ${spid} ${fosil:raw}
and 
	(case when ${caso} = 1 
		  then 
				fechacolecta <> ''
		  when ${caso} = 2 
		  then
				cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( ${lim_inf}  as integer)
				and 
				cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( ${lim_sup} as integer)
		  else
		  		(
					(
					cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( ${lim_inf}  as integer)
					and 
					cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( ${lim_sup}  as integer)
					)
					or fechacolecta = ''
				)
	end) = true
and especievalidabusqueda <> ''
and ${spid} is not null
group by spid;