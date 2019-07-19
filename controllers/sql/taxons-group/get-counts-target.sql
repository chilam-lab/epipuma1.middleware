WITH aux_target AS (
	SELECT DISTINCT b.${res_celda_snib} AS cell
	FROM snib AS b
	JOIN 
		(
			SELECT spid
			FROM sp_snib AS a
			${where_target:raw}
			--WHERE a.clasevalida = 'Reptilia'
			and a.especievalidabusqueda <> ''
			and a.spid is not null
			and array_length(a.${res_celda_sp:raw}, 1) > 0
			-- and array_length(a.cells_16km_1, 1) > 0)
		) AS c
	ON b.spid = c.spid
	${where_filter:raw}
)
SELECT '${target_name:raw}' as target_name,
	   array_agg(distinct a.cell) as cells,
	   array_length(array_agg(distinct a.cell),1) as ni
FROM aux_target as a