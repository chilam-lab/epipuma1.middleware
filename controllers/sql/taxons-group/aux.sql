WITH temp_target as (
	SELECT a.${res_celda_sp:raw} as cells,
		   --a.cells_16km_1
		   array_length(a.${res_celda_sp:raw}, 1) as ni
	FROM sp_snib AS a
		${whereclause_source:raw}
		--WHERE a.clasevalida = 'Reptilia'
		and a.especievalidabusqueda <> ''
		and a.spid is not null
		and array_length(a.${res_celda_sp:raw}, 1) > 0
		-- and array_length(a.cells_16km_1, 1) > 0
	GROUP BY 
			a.especievalidabusqueda,
			-- a.cells_16km_1
			a.${res_celda_sp:raw}
),
temp_covars as (
	SELECT  
		a.spid, 
		a.reinovalido, 
		a.phylumdivisionvalido, 
		a.clasevalida, 
		a.ordenvalido, 
		a.familiavalida, 
		a.generovalido, 
		a.especievalidabusqueda, 
		a.${res_celda_sp:raw} as cells,
		-- a.cells_16km_1 as cells, 
		array_length(a.${res_celda_sp:raw}, 1) as nj,
		-- array_length(a.cells_16km_1, 1) as nj,
		0 as tipo
	FROM sp_snib AS a
		${where_covars:raw}
		--WHERE a.clasevalida = 'Mammalia'
		and a.especievalidabusqueda <> ''
		and a.reinovalido <> ''
		and a.phylumdivisionvalido <> ''
		and a.clasevalida <> ''
		and a.ordenvalido <> ''
		and a.familiavalida <> ''
		and a.generovalido <> ''
		and array_length(a.${res_celda_sp:raw}, 1) > 0 
		-- and array_length(a.cells_16km_1, 1) > 0
	GROUP BY a.spid,
		a.reinovalido, 
		a.phylumdivisionvalido, 
		a.clasevalida, 
		a.ordenvalido, 
		a.familiavalida, 
		a.generovalido, 
		a.especievalidabusqueda,
		a.${res_celda_sp:raw}
		--a.cells_16km_1
)
SELECT 	temp_covars.spid,
		temp_covars.tipo,
		temp_covars.reinovalido,
		temp_covars.phylumdivisionvalido,
		temp_covars.clasevalida,
		temp_covars.ordenvalido,
		temp_covars.familiavalida,
		temp_covars.generovalido,
		temp_covars.especievalidabusqueda,
		temp_covars.cells  as cells,
		icount(temp_target.cells & temp_covars.cells) AS nij,
		temp_covars.nj AS nj,
		temp_target.ni AS ni,
		${N} as n,
		--9873 as n,
		round( cast( 
			get_epsilon(
				${alpha},
				--0.01,
				cast( temp_covars.nj as integer),
				cast( icount(temp_target.cells & temp_covars.cells) as integer),
				cast( temp_target.ni as integer),
				cast( ${N} as integer)
				--cast( 9873 as integer)
			)as numeric), 2)  as epsilon,
		round( cast(  ln(   
			get_score(
				${alpha},
				--0.01,
				cast( temp_covars.nj as integer),
				cast( icount(temp_target.cells & temp_covars.cells) as integer),
				cast( temp_target.ni as integer),
				cast( ${N} as integer)
				--cast( 9873 as integer)
			)
		) as numeric), 2) as score
FROM temp_target,temp_covars
WHERE icount(temp_covars.cells) >= 5
	  --icount(temp_covars.cells) >= ${min_occ}
ORDER BY epsilon DESC;