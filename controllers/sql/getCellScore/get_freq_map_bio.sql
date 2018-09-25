select
	out_cell as gridid,
	cast(round(avg(out_score),2) as float) as tscore
from iteratevalidationprocessbycells($<iterations>, $<spid>, $<n_grid_coverage>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>', '$<where_config:value>', '', 'bio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, false, '$<fossil:value>', '$<idtabla:value>')
-- from iteratevalidationprocessbycells(1, 27332, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'gridid_16km', 'grid_16km_aoi', 'where clasevalida = ''Mammalia'' ', '', 'bio', false, -1, 2010, 2020, false, '', 'temp_01')
where out_cell is not null
group by gridid
order by tscore desc
