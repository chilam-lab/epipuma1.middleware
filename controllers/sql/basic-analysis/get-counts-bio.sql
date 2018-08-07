with lista_gridids as (
	select array_agg(cell) as cells
	from(
		select cell
		from temp_01
		where iter = 1 and tipo_valor = 'test' and sp_obj = FALSE
		order by cell
	) as t1
	group by true
),
lista_gridids_seccion_sp as (
	select array_agg(cell) as cells
	from(
		select cell
		from temp_01
		where iter = 1 and tipo_valor = 'test' and sp_obj = TRUE
		order by cell
	) as t1
	group by true
),
temp_source as (
	SELECT 
		spid, 
		(array_agg(distinct snib.gridid_16km) - lista_gridids_seccion_sp.cells) as cells,
		--array_agg(distinct ${res_celda_snib:raw} - lista_gridids.cells) as cells, 
		icount(array_agg(distinct snib.gridid_16km) - lista_gridids_seccion_sp.cells)  as ni
		--icount(array_agg(distinct ${res_celda_snib:raw})) as ni
	FROM snib
	join aoi
	on snib.gid = aoi.gid,
	lista_gridids_seccion_sp
	WHERE 
		aoi.fgid = 19 and
		--aoi.fgid = $<id_country:raw> and
		spid = 27333
		--spid = ${spid}
		and especievalidabusqueda <> ''
		and 27333 is not NULL
		--and ${spid} is not null
	group by spid, lista_gridids_seccion_sp.cells
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
			(array_agg(distinct snib.gridid_16km) - lista_gridids.cells) as cells,
			--array_agg(distinct ${res_celda_snib:raw}) as cells, 
			icount(array_agg(distinct snib.gridid_16km) - lista_gridids.cells) as nj,
			--icount(array_agg(distinct ${res_celda_snib:raw})) as nj,
			0 as tipo
	FROM snib
	join aoi
	on snib.gid = aoi.gid,
	lista_gridids
		where clasevalida = 'Mammalia'
		--${where_config:raw}
		and aoi.fgid = 19
		--and aoi.fgid = $<id_country:raw>
		and especievalidabusqueda <> ''
		and reinovalido <> ''
		and phylumdivisionvalido <> ''
		and clasevalida <> ''
		and ordenvalido <> ''
		and familiavalida <> ''
		and generovalido <> ''
		and snib.gridid_16km is not null
		--and ${res_celda_snib:raw} is not null
		group by spid,
			reinovalido, 
			phylumdivisionvalido, 
			clasevalida, 
			ordenvalido, 
			familiavalida, 
			generovalido, 
			especievalidabusqueda,
			lista_gridids.cells
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