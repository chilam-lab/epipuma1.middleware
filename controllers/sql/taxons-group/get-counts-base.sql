WITH aux_target AS (
	--SELECT DISTINCT b.${res_celda_snib:raw}_${region:raw} AS cell
	SELECT DISTINCT b.${res_celda_sp:raw} AS cells
	FROM sp_snib AS b
	${where_target:raw}
	--JOIN 
	--	(
	--		SELECT spid
	--		FROM sp_snib AS a
	--		${where_target:raw}
	--		--WHERE a.clasevalida = 'Reptilia'
	--		and a.especievalidabusqueda <> ''
	--		and a.spid is not null
	--		and array_length(a.${res_celda_sp:raw}, 1) > 0
	--		-- and array_length(a.cells_16km_1, 1) > 0)
	--	) AS c
	--ON b.spid = c.spid
	--${where_filter:raw}
), target AS (
	SELECT '${target_name:raw}' as target_name,
	   (a.cells - (${excluded_cells:raw}::integer[] + ${source_cells:raw}::integer[])) as cells,
	   array_length(a.cells - (${excluded_cells:raw}::integer[] + ${source_cells:raw}::integer[]),1) as ni
	FROM aux_target as a
),${groups:raw}
SELECT 	target.target_name as target_name,
		covars.name as name,
		covars.cells  as cells,
		icount(target.cells & covars.cells) AS nij,
		target.ni AS ni,
		covars.nj AS nj,
		covars.tipo,
		${N} - icount( ${excluded_cells:raw} ::integer[] +  ${total_cells:raw} ::integer[] + ${source_cells:raw}::integer[] ) as n,
		--9873 as n,
		round( cast( 
			get_epsilon(
				${alpha},
				--0.01,
				cast( covars.nj as integer),
				cast( icount(target.cells & covars.cells) as integer),
				cast( target.ni as integer),
				cast( ${N} - icount( ${excluded_cells:raw} ::integer[] +  ${total_cells:raw} ::integer[] + ${source_cells:raw}::integer[] ) as integer)
				--cast( 9873 as integer)
			)as numeric), 2)  as epsilon,
		round( cast(  ln(   
			get_score(
				${alpha},
				--0.01,
				cast( covars.nj as integer),
				cast( icount(target.cells & covars.cells) as integer),
				cast( target.ni as integer),
				cast( ${N} - icount( ${excluded_cells:raw} ::integer[] +  ${total_cells:raw} ::integer[] + ${source_cells:raw}::integer[] ) as integer)
				--cast( 9873 as integer)
			)
		) as numeric), 2) as score
FROM target,covars
WHERE icount(covars.cells) >= 5
	  --icount(covars.cells) >= ${min_occ}
ORDER BY epsilon DESC;