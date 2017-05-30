/*getMap sin filtros*/
WITH source AS (
	SELECT spid, 
		--$<res_celda:raw> as cells
		($<res_celda:raw> - array[$<discardedDeleted:raw>]::int[])  as cells 
	FROM sp_snib 
	WHERE 
		spid = $<spid>
		--spid = 33553		
		and especievalidabusqueda <> ''
),
target AS (
	SELECT  bid as spid,
			$<res_celda:raw> as cells
			--($<res_celda:raw> - array[$<discardedDeleted:raw>]::int[])  as cells 
	FROM raster_bins 
	$<where_config_raster:raw>
	--where layer = 'bio01'	 
),
counts AS (
	SELECT 	target.spid,
			target.cells,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni
	FROM source,target
	where 
	target.spid <> $<spid>
	--target.spid <> 33553
	and icount(target.cells) > $<min_occ:raw>
	--and icount(target.cells) > 0
),
rawdata as (
	SELECT 	--counts.spid,
			counts.cells,
			round( cast(  ln(   
				get_score(
					$<alpha>,
					--0.01,
					cast(counts.nj as integer), 
					cast(counts.niyj as integer), 
					cast(counts.ni as integer), 
					cast($<N> as integer)
					--cast(14707 as integer)
				)
			)as numeric), 2) as score
	FROM counts 
)
select unnest(cells) as gridid, sum(score) as tscore 
from rawdata
group by gridid
order by tscore desc

--celda:588870 score: -0.72
