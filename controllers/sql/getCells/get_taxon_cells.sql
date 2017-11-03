/*
* @Author: Raul Sierra
* @Date:   2017-10-26 14:20:30
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2017-10-30 12:42:21
*/
/*getTaxonCells*/

-- Ejemplo tomado de https://gist.github.com/jczaplew/4512e3f62e30490f2a00
SELECT $<res_celda:raw> AS cell_id, $<tax_level:raw>, MAX(aniocolecta) as max_year, MIN(aniocolecta) as min_year, count(*) as num_records
  FROM snib
  WHERE $<tax_level:raw> = $<tax_name> AND
  	$<res_celda:raw> IS NOT NULL AND
  	ejemplarfosil = ANY(CASE 
  						WHEN NOT $<fossil> THEN ARRAY['']
  						ELSE ARRAY['SI','']
  						END) AND
  	aniocolecta <> (CASE 
  						WHEN NOT $<sfecha> THEN 9999
  						ELSE -1
  						END) AND
  	aniocolecta >= $<start_year> AND aniocolecta <= $<end_year>
  GROUP BY cell_id, $<tax_level:raw>
