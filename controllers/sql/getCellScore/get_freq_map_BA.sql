with rawdata as (
	select
		out_cell as gridid,
		out_ni as ni,
		out_score as tscore
	from iteratevalidationprocessbycells($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda:raw>', '$<where_config:value>', '', 'bio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, false, '$<fossil:value>', '$<idtabla:value>')
	-- from iteratevalidationprocessbycells(1, 28923, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio')
	where out_cell is not null
),
apriori as (
	select ln( rawdata.ni / ( $<N> - rawdata.ni::numeric) ) as val
	-- select ln( rawdata.ni / ( 94544 - rawdata.ni::numeric) ) as val 
	from rawdata limit 1
)
select 	grid_16km_aoi.gridid_16km AS gridid, 
		COALESCE(tscore+apriori.val, apriori.val) as tscore 
from rawdata
right join grid_16km_aoi
on rawdata.gridid = grid_16km_aoi.gridid_16km,
apriori
order by tscore DESC

