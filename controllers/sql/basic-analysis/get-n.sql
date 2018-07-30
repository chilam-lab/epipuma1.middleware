SELECT 
	array_length(cells, 1) as n
FROM 
	$<res_celda_snib_tb:raw>
WHERE
	footprint_region = $<region>;
