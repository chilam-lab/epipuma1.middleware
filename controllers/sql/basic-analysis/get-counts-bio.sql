with temp_source as (
	SELECT 
		a.spid, 
		--array_agg(distinct snib.gridid_16km ) as cells,
		array_agg(distinct a.${res_celda_snib:raw}) as cells, 
		--icount(array_agg(distinct snib.gridid_16km)) as ni
		icount(array_agg(distinct a.${res_celda_snib:raw})) as ni
	FROM snib AS a
	JOIN (
		SELECT UNNEST(gid) AS gid 
		--FROM grid_geojson_64km_aoi
		FROM ${res_celda_snib_tb}
		--WHERE footprint_region=1 
		WHERE footprint_region=${region}
		) AS b
	ON a.gid = b.gid
	WHERE 
		--spid = 27333
		a.spid = ${spid}
		and a.especievalidabusqueda <> ''
		--and 27333 is not NULL
		and ${spid} is not null
	group by a.spid
),
temp_target as (
	SELECT  a.spid, 
			a.reinovalido, 
			a.phylumdivisionvalido, 
			a.clasevalida, 
			a.ordenvalido, 
			a.familiavalida, 
			a.generovalido, 
			a.especievalidabusqueda, 
			--array_agg(distinct snib.gridid_16km ) as cells,
			array_agg(distinct a.${res_celda_snib:raw}) as cells, 
			--icount(array_agg(distinct snib.gridid_16km)) as nj,
			icount(array_agg(distinct a.${res_celda_snib:raw})) as nj,
			0 as tipo
	FROM snib AS a
	JOIN (
		SELECT UNNEST(gid) AS gid 
		--FROM grid_geojson_64km_aoi
		FROM ${res_celda_snib_tb}
		--WHERE footprint_region=1 
		WHERE footprint_region=${region}
		) AS b
	ON a.gid = b.gid
		--where a.clasevalida = 'Reptilia'
		${where_config:raw}
		and a.especievalidabusqueda <> ''
		and a.reinovalido <> ''
		and a.phylumdivisionvalido <> ''
		and a.clasevalida <> ''
		and a.ordenvalido <> ''
		and a.familiavalida <> ''
		and a.generovalido <> ''
		--and a.gridid_16km is not null
		and a.${res_celda_snib:raw} is not null
		group by a.spid,
			a.reinovalido, 
			a.phylumdivisionvalido, 
			a.clasevalida, 
			a.ordenvalido, 
			a.familiavalida, 
			a.generovalido, 
			a.especievalidabusqueda
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