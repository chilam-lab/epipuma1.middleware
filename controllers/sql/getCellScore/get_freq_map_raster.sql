select
	out_cell as gridid,
	avg(out_score) as tscore
	--out_score as tscore
from iteratevalidationprocessbycells($<iterations>, $<spid>, $<n_grid_coverage>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>', '', '$<where_config_raster:value>', 'abio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, false, '$<fossil:value>', '$<idtabla:value>')
--from iteratevalidationprocessbycells(5,  27332, 0, 0.01, 0, array[]::int[], 'cells_16km', 'gridid_16km', 'grid_16km_aoi', '', 'where layer = ''bio01'' ', 'abio', false, -1, 2010, 2020, false, '', 'temp_01')
where out_cell is not null
group by gridid
order by tscore desc
