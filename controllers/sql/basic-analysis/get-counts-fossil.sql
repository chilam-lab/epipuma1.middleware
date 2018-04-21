with temp_source as (
	SELECT 
		spid, 
		array_agg(distinct ${res_celda_snib:raw}) as cells, 
		icount(array_agg(distinct ${res_celda_snib:raw})) as ni
	FROM snib
	WHERE 
		spid = ${spid} ${fosil:raw}
		and especievalidabusqueda <> ''
		and ${spid} is not null
	group by spid
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
			array_agg(distinct ${res_celda_snib:raw}) as cells, 
			icount(array_agg(distinct ${res_celda_snib:raw})) as nj
	FROM snib ${whereVar:raw} ${fosil:raw}
		and especievalidabusqueda <> ''
		and reinovalido <> ''
		and phylumdivisionvalido <> ''
		and clasevalida <> ''
		and ordenvalido <> ''
		and familiavalida <> ''
		and generovalido <> ''
		and ${res_celda_snib:raw} is not null
		group by spid,
			reinovalido, 
			phylumdivisionvalido, 
			clasevalida, 
			ordenvalido, 
			familiavalida, 
			generovalido, 
			especievalidabusqueda
)
SELECT 	temp_target.spid,
		temp_target.reinovalido,
		temp_target.phylumdivisionvalido,
		temp_target.clasevalida,
		temp_target.ordenvalido,
		temp_target.familiavalida,
		temp_target.generovalido,
		temp_target.especievalidabusqueda,
		temp_target.cells  as cells,
		icount(temp_source.cells & temp_target.cells) AS niyj,
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