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
	from iteratevalidationprocess($<iterations>, $<spid>, $<n_grid_coverage>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>', '$<where_config:value>', '$<where_config_raster:value>', 'both', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, '$<fossil:value>', '$<idtabla:value>')
	--from iteratevalidationprocess(5, 27332, 26944, 0.01, 0, array[]::int[], 'cells_16km', 'gridid_16km', 'grid_16km_aoi', 'where clasevalida = ''Mammalia'' ', '', 'bio', false, -1, 2010, 2020, '', 'temp_01')
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
		$<res_celda_snib:raw> as gridid
		--gridid_16km as gridid
	FROM $<res_celda_snib_tb:raw> 
	--FROM grid_16km_aoi
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
)
select 	gridid, 
		spid,
		especievalidabusqueda::text as nom_sp, 
		label::text,
		--score
		round(avg(score),2)  as score,
		round(avg(apriori),2) as apriori
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
group by gridid, spid, nom_sp, label
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