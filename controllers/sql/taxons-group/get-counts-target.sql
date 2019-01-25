WITH aux_target AS (
	SELECT a.${res_celda_sp:raw} as cells,
		   --a.cells_16km_1
		   array_length(a.${res_celda_sp:raw}, 1) as ni
	FROM sp_snib AS a
		${where_target:raw}
		--WHERE a.clasevalida = 'Reptilia'
		and a.especievalidabusqueda <> ''
		and a.spid is not null
		and array_length(a.${res_celda_sp:raw}, 1) > 0
		-- and array_length(a.cells_16km_1, 1) > 0
	GROUP BY 
			a.especievalidabusqueda,
			-- a.cells_16km_1
			a.${res_celda_sp:raw}
)
SELECT '${target_name:raw}' as target_name,
	   array_agg(distinct a.cell) as cells,
	   array_length(array_agg(distinct a.cell),1) as ni
FROM (
		select unnest(cells) as cell
		FROM aux_target
	) as a