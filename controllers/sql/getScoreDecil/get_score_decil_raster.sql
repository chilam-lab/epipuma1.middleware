select 
	--* 
	 decil, avg(l_sup) as l_sup, avg(l_inf) as l_inf, avg(sum) as sum, avg(avg) as avg, avg(vp) as vp, avg(fn) as fn, avg(nulos) as nulos, avg(recall) as recall -- , avg(iter) as iter
from iteratevalidationprocessbydecil($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>', '', '$<where_config_raster:value>', 'abio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, '$<fossil:value>', '$<idtabla:value>', false)
--from iteratevalidationprocessbydecil(5, 28923, 94544, 0.01, 0, array[]::int[], 'cells_32km', 'gridid_32km', 'grid_32km_aoi', 'where layer = ''bio01''', '', 'abio', false, -1, 2010, 2020, '', 'temp_01', false)
-- 27332 28923
-- where layer = ''bio01'' 
where decil is not null 
 group by decil
 order by decil desc
