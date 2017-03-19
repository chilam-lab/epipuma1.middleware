/*getGridSpecies sin filtros*/
WITH source AS (
	SELECT spid, cells 
	FROM sp_snib 
	WHERE 
		spid = $<spid>	
		--spid = 33553
		and especievalidabusqueda <> ''
),
target AS (
	SELECT  cast('' as text) generovalido,
			case when type = 1 then
			layer
			else
			(label || ' ' || tag) 
			end as especievalidabusqueda,
			bid as spid,
			cast('' as text) reinovalido,
			cast('' as text) phylumdivisionvalido,
			cast('' as text) clasevalida,
			cast('' as text) ordenvalido,
			cast('' as text) familiavalida,
			cells 
	FROM raster_bins 
	$<where_config_raster:raw>
	--where layer = 'bio01'	 
),
counts AS (
	SELECT 	target.spid,
			target.generovalido,
			target.especievalidabusqueda,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni,
			target.reinovalido,
			target.phylumdivisionvalido,
			target.clasevalida,
			target.ordenvalido,
			target.familiavalida
	FROM source,target
	where 
	target.spid <> $<spid>
	--target.spid <> 33553
	and icount(target.cells) > $<min_occ:raw>
	--and icount(target.cells) > 0
),
rawdata as (
	SELECT 	counts.spid,
			--counts.source,
			--counts.generovalido,
			counts.especievalidabusqueda,
			counts.niyj as nij,
			counts.nj,
			counts.ni,
			$<N> as n,
			--14707 as n,
			counts.reinovalido,
			counts.phylumdivisionvalido,
			counts.clasevalida,
			counts.ordenvalido,
			counts.familiavalida,
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
),
grid_spid as (
	SELECT gridid,
	unnest( 
			-- NOTA DINAMICO: verificar cuando se envian las variables depediendo de los filtros rastersleccionados!!!!
			--animalia||plantae||fungi||protoctista||prokaryotae
			$<categorias:raw>
			--bio01||bio02||bio03||bio04||bio05||bio06|| bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19
			--||elevacion || pendiente || topidx
			--||mexca || mexce || mexco || mexk || mexmg || mexmo || mexna || mexph || mexras
			) as spid
	FROM grid_20km_mx 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	-- -96.339111328125 19.427484900299145	| score total: -0.72 | celda:588870   
	-- -96.3720703125 19.27718395845517 	: score total: -1.3 | celda:588869
	-- -96.712646484375 19.27718395845517	: -1.22
	--19.468922818336207, -96.383056640625
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
),
gridsps as ( 
	select 	gridid, 
			spid,
			especievalidabusqueda as nom_sp,
			rango,
			label 
	from ( 
		select 	gridid, 
				grid_spid.spid, 
				cast('' as text) as especievalidabusqueda, 
				especievalidabusqueda as rango, 
				especievalidabusqueda as label 
		from rawdata 
		join grid_spid 
		on grid_spid.spid = rawdata.spid
	--) 
	) as total 
	where 	rango <> ''  
	order by spid 
)
select gridsps.*,  score 
from gridsps  
join rawdata 
on gridsps.spid = rawdata.spid 
order by score desc
