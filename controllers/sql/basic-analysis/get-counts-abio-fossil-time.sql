WITH cells_region AS (
	SELECT (cells - ${total_cells:raw}::integer[]) as cells
--  FROM grid_geojson_16km_aoi
	FROM ${res_celda_snib_tb:raw}
--  WHERE footprint_region = 1
	WHERE footprint_region = ${region}
),  
temp_source as (
	SELECT 
		-- a.spid, 
		array_agg(distinct a.spid) as spid,
		--array_agg(distinct a.gridid_16km ) as cells,
		-- array_agg(distinct a.${res_celda_snib:raw}) as cells, 
		array_agg(distinct a.${res_celda_snib:raw}) - (${discardedDeleted:raw}::integer[]+${source_cells:raw}::integer[])  as cells, 
		--icount(array_agg(distinct a.gridid_16km)) as ni
		icount( array_agg(distinct a.${res_celda_snib:raw}) - (${discardedDeleted:raw}::integer[]+${source_cells:raw}::integer[]) ) as ni
	FROM snib  AS a
	JOIN (
		SELECT UNNEST(gid) AS gid 
		--FROM grid_geojson_64km_aoi
		FROM ${res_celda_snib_tb:raw}
		--WHERE footprint_region=1 
		WHERE footprint_region=${region}
		) AS b
	ON a.gid = b.gid
	WHERE 
		--a.spid = 27333
		a.spid in (${spid:raw}) ${fossil:raw}
		and 
			(case when ${caso} = 1 
				  then 
						aniocolecta <> 9999
				  when ${caso} = 2 
				  then
						aniocolecta >= cast( ${lim_inf}  as integer)
						and 
						aniocolecta <= cast( ${lim_sup} as integer)
				  else
				  		(
							(
							aniocolecta >= cast( ${lim_inf}  as integer)
							and 
							aniocolecta <= cast( ${lim_sup}  as integer)
							)
							or aniocolecta = 9999
						)
			end) = true
		and a.especievalidabusqueda <> ''
		and a.spid is not null
	group by true 
	-- WHERE 
	-- 	--a.spid = 27333
	-- 	a.spid in (${spid:raw})  ${fossil:raw}
	-- 	and a.especievalidabusqueda <> ''
	-- 	and a.spid is not null
	-- GROUP BY true
),
temp_target as (
	SELECT  
		cast('' as text) generovalido, 
		layer || ' ' || round(cast(split_part(tag,':',1) as numeric),2) || ' ' || round(cast(split_part(tag,':',2) as numeric),2)
		as especievalidabusqueda,
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
		-- array_intersection(a.${res_celda_sp:raw}, b.cells) as cells,
		array_intersection((a.${res_celda_sp:raw} - ${total_cells:raw}::integer[]), b.cells) as cells,
--		icount(array_intersection(a.cells_16km, b.cells)) as nj,
		-- icount(array_intersection(a.${res_celda_sp:raw}, b.cells)) as nj,
		icount(array_intersection((a.${res_celda_sp:raw} - ${total_cells:raw}::integer[]), b.cells)) as nj,
		1 as tipo
	FROM raster_bins AS a, cells_region AS b
	-- WHERE layer = 'bio010'
	${where_config_raster:raw}
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