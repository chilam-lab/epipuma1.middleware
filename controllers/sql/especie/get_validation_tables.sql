--select createtemptableforvalidation(28923, 'temp_01'::text, 5, 'cells_16km', 'gridid_16km', 'grid_16km_aoi');
-- PROD: 27332
-- DEV: 28923
select createtemptableforvalidation($<spid>, '$<idtbl:raw>'::text, $<iterations>, '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>');