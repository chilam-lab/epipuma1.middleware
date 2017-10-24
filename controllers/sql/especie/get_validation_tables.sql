--select createtemptableforvalidation(27604, 'temp_01'::text, 5, 'cells_8km', 'gridid_8km', 'grid_8km_aoi');
-- PROD: 27332
-- DEV: 28923
select createtemptableforvalidation($<spid>, '$<idtbl:raw>'::text, $<iterations>, '$<res_celda_sp:raw>', '$<res_celda_snib:raw>', '$<res_celda_snib_tb:raw>');