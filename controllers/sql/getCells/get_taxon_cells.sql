/*
* @Author: Raul Sierra
* @Date:   2017-10-26 14:20:30
* @Last Modified by:   Raul Sierra
<<<<<<< HEAD
* @Last Modified time: 2018-01-25 16:33:43
=======
* @Last Modified time: 2018-01-31 11:11:30
>>>>>>> 253d24ba57eec7b4e6781039f212f03ad7e590bd
*/
/*getTaxonCells*/

-- Ejemplo tomado de https://gist.github.com/jczaplew/4512e3f62e30490f2a00
SELECT $<res_celda:raw> AS cell_id, $<tax_level:raw>, MAX(aniocolecta) as max_year, MIN(aniocolecta) as min_year, count(*) as num_records
  FROM snib
  WHERE $<tax_level:raw> = $<tax_name> AND
<<<<<<< HEAD
  	($<res_celda:raw> IS NOT NULL) AND
    ($<fossil> OR ejemplarfosil <> 'SI') AND
    ($<sfecha:raw> OR aniocolecta is not null) 
=======
  	$<res_celda:raw> IS NOT NULL AND
    ($<fossil:raw> OR ejemplarfosil <> 'SI') AND
    ($<sfecha:raw> OR aniocolecta is not null)
>>>>>>> 253d24ba57eec7b4e6781039f212f03ad7e590bd
  GROUP BY cell_id, $<tax_level:raw>
