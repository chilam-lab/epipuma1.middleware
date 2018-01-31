/*
* @Author: Raul Sierra
* @Date:   2017-12-01 10:45:31
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2017-12-01 12:03:30
*/
SELECT spid, especievalidabusqueda as valid_name
FROM sp_snib
WHERE spid = $<spid> AND especievalidabusqueda <> ''