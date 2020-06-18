SELECT b.${res_celda_snib:raw} AS cell,
	   make_timestamp(b.aniocolecta, b.mescolecta, b.diacolecta, 0, 0, 0) AS t
FROM snib AS b
JOIN 
	(
		SELECT spid
		FROM sp_snib AS a
		${where_target:raw}
		and a.especievalidabusqueda <> ''
		and a.spid is not null
		and array_length(a.${res_celda_sp:raw}, 1) > 0
	) AS c
ON b.spid = c.spid
${where_filter:raw}
GROUP BY b.${res_celda_snib:raw}, make_timestamp(b.aniocolecta, b.mescolecta, b.diacolecta, 0, 0, 0)
ORDER BY b.${res_celda_snib:raw}, make_timestamp(b.aniocolecta, b.mescolecta, b.diacolecta, 0, 0, 0) 