WITH aux_target AS (
	SELECT unnest(${training_cells_array:raw}) as cells
), target AS (
	SELECT '${target_name:raw}' as target_name,
	   cast( (array_agg(a.cells) - (${excluded_cells:raw}::integer[] + ${source_cells:raw}::integer[])) as integer[]) as cells,
	   array_length(array_agg(a.cells) - (${excluded_cells:raw}::integer[] + ${source_cells:raw}::integer[]),1) as ni
	FROM aux_target as a
),${groups:raw}
SELECT 	
		covars.group_name as group_name,
		-- target.target_name as target_name,
		covars.reinovalido, 
		covars.phylumdivisionvalido,
		covars.clasevalida,
		covars.ordenvalido,
        covars.familiavalida,
        covars.generovalido, 
        covars.especieepiteto,
        covars.nombreinfra,
		covars.type,
		covars.label,
		covars.layer,
        covars.bid,
        covars.icat,
        covars.tag,
        covars.description,
        covars.unidad,
       	covars.coeficiente,
		--covars.name as name,
		covars.cells  as cells,
		icount(target.cells & covars.cells) AS nij,
		covars.nj AS nj,
		target.ni AS ni,
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
--WHERE 
	  -- icount(covars.cells) >= 5
--icount(covars.cells) >= ${min_occ}
ORDER BY epsilon DESC;