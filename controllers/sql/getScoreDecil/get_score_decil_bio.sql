-- total celdas: 94544
-- iteraciones: 5
with prerawdata as (
	select *
		-- out_cell as gridid,
		-- out_score as tscore,
		-- type_value,
		-- iter
	-- from iteratevalidationprocessbycells($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>', '$<where_config:value>', '', 'bio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, true, '$<fossil:value>', '$<idtabla:value>')
	from iteratevalidationprocessbydecil(5, 28923, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'gridid_16km', 'grid_16km_aoi', 'where ordenvalido = ''Carnivora'' ', '', 'bio', false, -1, 2010, 2020, '', 'temp_01')
	where decil is not null 
	-- and iter = 1
	-- and out_score is null
	-- order by out_cell
	-- and (type_value = 'test' or type_value = 'test-n')
),
valdata as (
	select
		gridid,
		tscore,
		iter
	from prerawdata
	where type_value = 'test'
),
rawdata as (
	select
		gridid,
		tscore,
		iter
	from prerawdata
	where type_value = 'train'
),
-- obtiene el score de las coovariables y con cero el resto de las celdas de la malla 
prenorm as (
	select 	grid_16km_aoi.gridid_16km as gridid, 
			COALESCE(tscore, 0) as tscore 
	from rawdata
	right join grid_16km_aoi
	on rawdata.gridid = grid_16km_aoi.gridid_16km
	order by tscore desc
),
deciles as ( 
	SELECT 
			gridid, 
			tscore, 
			-- array_sp, 
			ntile(10) over (order by tscore) AS decil 
	FROM prenorm 
	ORDER BY tscore 
),
boundaries as (
	select 
		decil,
		cast(round( cast(max(deciles.tscore) as numeric),2) as float) as l_sup, 
		cast(round( cast(min(deciles.tscore) as numeric),2) as float) as l_inf, 
		cast(round( cast(sum(deciles.tscore) as numeric),2) as float) as sum, 
		cast(round( cast(avg(deciles.tscore) as numeric),2) as float) as avg
		-- array_agg(gridid) as gridids
	from deciles 
	group by decil 
	order by decil desc
)
select 	decil, 
		l_sup,
		l_inf,
		sum, avg,
		case when 2>1
		-- case when $<iterations> >1 
			then count(valdata.*) filter (WHERE valdata.tscore > l_inf) 
		else 0 end as vp,
		case when 2>1
		-- case when $<iterations> >1 
			then count(valdata.*) filter (WHERE valdata.tscore is null) 
		else 0 end as nulos,
		case when 2>1
		-- case when $<iterations> >1 
			then count(valdata) - ( count(valdata.*) filter (WHERE valdata.tscore > l_inf) ) 
		else 0 end as fn,
		case when 2>1
		-- case when $<iterations> >1 
			then (count(valdata.*) filter (WHERE valdata.tscore > l_inf))::float / (count(valdata.*) filter (WHERE valdata.tscore > l_inf) + (count(valdata) - ( count(valdata.*) filter (WHERE valdata.tscore > l_inf) ) ))
		else 0 end as recall
from boundaries
full outer join valdata
on true
group by decil, l_sup, l_inf, sum, avg
order by decil desc

*/


/*select *
from iteratevalidationprocessbycells(5, 28923, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio', true)
where out_cell is not null and type_value = 'test'
order by out_cell
-- and type_value = 'test'

with boundaries as (
	select 
		unnest(array[0,10,20,30,40]::int[]) as l_inf,
		unnest(array[9,19,29,39,49]::int[]) as l_sup,
		unnest(array[1,2,3,4,5]::int[]) as decil
),
values_res as (
	select unnest (array[1,2,13,4,35,6,7,8,29,45]::int[]) as score
)
select 	decil, l_inf, l_sup, 
		count(values_res.*) filter (WHERE values_res.score > l_inf) as vp,
		count(values_res) - count(values_res.*) filter (WHERE values_res.score > l_inf) as fn,
		(count(values_res.*) filter (WHERE values_res.score > l_inf))::float / (count(values_res.*) filter (WHERE values_res.score > l_inf) + (count(values_res) - count(values_res.*) filter (WHERE values_res.score > l_inf))) as recall
from boundaries,
values_res
group by decil, l_inf, l_sup
order by decil desc */

	
	