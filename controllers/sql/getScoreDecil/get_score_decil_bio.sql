-- total celdas: 94544
-- iteraciones: 5
select 
	--* 
	 decil, avg(l_sup) as l_sup, avg(l_inf) as l_inf,
	 -- avg(sum) as sum, 
	 avg(avg) as avg,
	 array_agg(arraynames) as arraynames,
	 /*case when iter = 1 
	 then array_agg(arraynames)
	 else array_agg(''::text)
	 end as arraynames,*/ 
	 avg(vp) as vp, avg(fn) as fn, avg(nulos) as nulos, avg(recall) as recall -- , avg(iter) as iter
from iteratevalidationprocessbydecil($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>', '$<where_config:value>', '', 'bio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, '$<fossil:value>', '$<idtabla:value>', false)
--from iteratevalidationprocessbydecil(5, 27332, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'gridid_16km', 'grid_16km_aoi', 'where ordenvalido = ''Carnivora'' ', '', 'bio', false, -1, 2010, 2020, '', 'temp_01', true)
-- 27332 28923
-- where layer = ''bio01'' 
where decil is not null 
 group by decil
 order by decil desc

	
	