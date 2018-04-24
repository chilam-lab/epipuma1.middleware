with temp_source as (
	SELECT 
		spid, 
		${res_celda_sp:raw} as cells, 
		icount(${res_celda_sp:raw}) as ni
		FROM sp_snib
		WHERE 
		spid = ${spid}
		and especievalidabusqueda <> ''
		and ${spid} is not null
),
temp_target as (
	SELECT  spid, 
			reinovalido, 
			phylumdivisionvalido, 
			clasevalida, 
			ordenvalido, 
			familiavalida, 
			generovalido, 
			especievalidabusqueda, 
			${res_celda_sp:raw} as cells, 
			icount(${res_celda_sp:raw}) as nj,
			0 as tipo
	FROM sp_snib ${whereVar:raw}
		and especievalidabusqueda <> ''
		and reinovalido <> ''
		and phylumdivisionvalido <> ''
		and clasevalida <> ''
		and ordenvalido <> ''
		and familiavalida <> ''
		and generovalido <> ''
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
		${N} as n,
		round( cast( 
			get_epsilon(
				${alpha},
				cast( temp_target.nj as integer), 
				cast( icount(temp_source.cells & temp_target.cells) as integer), 
				cast( temp_source.ni as integer), 
				cast( ${N} as integer)
			)as numeric), 2)  as epsilon,
		round( cast(  ln(   
			get_score(
				${alpha},
				cast( temp_target.nj as integer), 
				cast( icount(temp_source.cells & temp_target.cells) as integer), 
				cast( temp_source.ni as integer), 
				cast( ${N} as integer)
			)
		) as numeric), 2) as score
FROM temp_source,temp_target
where 
temp_target.spid <> ${spid}
and icount(temp_target.cells) >= ${min_occ}
order by epsilon desc;