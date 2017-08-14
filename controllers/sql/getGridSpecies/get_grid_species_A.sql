/*getGridSpecies sin filtros*/
with rawdata as (
	select
		-- out_generovalido,
		out_spid as spid,
		out_tipo AS tipo,
		out_cells as cells,
		out_especievalidabusqueda as especievalidabusqueda,
		round(avg(out_nij),2) as nij,
		round(avg(out_nj),2) as nj,
		-- avg(out_ni),
		avg(out_ni)::int as ni,  
	 	avg(out_n)::int as n,
	 	out_reinovalido as reinovalido,
	 	out_phylumdivisionvalido as phylumdivisionvalido,
	 	out_clasevalida as clasevalida,
	 	out_ordenvalido as ordenvalido,
	 	out_familiavalida as familiavalida,
		round(avg(out_epsilon),2) as epsilon,
		round(avg(out_score),2) as score		
	from iteratevalidationprocess($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda:raw>', '$<where_config:value>', '$<where_config_raster:value>', 'both', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, '$<fossil:value>', '$<idtabla:value>')
	-- from iteratevalidationprocess(1, 28923, 94544, 0.01, 0, array[]::int[], 'gridid_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio', true, 1, 2010, 2020, '')
	-- from iteratevalidationprocess(1, 28923, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio', false, -1, 1500, 2017, '')
	where out_spid is not null
	group by 	out_spid,
				out_tipo,
				out_cells,
				out_especievalidabusqueda,
				out_reinovalido, out_phylumdivisionvalido, out_clasevalida, out_ordenvalido, out_familiavalida
	order by epsilon desc
),
grid_selected as (
	SELECT 
		$<res_grid:raw> as gridid
		--gridid_16km as gridid
	FROM grid_16km_aoi 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
)
select 	gridid, 
		spid,
		especievalidabusqueda as nom_sp,
		label,
		score,
		apriori
from ( 
	select 	gridid, 
			rawdata.spid,
			rawdata.score,
			case when tipo = 0
			then especievalidabusqueda
			else ''
			end as especievalidabusqueda,
			case when tipo = 1
			then especievalidabusqueda
			else ''
			end as label,
			ln( rawdata.ni / ( rawdata.n - rawdata.ni::numeric) ) as apriori
	from rawdata 
	join grid_selected 
	on intset(grid_selected.gridid) && rawdata.cells
) as total   

union 
-- se genera row para agregar apriori en caso de que la celda escogida no tenga valor
( select 	0 as gridid, 
		0 as spid, 
		'-'::text as nom_sp,
		'-'::text as label, 
		ln( ni / ( n - ni::numeric) ) as score,
		ln( ni / ( n - ni::numeric) ) as apriori
from rawdata limit 1)
	
	
order by score desc



/*
grid_spid as (
	SELECT $<res_grid:raw> as gridid,
	unnest( 
			-- NOTA DINAMICO: verificar cuando se envian las variables depediendo de los filtros rastersleccionados!!!!
			--animalia||plantae||fungi||protoctista||prokaryotae||
			--bio01||bio02||bio03||bio04||bio05||bio06|| bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19
			$<categorias:raw>
			) as spid
	FROM grid_16km_aoi 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
	-- -96.339111328125 19.427484900299145	| score total: -0.72 | celda:588870   
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
),
gridsps as ( 
	select 	gridid, 
			spid,
			especievalidabusqueda as nom_sp,
			label
	from ( 
		select 	gridid, 
				grid_spid.spid, 
				case when tipo = 0
				then especievalidabusqueda
				else ''
				end as especievalidabusqueda,
				case when tipo = 1
				then especievalidabusqueda
				else ''
				end as label
		from rawdata 
		join grid_spid 
		on grid_spid.spid = rawdata.spid
	--) 
	) as total 
	--where 	especievalidabusqueda <> ''  
	order by spid 
)
select 	gridid, 
		spid, 
		nom_sp, 
		label,
		score,
		apriori
from (
	select 	gridsps.*,  
			score, 
			ln( rawdata.ni / ( rawdata.n - rawdata.ni::numeric) ) as apriori
	from gridsps  
	join rawdata 
	on gridsps.spid = rawdata.spid
	union 
	-- se genera row para agregar apriori en caso de que la celda escogida no tenga valor
	( select 	0 as gridid, 
			0 as spid, 
			'-'::text as nom_sp,
			'-'::text as label, 
			ln( ni / ( n - ni::numeric) ) as score,
			ln( ni / ( n - ni::numeric) ) as apriori
	from rawdata limit 1)
) as tabla
order by score desc*/
