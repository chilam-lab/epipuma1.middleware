/*getGridSpecies sin filtros*/
with rawdata as (
	select
		-- out_generovalido,
		out_spid as spid,
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
	from iteratevalidationprocess($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda:raw>', '$<where_config:value>', '', 'bio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, '$<fossil:value>')
	-- from iteratevalidationprocess(1, 28923, 94544, 0.01, 0, array[]::int[], 'gridid_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio', true, 1, 2010, 2020, '')
	-- from iteratevalidationprocess(1, 28923, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio', false, -1, 1500, 2017, '')
	where out_spid is not null
	group by 	out_spid,
				out_cells,
				out_especievalidabusqueda,
				out_reinovalido, out_phylumdivisionvalido, out_clasevalida, out_ordenvalido, out_familiavalida
	order by epsilon desc
),
grid_selected as (
	SELECT 
		-- $<res_grid:raw> as gridid
		gridid_16km as gridid
	FROM grid_16km_aoi 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-102.7001953125 38.28476282022033)',4326))
),
gridsps as ( 
	select 	gridid, 
			rawdata.spid, 
			rawdata.score, 
			especievalidabusqueda as nom_sp, 
			''::text as rango, 
			''::text as label 
	from rawdata 
	join grid_selected 
	on intset(grid_selected.gridid) && rawdata.cells 
	where 	especievalidabusqueda <> ''   
	order by spid 
),
apriori as (
	select ln( rawdata.ni / ( rawdata.n - rawdata.ni::numeric) ) as val
	from rawdata limit 1
),
celda_score as (
	select 	gridid,
			case when (sum(score) + val) <= -$<maxscore:raw> then 0.00 * 100 
			when (sum(score) + val) >= $<maxscore:raw> then 1.00 * 100 
			else exp(sum(score) + val) / (1 + exp( sum(score) + val ))  * 100
			--case when (sum(score) + val) <= -700 then 0.00 * 100 
				--when (sum(score) + val) >= 700 then 1.00 * 100 
				--else exp(sum(score) + val) / (1 + exp( sum(score) + val ))  * 100
			end as prob 
	from gridsps, apriori
	group by gridsps.gridid, val
)
select 	gridsps.*, celda_score.prob
from gridsps,
celda_score
union
select -1 as gridid, 
		0 as spid, 
		0 as score,
		''::text as nom_sp,
		''::text as rango, 
		''::text as label,
		case when (val) <= -700 then 0.00 * 100 
			when (val) >= 700 then 1.00 * 100 
			else exp(val) / (1 + exp( val ))  * 100
		end as prob 
from apriori
order by score desc

	
/*
grid_spid as (
	SELECT $<res_grid:raw> as gridid,
	unnest( $<categorias:raw>
			--animalia||plantae||fungi||protoctista||prokaryotae
			) as spid
	FROM grid_16km_aoi 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-103.271484375 23.017053740980547)',4326))
),

gridsps as ( 
	select 	gridid, 
			grid_spid.spid, 
			especievalidabusqueda as nom_sp, 
			''::text as rango, 
			''::text as label,
			score
	from rawdata 
	join grid_spid 
	on grid_spid.spid = rawdata.spid  
	where 	especievalidabusqueda <> '' 
			--and rango <> ''  
	order by spid 
),

apriori as (
	select ln( rawdata.ni / ( rawdata.n - rawdata.ni::numeric) ) as val
	from rawdata limit 1
),
celda_score as (
	select 	gridid,
			case when (sum(score) + val) <= -$<maxscore:raw> then 0.00 * 100 
				when (sum(score) + val) >= $<maxscore:raw> then 1.00 * 100 
				else exp(sum(score) + val) / (1 + exp( sum(score) + val ))  * 100 
			end as prob 
	from gridsps, apriori
	group by gridid, val
)
select 	*
from gridsps,
celda_score
order by score desc
*/
