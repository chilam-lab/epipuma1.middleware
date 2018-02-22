/*
* @Author: Raul Sierra
* @Date:   2017-11-29 11:26:02
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-02-20 15:07:16
*/

/* getTaxonChildren */

SELECT $<root_level:raw> as root_level, $<child_level:raw> as scientific_name, spid
FROM sp_snib
WHERE $<root_level:raw> = $<root_name> AND $<child_level:raw> <> ''
