WITH aux_target AS (
	SELECT a.${res_celda_sp:raw} as cells
		   --a.cells_16km_1 as cells
	FROM sp_snib AS a
	${where_target:raw}
		--WHERE a.clasevalida = 'Reptilia'
		and a.especievalidabusqueda <> ''
		and a.spid is not null
		and array_length(a.${res_celda_sp:raw}, 1) > 0
		-- and array_length(a.cells_16km_1, 1) > 0
), target AS (
	SELECT '${target_name:raw}' as target_name,
		   array_agg(distinct a.cell) as cells,
		   array_length(array_agg(distinct a.cell),1) as ni
	FROM (
			select unnest(cells) as cell
			FROM aux_target
		) as a
),${groups:raw}
SELECT 	target.target_name as target_name,
		covars.group_name as group_name,
		covars.cells  as cells,
		icount(target.cells & covars.cells) AS nij,
		covars.nj AS nj,
		target.ni AS ni,
		covars.tipo,
		${N} as n,
		--9873 as n,
		round( cast( 
			get_epsilon(
				${alpha},
				--0.01,
				cast( covars.nj as integer),
				cast( icount(target.cells & covars.cells) as integer),
				cast( target.ni as integer),
				cast( ${N} as integer)
				--cast( 9873 as integer)
			)as numeric), 2)  as epsilon,
		round( cast(  ln(   
			get_score(
				${alpha},
				--0.01,
				cast( covars.nj as integer),
				cast( icount(target.cells & covars.cells) as integer),
				cast( target.ni as integer),
				cast( ${N} as integer)
				--cast( 9873 as integer)
			)
		) as numeric), 2) as score
FROM target,covars
WHERE icount(covars.cells) >= 5
	  --icount(covars.cells) >= ${min_occ}
ORDER BY epsilon DESC;