WITH cells_region AS (
	SELECT (cells - ${total_cells:raw}::integer[]) as cells
--  FROM grid_geojson_16km_aoi
	FROM ${res_celda_snib_tb:raw}
--  WHERE footprint_region = 1
	WHERE footprint_region = ${region}
),
temp_source as (
	select array_agg(distinct spid) as spid,
 		(array_agg(distinct cell)-(${discardedDeleted:raw}::integer[]+${source_cells:raw}::integer[])) as cells,
 		array_length( (array_agg(distinct cell)-(${discardedDeleted:raw}::integer[]+${source_cells:raw}::integer[])) ,1) as ni
	from (
		   SELECT 
				a.spid, 
				--unnest (a.cells_16km_1) as cell
				unnest(a.${res_celda_sp:raw}_${region:raw}) as cell
			FROM sp_snib AS a
			WHERE 
				--a.spid in (27333,27337) 
				a.spid in (${spid:raw}) 
				and a.especievalidabusqueda <> ''
				and a.spid is not null
	) as temp
	GROUP by true 
	--a.spid,
	--a.cells_16km_1
	--a.${res_celda_sp:raw}_${region:raw}
),
temp_target as (
	SELECT  
		cast('' as text) generovalido, 
		layer || ' ' || round(cast(split_part(tag,':',1) as numeric),2) || ' ' || round(cast(split_part(tag,':',2) as numeric),2)
		as especievalidabusqueda,
		-- TODO: REVISAR, EL SISTEMA ESTA ENVIANADO PARA WORDCLIM EL LAYER Y PARA EL RESTO LOS NOMBRES
		/*case when type = 1 then
			layer
			else
				case when strpos(label,'Precipit') = 0 then
				(label || ' '  || round(cast(split_part(split_part(tag,':',1),'.',1) as numeric)/10,2)  ||' ºC - ' || round(cast(split_part(split_part(tag,':',2),'.',1) as numeric)/10,2) || ' ºC')
				else
				(label || ' '  || round(cast(split_part(split_part(tag,':',1),'.',1) as numeric),2)  ||' mm - ' || round(cast(split_part(split_part(tag,':',2),'.',1) as numeric),2) || ' mm')
				end
		end as especievalidabusqueda,*/
		a.bid as spid,
		cast('' as text) reinovalido,
		cast('' as text) phylumdivisionvalido,
		cast('' as text) clasevalida,
		cast('' as text) ordenvalido,
		cast('' as text) familiavalida,
--		array_intersection(a.cells_16km, b.cells) as cells,
		array_intersection(a.${res_celda_sp:raw}, b.cells) as cells,
		-- array_intersection((a.${res_celda_sp:raw} - ${total_cells:raw}::integer[]), b.cells) as cells,
		-- icount(array_intersection(a.cells_16km, b.cells)) as nj,
		icount(array_intersection(a.${res_celda_sp:raw}, b.cells)) as nj,
		-- icount(array_intersection((a.${res_celda_sp:raw} - ${total_cells:raw}::integer[]), b.cells)) as nj,
		1 as tipo
	FROM raster_bins AS a, cells_region AS b
-- 	WHERE layer = 'bio010'
	${where_config_raster:raw}
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
		-- ${N} as n,
		${N} - icount( ${discardedDeleted:raw}::integer[] +  ${total_cells:raw}::integer[] + ${source_cells:raw}::integer[] ) as n,
		round( cast( 
			get_epsilon(
				${alpha},
				cast( temp_target.nj as integer), 
				cast( icount(temp_source.cells & temp_target.cells) as integer), 
				cast( temp_source.ni as integer), 
				-- cast( ${N} as integer)
				cast( ${N} - icount( ${discardedDeleted:raw}::integer[] +  ${total_cells:raw}::integer[] + ${source_cells:raw}::integer[] ) as integer)
			)as numeric), 2)  as epsilon,
		round( cast(  ln(   
			get_score(
				${alpha},
				cast( temp_target.nj as integer), 
				cast( icount(temp_source.cells & temp_target.cells) as integer), 
				cast( temp_source.ni as integer), 
				-- cast( ${N} as integer)
				cast( ${N} - icount( ${discardedDeleted:raw}::integer[] +  ${total_cells:raw}::integer[] + ${source_cells:raw}::integer[] ) as integer)
			)
		) as numeric), 2) as score
FROM temp_source,temp_target
where 
temp_target.spid not in (${spid:raw}) 
and icount(temp_target.cells) >= ${min_occ}
order by epsilon desc;