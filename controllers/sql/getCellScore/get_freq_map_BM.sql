with rawdata as (
	select
		out_cell as gridid,
		out_ni as ni,
		out_score as tscore
	from iteratevalidationprocessbycells($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>', '$<where_config:value>', '', 'bio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, false, '$<fossil:value>', '$<idtabla:value>')
	-- from iteratevalidationprocessbycells(1, 28923, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio')
	where out_cell is not null
),
n_res AS (
	SELECT count(*) AS n FROM $<res_celda_snib_tb:raw>
),
apriori as (
	select ln( rawdata.ni / ( n_res.n - rawdata.ni::numeric) ) as val
	-- select ln( rawdata.ni / ( 94544 - rawdata.ni::numeric) ) as val 
	from rawdata, n_res limit 1
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

