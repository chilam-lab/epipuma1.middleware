-- TODO: Se puede agregar los filtros como el verbo getSpecies
-- Requiere realizar la agrupación de todas las especies que considen con una cadena dada,
-- esto consume tiempo excesivo para un operación rápida que se necesita
select 	
		$<columnas:raw>
		--reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda,
		--distinct clasevalida,
		--icount(array[]::int[]) as occ
		--icount($<res_celda_sp:raw>) as occ
from sp_snib_region
where   
		--lower(clasevalida) like lower('Ma%')
		lower($(nivel:raw)) like lower($<str>||'%')
		$<ad_param:raw>
		$<region_col:raw>
$<limite:raw>
--limit 15

--select row_to_json(c,true) as ent from ( select nom_sp, spid, reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, epitetovalido from sp_snib where lower(especievalidabusqueda) like lower('lynx%') limit 30 offset 0) c
--select row_to_json(c,true) as ent from (select distinct clasevalida as clasevalida from sp_snib where lower(clasevalida) like lower('mamma%') limit 15 offset 0) c