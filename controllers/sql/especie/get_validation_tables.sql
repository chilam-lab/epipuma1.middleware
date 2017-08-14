-- select createtemptableforvalidation(28923, 'temp_01'::text, 5, 'cells_16km', 'gridid_16km', 'grid_16km_aoi');
select createtemptableforvalidation($<spid>, '$<idtbl:raw>'::text, $<iterations>, '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>');
/*select count(*) from temp_01 
where 	iter = 5
and sp_obj = true 
and tipo_valor = 'test'*/
		