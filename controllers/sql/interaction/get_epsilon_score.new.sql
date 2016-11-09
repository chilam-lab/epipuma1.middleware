WITH area_of_interest AS (
    SELECT the_geom 
    FROM estados 
    WHERE entid = ANY(ARRAY[16, 9])
),
regional_bounding_box AS (
    SELECT ST_Transform(
        ST_Envelope(
            ST_Collect(
                ARRAY(
                    SELECT the_geom 
                    FROM area_of_interest
                )
            )
        ),
    900913)
    AS bbox
),
regional_grid AS (
    SELECT gridid, the_geom 
    FROM grid_mex
    WHERE ST_Intersects(
        (
            SELECT bbox 
            FROM regional_bounding_box
        ),
        the_geom
    )
),
regional_geometries AS (
    SELECT ST_Transform(
        ST_Union(
            ARRAY(
                SELECT ST_Simplify(the_geom, 0.0001) 
                FROM area_of_interest
            )
        ),
    900913
    ) AS the_geom 
),
regional_geom_vs_grid AS (
    SELECT gridid, the_geom
    FROM regional_grid
    WHERE ST_intersects(
        (
            SELECT the_geom
            FROM regional_geometries
        ),
        the_geom
    )
),
total_cells_in_aoi AS (
    SELECT count(*) AS tcount
    FROM regional_geom_vs_grid
),
species_grid_in_aoi AS (
    SELECT
        gridid,
        (
        animalia||
        plantae||
        fungi||
        protoctista||
        prokaryotae
        ) AS spids
    FROM grid_sp
    WHERE grid_sp.gridid IN (
        SELECT gridid FROM regional_geom_vs_grid
    )
),
species_target_species_grid_in_aoi AS (
    SELECT 
        gridid,
        UNNEST(spids) AS spid
    FROM species_grid_in_aoi
    WHERE 49405 = ANY(spids)
),
species_in_aoi AS (
    SELECT 
        gridid,
        UNNEST(spids) AS spid
    FROM species_grid_in_aoi
),
species_counts_in_aoi AS (
    SELECT 
        spid,
        COUNT(*) AS nj
    FROM species_in_aoi
    GROUP BY spid
),
species_target_counts AS (
    SELECT
        spid,
        COUNT(*) AS nij
    FROM species_target_species_grid_in_aoi
    GROUP BY spid
),
counts_by_species_and_target AS (
    SELECT 
        a.spid,
        a.nj,
        COALESCE(b.nij, 0) AS nij
    FROM (
        species_counts_in_aoi AS a
        FULL JOIN
        species_target_counts AS b
        ON a.spid = b.spid
    )
),
counts_and_info AS (
    SELECT
        reinovalido,
        phylumdivisionvalido,
        clasevalida,
        ordenvalido,
        familiavalida,
        generovalido,
        epitetovalido,
        r.spid AS spid,
        nij,
        nj
    FROM sp_snib AS l
    INNER JOIN counts_by_species_and_target AS r
    ON l.spid = r.spid
),
species_counts AS (
    SELECT nj AS scount
    FROM counts_and_info
    WHERE spid = 49405
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
    y.scount AS ni,
    z.tcount AS n,
    get_epsilon(cast(x.nj AS integer), 
                cast(x.nij AS integer), 
                cast(y.scount AS integer), 
                cast(z.tcount AS integer)) AS epsilon, 
    ln(
        get_score(0.01,
            cast(x.nj AS integer),
            cast(x.nij AS integer),
            cast(y.scount AS integer),
            cast(z.tcount AS integer)
            )
        ) AS score
FROM 
    counts_and_info AS x,
    species_counts AS y,
    total_cells_in_aoi AS z
WHERE
    x.spid <> 49405
ORDER BY epsilon
