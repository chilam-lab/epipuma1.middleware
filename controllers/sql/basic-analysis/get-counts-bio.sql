WITH temp_source as (
	SELECT 
		a.spid, 
--		a.cells_16km_1 as cells,
		(a.${res_celda_sp:raw}_${region:raw}-(${discardedDeleted:raw}::integer[]+${source_cells:raw}::integer[])) as cells,
--		array_length(a.cells_16km_1, 1) as ni 
		array_length((a.${res_celda_sp:raw}_${region:raw}-(${discardedDeleted:raw}::integer[]+${source_cells:raw}::integer[])), 1) as ni
	FROM sp_snib AS a
	WHERE 
		--a.spid = 27333
		a.spid = ${spid}
		and a.especievalidabusqueda <> ''
		and a.spid is not null
	GROUP BY a.spid,
--			a.cells_16km_1
			a.${res_celda_sp:raw}_${region:raw}
),
temp_target as (
	SELECT  
		a.spid, 
		a.reinovalido, 
		a.phylumdivisionvalido, 
		a.clasevalida, 
		a.ordenvalido, 
		a.familiavalida, 
		a.generovalido, 
		a.especievalidabusqueda, 
--			a.cells_16km_1 as cells,
		(a.${res_celda_sp:raw}_${region:raw} - ${total_cells:raw}::integer[]) as cells, 
--			array_length(a.cells_16km_1, 1) as ni
		array_length( (a.${res_celda_sp:raw}_${region:raw} - ${total_cells:raw}::integer[]) , 1) as nj,
		0 as tipo
	FROM sp_snib AS a
--	where a.clasevalida = 'Reptilia'
	${where_config:raw}
		and a.especievalidabusqueda <> ''
		and a.reinovalido <> ''
		and a.phylumdivisionvalido <> ''
		and a.clasevalida <> ''
		and a.ordenvalido <> ''
		and a.familiavalida <> ''
		and a.generovalido <> '' 
	GROUP BY a.spid,
		a.reinovalido, 
		a.phylumdivisionvalido, 
		a.clasevalida, 
		a.ordenvalido, 
		a.familiavalida, 
		a.generovalido, 
		a.especievalidabusqueda,
--		a.cells_16km_1,
		a.${res_celda_sp:raw}_${region:raw}
)
SELECT 	temp_target.spid,
		temp_target.tipo,
		temp_target.reinovalido,
		temp_target.phylumdivisionvalido,
		temp_target.clasevalida,
		temp_target.ordenvalido,
		temp_target.familiavalida,
		temp_target.generovalido,
		temp_target.especievalidabusqueda,
		temp_target.cells  as cells,
		icount(temp_source.cells & temp_target.cells) AS nij,
		temp_target.nj AS nj,
		temp_source.ni AS ni,
		${N} - icount( ${discardedDeleted:raw}::integer[] +  ${total_cells:raw}::integer[] + ${source_cells:raw}::integer[] ) as n,
		--9873 as n,
		round( cast( 
			get_epsilon(
				${alpha},
				--0.01,
				cast( temp_target.nj as integer),
				cast( icount(temp_source.cells & temp_target.cells) as integer),
				cast( temp_source.ni as integer),
				cast( ${N} - icount( ${discardedDeleted:raw}::integer[] +  ${total_cells:raw}::integer[] + ${source_cells:raw}::integer[] ) as integer)
				--cast( 9873 as integer)
			)as numeric), 2)  as epsilon,
		round( cast(  ln(   
			get_score(
				${alpha},
				--0.01,
				cast( temp_target.nj as integer),
				cast( icount(temp_source.cells & temp_target.cells) as integer),
				cast( temp_source.ni as integer),
				cast( ${N} - icount( ${discardedDeleted:raw}::integer[] +  ${total_cells:raw}::integer[] + ${source_cells:raw}::integer[] ) as integer)
				--cast( 9873 as integer)
			)
		) as numeric), 2) as score
FROM temp_source,temp_target
where 
temp_target.spid <> ${spid}
--temp_target.spid <> 27333
and icount(temp_target.cells) >= ${min_occ}
--and icount(temp_target.cells) >= 5
order by epsilon desc;