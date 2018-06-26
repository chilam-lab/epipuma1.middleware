with source AS (
	SELECT  spid,
			reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda,
			1 as grp,
			$<res_celda:raw> AS cells
			--sp_snib.cells_16km as cells
	FROM sp_snib 
	--WHERE generovalido = 'Aedes'
	$<where_config_source:raw>	 
	and especievalidabusqueda <> ''
),
target AS (
	 SELECT spid,
	 		reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda,
	 		2 as grp,
			$<res_celda:raw> AS cells 
	FROM sp_snib 
	--WHERE generovalido = 'Lutzomyia'
	$<where_config_target:raw>	 
	and especievalidabusqueda <> ''
)
select 	spid,
	 	reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, 
	 	especievalidabusqueda  as label,
	 	grp,
	 	icount(cells) as occ
from source 
union 
select 	spid,
	 	reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, 
	 	especievalidabusqueda  as label,
	 	grp,
	 	icount(cells) as occ
from target
where icount(cells) >= $<min_occ:raw>