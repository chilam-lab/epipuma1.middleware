select
	out_cell as gridid,
	out_score as tscore
from iteratevalidationprocessbycells($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda:raw>', '$<where_config:value>', '$<where_config_raster:value>', 'both')
-- from iteratevalidationprocessbycells(1, 28923, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'where clasevalida = ''Mammalia'' ', 'where layer = ''bio01'' ', 'both')
where out_cell is not NULL
order by tscore desc
