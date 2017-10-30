/*
* @Author: Raul Sierra
* @Date:   2017-10-26 14:20:30
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2017-10-27 14:15:26
*/
/*getTaxonCells*/

-- Ejemplo tomado de https://gist.github.com/jczaplew/4512e3f62e30490f2a00
WITH taxa_cell_ids AS (
  SELECT 1 AS arbitrary_group_by, $<res_celda:raw> AS t_cell_ids, $<tax_level:raw> 
  FROM snib
  WHERE $<tax_level:raw> = $<tax_name> AND 
  	ejemplarfosil = ANY(CASE 
  						WHEN NOT $<fossil> THEN ARRAY['']
  						ELSE ARRAY['SI','']
  						END) AND
  	aniocolecta <> (CASE 
  						WHEN NOT $<sfecha> THEN 9999
  						ELSE -1
  						END)
  GROUP BY t_cell_ids, $<tax_level:raw>
)
SELECT $<tax_level:raw>, array_agg(distinct t_cell_ids) as cell_ids, count(*) 
FROM taxa_cell_ids 
GROUP BY arbitrary_group_by, $<tax_level:raw>;
