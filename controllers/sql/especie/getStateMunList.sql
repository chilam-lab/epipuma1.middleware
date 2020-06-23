select
		-- distinct gridid_statekm as gridid, "NOM_ENT" as entidad
		distinct $<res_celda_snib:raw> as gridid, 
		$<selected_columns:raw>
		-- "NOM_ENT" as entidad, "NOM_MUN" as municipio
-- from grid_statekm_aoi
-- grid_munkm_aoi
from $<res_celda_snib_tb:raw> 
where   
		-- lower("NOM_MUN") like lower('Chi%')
		lower("$<col_name:raw>") like lower($<str>||'%')
$<limite:raw>
--limit 15