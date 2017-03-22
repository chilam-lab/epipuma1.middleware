/*getMap sin filtros*/
WITH source AS (
	SELECT spid, $<res_celda:raw> as cells 
	FROM sp_snib 
	WHERE 
		spid = $<spid>		
		and especievalidabusqueda <> ''
),
target AS (
	SELECT  spid,
			$<res_celda:raw> as cells 
	FROM sp_snib 
	--WHERE clasevalida = 'Mammalia'
	$<where_config:raw>	 
	and especievalidabusqueda <> ''
	
	union
	
	SELECT  bid as spid,
			$<res_celda:raw> as cells 
	FROM raster_bins 
	$<where_config_raster:raw>	 
),
counts AS (
	SELECT 	target.spid,
			target.cells,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni
	FROM source,target
	where target.spid <> $<spid>
	and icount(target.cells) > $<min_occ:raw>
),
rawdata as (
	SELECT 	counts.cells,
			round( cast(  ln(   
			get_score(
				$<alpha>,
				cast(counts.nj as integer), 
				cast(counts.niyj as integer), 
				cast(counts.ni as integer), 
				cast($<N> as integer)
			)
		)as numeric), 2) as score
	FROM counts 
)
select unnest(cells) as gridid, sum(score) as tscore 
from rawdata
group by gridid
order by tscore desc
