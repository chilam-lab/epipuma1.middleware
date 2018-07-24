with source AS (
	SELECT  spid,
			reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda,
			1 as grp,
			array_intersection($<res_celda:raw>,
				ARRAY(SELECT cells
					FROM grid_geojson_$<resolution:raw>km_aoi
					WHERE footprint_region = $<region:raw>
				)
			) AS cells 
	FROM sp_snib 
	--WHERE generovalido = 'Aedes'
	$<where_config_source:raw>	 
	and especievalidabusqueda <> ''
),
target AS (
	 SELECT spid,
	 		reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda,
	 		2 as grp,
			array_intersection($<res_celda:raw>,
				ARRAY(SELECT cells
					FROM grid_geojson_$<resolution:raw>km_aoi
					WHERE footprint_region = $<region:raw>
				)
			) AS cells 
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