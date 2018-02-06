/*
* @Author: Raul Sierra
* @Date:   2017-11-29 11:26:02
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2017-11-29 13:13:35
*/

/* getTaxonChildren */

SELECT $<root_level:raw> as root_level, $<child_level:raw> as scientific_name
FROM sp_snib
WHERE $<root_level:raw> = $<root_name> AND $<child_level:raw> <> ''
