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
	FROM raster_bins ${whereVar:raw}
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