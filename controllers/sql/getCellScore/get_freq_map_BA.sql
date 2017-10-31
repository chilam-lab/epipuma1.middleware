with rawdata as (
	select
		out_cell as gridid,
		avg(out_ni) as ni,
		avg(out_score) as tscore
	from iteratevalidationprocessbycells($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>', '$<where_config:value>', '', 'bio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, false, '$<fossil:value>', '$<idtabla:value>')
	--from iteratevalidationprocessbycells(5, 28923, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio')
	where out_cell is not null
	group by gridid
),
n_res AS (
	SELECT count(*) AS n FROM $<res_celda_snib_tb:raw>
),
apriori as (
	select ln( rawdata.ni / ( n_res.n - rawdata.ni::numeric) ) as val
	-- select ln( rawdata.ni / ( 94544 - rawdata.ni::numeric) ) as val 
	from rawdata, n_res limit 1
)
select 	$<res_celda_snib_tb:raw>.$<res_celda_snib:raw> AS gridid, 
		COALESCE(tscore+apriori.val, apriori.val) as tscore 
from rawdata
right join $<res_celda_snib_tb:raw>
on rawdata.gridid = $<res_celda_snib_tb:raw>.$<res_celda_snib:raw>,
apriori
order by tscore DESC

