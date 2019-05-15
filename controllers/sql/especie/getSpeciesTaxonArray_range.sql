with spid_specie as (
	SELECT spid 
	FROM sp_snib
	$<taxones:raw>
), spid_occ as (
	SELECT
		-- icount(array_agg(distinct gridid_16km)) as occ
		icount(array_agg(distinct a.$<res_celda_snib:raw>)) as occ
	FROM snib AS a
	JOIN (
		SELECT UNNEST(gid) AS gid 
		--FROM grid_geojson_64km_aoi
		FROM ${res_celda_snib_tb:raw}
		--WHERE footprint_region=1 
		WHERE footprint_region=${region}
		) AS b
	ON a.gid = b.gid
	JOIN spid_specie AS c
	ON a.spid = c.spid
	WHERE
		a.reinovalido <> '' and
		a.phylumdivisionvalido <> '' and
		a.clasevalida <> '' and
		a.ordenvalido <> '' and
		a.familiavalida <> '' and
		a.generovalido <> '' and
		a.especievalidabusqueda <> '' and
		--gridid_16km is not null
		$<res_celda_snib:raw> is not null
		$<sfosil:raw> 
		--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)
		and 
		(
			(
				aniocolecta >= cast($<lim_inf:raw>  as integer) 
				and 
				aniocolecta <= cast( $<lim_sup:raw>  as integer)
			) 
			or aniocolecta = 9999
		)
	GROUP BY true
)
SELECT DISTINCT st_asgeojson(a.the_geom) as json_geom, 
				$<res_celda_snib:raw> as gridid, 
				a.urlejemplar,
				a.aniocolecta,
				(SELECT sum(occ) FROM spid_occ) as occ
FROM snib AS a
JOIN (
	SELECT UNNEST(gid) AS gid 
	--FROM grid_geojson_64km_aoi
	FROM ${res_celda_snib_tb:raw}
	--WHERE footprint_region=1 
	WHERE footprint_region=${region}
	) AS b
ON a.gid = b.gid
JOIN spid_specie AS c
ON a.spid = c.spid
WHERE
	a.reinovalido <> '' and
	a.phylumdivisionvalido <> '' and
	a.clasevalida <> '' and
	a.ordenvalido <> '' and
	a.familiavalida <> '' and
	a.generovalido <> '' and
	a.especievalidabusqueda <> '' and
	--gridid_16km is not null
	$<res_celda_snib:raw> is not null
	$<sfosil:raw> 
	--and (ejemplarfosil <> 'SI' or ejemplarfosil is null)
	and 
	(
		(
			aniocolecta>= cast( $<lim_inf:raw>  as integer) 
			and 
			aniocolecta<= cast( $<lim_sup:raw>  as integer)
		) 
		or aniocolecta = 9999 
	)