with rawdata as (
	select
		out_cell as gridid,
		out_ni as ni,
		out_score as tscore
	from iteratevalidationprocessbycells($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda:raw>', '', '$<where_config_raster:value>', 'abio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, false, '$<fossil:value>')
	-- from iteratevalidationprocessbycells(1, 28923, 94544, 0.01, 0, array[]::int[], 'cells_16km', '', 'where layer = ''bio01'' ', 'abio')
	where out_cell is not null
),
apriori as (
	select ln( rawdata.ni / ( $<N> - rawdata.ni::numeric) ) as val
	-- select ln( rawdata.ni / ( 94544 - rawdata.ni::numeric) ) as val 
	from rawdata limit 1
)
select 	grid_16km_aoi.gridid_16km AS gridid, 
		case when tscore <= -$<maxscore>
		-- case when tscore <= -700
		then 
			0 
		when tscore >= $<maxscore>
		-- when tscore >= 700
		then 
			1 
		ELSE 
			COALESCE( exp(tscore+val) / (1 + exp(tscore+val)), exp(val) / (1 + exp(val)) ) 
			-- exp(tscore+val) / (1 + exp(tscore+val))    
		end as tscore  
from rawdata
right join grid_16km_aoi
on rawdata.gridid = grid_16km_aoi.gridid_16km,
apriori
order by tscore DESC





