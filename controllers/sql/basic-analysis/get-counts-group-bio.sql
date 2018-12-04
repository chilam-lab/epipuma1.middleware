WITH pre_temp_source as (
	SELECT 
		-- a.spid, 
		-- a.reinovalido, 
		-- a.phylumdivisionvalido, 
		-- a.clasevalida, 
		-- a.ordenvalido, 
		-- a.familiavalida, 
		-- a.generovalido, 
		-- a.especievalidabusqueda, 
		--a.cells_16km_1 as cells
		a.${res_celda_sp:raw}_${region:raw} as cells
	FROM sp_snib AS a
	--WHERE a.clasevalida = 'Reptilia'
		${whereclause_source:raw}
		and a.especievalidabusqueda <> ''
		and a.spid is not null
		and array_length(a.${res_celda_sp:raw}_${region:raw},1) > 0
		-- and array_length(a.cells_16km_1, 1) > 0
	GROUP BY 
			a.especievalidabusqueda,
			-- a.cells_16km_1
			a.${res_celda_sp:raw}_${region:raw}
),
temp_source as (
	select array_agg(distinct a.cell) as cells,
	'${name_source:raw}' as name_gpo_source,
	array_length(array_agg(distinct a.cell),1) as ni
	from (
		select unnest(cells) as cell
		FROM pre_temp_source
	) as a
	GROUP BY true
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
		-- a.cells_16km_1 as cells,
		a.${res_celda_sp:raw}_${region:raw} as cells, 
		-- array_length(a.cells_16km_1, 1) as nj,
		array_length(a.${res_celda_sp:raw}_${region:raw}, 1) as nj,
		0 as tipo
	FROM sp_snib AS a
	--WHERE a.clasevalida = 'Mammalia'
	${whereclause_target:raw}
		and a.especievalidabusqueda <> ''
		and a.reinovalido <> ''
		and a.phylumdivisionvalido <> ''
		and a.clasevalida <> ''
		and a.ordenvalido <> ''
		and a.familiavalida <> ''
		and a.generovalido <> ''
		and array_length(a.${res_celda_sp:raw}_${region:raw},1) > 0 
		-- and array_length(a.cells_16km_1, 1) > 0
	GROUP BY a.spid,
		a.reinovalido, 
		a.phylumdivisionvalido, 
		a.clasevalida, 
		a.ordenvalido, 
		a.familiavalida, 
		a.generovalido, 
		a.especievalidabusqueda,
		a.cells_16km_1
--		a.${res_celda_sp:raw}_${region:raw}
)
SELECT 	temp_source.name_gpo_source,
		temp_target.spid,
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
		--${N} as n,
		9873 as n,
		round( cast( 
			get_epsilon(
				--${alpha},
				0.01,
				cast( temp_target.nj as integer),
				cast( icount(temp_source.cells & temp_target.cells) as integer),
				cast( temp_source.ni as integer),
				--cast( ${N} as integer)
				cast( 9873 as integer)
			)as numeric), 2)  as epsilon,
		round( cast(  ln(   
			get_score(
				--${alpha},
				0.01,
				cast( temp_target.nj as integer),
				cast( icount(temp_source.cells & temp_target.cells) as integer),
				cast( temp_source.ni as integer),
				--cast( ${N} as integer)
				cast( 9873 as integer)
			)
		) as numeric), 2) as score
FROM temp_source,temp_target
where 
--icount(temp_target.cells) >= ${min_occ}
icount(temp_target.cells) >= 5
order by epsilon desc;