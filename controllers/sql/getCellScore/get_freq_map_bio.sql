select
	out_cell as gridid,
	cast(round(out_score,2) as float) as tscore
from iteratevalidationprocessbycells($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda:raw>', '$<where_config:value>', '', 'bio', $<filter_time>, $<caso>, $<lim_inf>, $<lim_sup>, false)
-- from iteratevalidationprocessbycells(1, 28923, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio', false)
where out_cell is not NULL
order by tscore desc
