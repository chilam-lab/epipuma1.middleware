select 
	--* 
	 decil, avg(l_sup) as l_sup, avg(l_inf) as l_inf, avg(sum) as sum, avg(avg) as avg, 
	 array_agg(arraynames) as arraynames,
	 avg(vp) as vp, avg(fn) as fn, avg(nulos) as nulos, avg(recall) as recall -- , avg(iter) as iter
from iteratevalidationprocessbydecil($<iterations>, $<spid>, $<n_grid_coverage>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>', '$<where_config:value>', '$<where_config_raster:value>', 'both', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, '$<fossil:value>', '$<idtabla:value>', true)
--from iteratevalidationprocessbydecil(5, 27332, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'gridid_16km', 'grid_16km_aoi', 'where clasevalida = ''Mammalia'' ', 'where layer = ''bio01''', 'both', false, -1, 2010, 2020, '', 'temp_01')
-- 27332 28923
-- where layer = ''bio01'' 
where decil is not null 
 group by decil
 order by decil DESC