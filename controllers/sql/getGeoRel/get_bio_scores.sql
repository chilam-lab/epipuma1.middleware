/*
* @Author: Raul Sierra
* @Date:   2018-02-07 13:40:17
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-02-09 18:06:00
*/
select a.especievalidabusqueda as var_name,
	b.especievalidabusqueda as covar_name,
	b.spid as covar_id,
	array_length(a.$<res_celda_sp:raw>, 1) as ni,
	array_length(b.$<res_celda_sp:raw>, 1) as nj,
	(array_length(a.$<res_celda_sp:raw>, 1)
		+ array_length(b.$<res_celda_sp:raw>, 1) 
		- array_length(ARRAY(SELECT DISTINCT UNNEST(a.$<res_celda_sp:raw> || b.$<res_celda_sp:raw>)), 1)) 
	as nij
from sp_snib as a, sp_snib as b
where a.spid = $<spid> and
	b.spid <> $<spid> and
	b.clasevalida = $<covar_tax_name> and
	b.especievalidabusqueda <> '' and
	b.$<res_celda_sp:raw> <> '{}'
