/*
* @Author: Raul Sierra
* @Date:   2018-02-17 07:33:03
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-02-17 08:09:49
*/
SELECT snib.$<tax_group_level:raw>, snib.especievalidabusqueda as var_name, g.sp_id as var_id FROM
	(SELECT unnest(animalia) AS sp_id 
	 FROM $<source_table:raw> WHERE $<id_col:raw> = $<id>
	) g
INNER JOIN sp_snib AS snib ON snib.spid = g.sp_id WHERE $<tax_group_level:raw> = $<tax_group_name>