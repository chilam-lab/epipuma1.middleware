/*
* @Author: Raul Sierra
* @Date:   2017-10-26 10:21:56
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2017-10-26 13:10:05
*/
/*getGridSpecies sin filtros*/
SELECT DISTINCT $<res_celda:raw> as cell_ids,
				especievalidabusqueda as especie
				-- ejemplarfosil
FROM sp_snib 
WHERE 	
		spid = $<spid>
