/*
* @Author: Raul Sierra
* @Date:   2017-10-26 14:20:30
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2017-10-26 15:21:41
*/
/*getTaxonCells*/

-- Ejemplo tomado de https://gist.github.com/jczaplew/4512e3f62e30490f2a00
WITH taxa_cell_ids AS (
  SELECT 1 AS arbitrary_group_by, unnest($<res_celda:raw>) AS t_cell_ids 
  FROM sp_snib
  WHERE $<tax_level:raw> = $<tax_name>
)
SELECT array_agg(distinct t_cell_ids) as cell_ids
FROM taxa_cell_ids 
GROUP BY arbitrary_group_by;

