WITH z AS (	
  SELECT 
		count(*) as tcount 
	FROM (
		SELECT the_geom 
		FROM grid_mex 
		WHERE ( 
			st_intersects(
				ST_Transform(
					ST_Envelope(
						(
							SELECT the_geom 
							FROM public.estados 
							WHERE entid = 16)
						),
						900913
					),
					the_geom
					)
				) 
		) AS mex_bb 
		WHERE ( 
			st_intersects(
				ST_Transform(
					ST_Simplify(
						(
							SELECT the_geom 
							FROM public.estados 
							WHERE entid = 16
						),
						0.0001
					),
					900913
				), 
				mex_bb.the_geom
				)
			)
),
y AS (

	SELECT 
		count(*) as scount 
	FROM grid_sp 
	WHERE ( 
		ST_Intersects( 
			(
				SELECT the_geom 
				FROM public.estados 
				WHERE entid = 16
			), 
			the_geom
			)
		)
	AND animalia||plantae||fungi||protoctista||prokaryotae @> ARRAY[49405]::integer[]
),
x AS (

	SELECT 
		reinovalido, 
		phylumdivisionvalido, 
		clasevalida, 
		ordenvalido,
		familiavalida, 
		generovalido, 
		epitetovalido, 
		w2.spid as spid, 
		w2.Nij as Nij, 
		w2.Nj as Nj 
	FROM sp_snib 
	INNER JOIN ( 
		SELECT 
			b.spid as spid, 
			b.nj as nj, 
			COALESCE(c.nij, 0) as nij 
			FROM (
				SELECT 
					a1.spids as spid, 
					count(a1) as nj  
				FROM (
					SELECT 
						unnest(aggr_array_cat(animalia||plantae||fungi||protoctista||prokaryotae)) as spids 
					FROM grid_sp 
					WHERE ( 
						ST_Intersects( 
							(
								SELECT the_geom 
								FROM public.estados 
								WHERE entid = 16
							), 
							the_geom
							)
						)
					) AS a1 GROUP BY spid
				) as b 
			FULL JOIN (
				SELECT 
					a2.spids as spid,
					count(a2) as nij 
				FROM (
					SELECT 
						unnest(aggr_array_cat(animalia||plantae||fungi||protoctista||prokaryotae)) as spids 
					FROM grid_sp 
					WHERE ( 
						ST_Intersects( 
							(
								SELECT the_geom 
								FROM public.estados 
								WHERE entid = 16
							), 
							the_geom
							)
						)
					AND animalia||plantae||fungi||protoctista||prokaryotae @> ARRAY[49405]::integer[] 
				) AS a2 
			GROUP BY spid
			) AS c 
			ON b.spid = c.spid
	) as w2 
	ON sp_snib.spid = w2.spid 
	AND sp_snib.spid <> 49405
)
	
SELECT  
	x.reinovalido, 
	x.phylumdivisionvalido, 
	x.clasevalida, 
	x.ordenvalido, 
	x.familiavalida, 
	x.generovalido, 
	x.epitetovalido, 
	x.spid, 
	x.nij, 
	x.nj, 
	y.scount as ni, 
	z.tcount as n, 
	get_epsilon(cast(x.nj as integer), 
				 cast(x.nij as integer), 
				 cast(y.scount as integer), 
				 cast(z.tcount as integer)) as epsilon, 
	ln(
		get_score(0.01, 
			cast(x.nj as integer), 
			cast(x.nij as integer), 
			cast(y.scount as integer), 
			cast(z.tcount as integer)
			)
		) as score 
FROM x,y,z 
ORDER BY epsilon					

