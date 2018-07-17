with temp_source as (
	SELECT 
		spid, 
		array_agg(distinct ${res_celda_snib:raw}) as cells, 
		icount(array_agg(distinct ${res_celda_snib:raw})) as ni
	FROM snib
	join aoi
	on snib.gid = aoi.gid
	WHERE 
		--aoi.fgid = 19 and
		aoi.fgid = $<id_country:raw> and
		spid = ${spid} ${fossil:raw}
		and 
			(case when ${caso} = 1 
				  then 
						fechacolecta <> ''
				  when ${caso} = 2 
				  then
						cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( ${lim_inf}  as integer)
						and 
						cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( ${lim_sup} as integer)
				  else
				  		(
							(
							cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( ${lim_inf}  as integer)
							and 
							cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( ${lim_sup}  as integer)
							)
							or fechacolecta = ''
						)
			end) = true
		and especievalidabusqueda <> ''
		and ${spid} is not null
	group by spid
),
temp_target as (
	SELECT  generovalido, 
			especievalidabusqueda, 
			spid, 
			reinovalido, 
			phylumdivisionvalido, 
			clasevalida, 
			ordenvalido, 
			familiavalida, 
			array_agg(distinct ${res_celda_snib:raw}) as cells, 
			icount(array_agg(distinct ${res_celda_snib:raw})) as nj,
			0 as tipo
	FROM snib
	join aoi
	on snib.gid = aoi.gid
		--where clasevalida = 'Reptilia'
		${where_config:raw}  ${fossil:raw}
		--and aoi.fgid = 19
		and aoi.fgid = $<id_country:raw>
		and 
			(case when ${caso} = 1 
				  then 
						fechacolecta <> ''
				  when ${caso} = 2 
				  then
						cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( ${lim_inf}  as integer)
						and 
						cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( ${lim_sup} as integer)
				  else
				  		(
							(
							cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)>= cast( ${lim_inf}  as integer)
							and 
							cast( NULLIF((regexp_split_to_array(fechacolecta, '-'))[1], '')  as integer)<= cast( ${lim_sup}  as integer)
							)
							or fechacolecta = ''
						)
			end) = true
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
	union
	SELECT  
		cast('' as text) generovalido,
		case when type = 1 then
			layer
			else
				case when strpos(label,'Precipit') = 0 then
				(label || ' '  || round(cast(split_part(split_part(tag,':',1),'.',1) as numeric)/10,2)  ||' ºC - ' || round(cast(split_part(split_part(tag,':',2),'.',1) as numeric)/10,2) || ' ºC')
				else
				(label || ' '  || round(cast(split_part(split_part(tag,':',1),'.',1) as numeric),2)  ||' mm - ' || round(cast(split_part(split_part(tag,':',2),'.',1) as numeric),2) || ' mm')
				end
		end as especievalidabusqueda,
		bid as spid,
		cast('' as text) reinovalido,
		cast('' as text) phylumdivisionvalido,
		cast('' as text) clasevalida,
		cast('' as text) ordenvalido,
		cast('' as text) familiavalida,
		${res_celda_sp:raw} as cells, 
		icount(${res_celda_sp:raw}) as nj,
		1 as tipo
	FROM raster_bins ${where_config_raster:raw}
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