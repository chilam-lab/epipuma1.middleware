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
	SELECT  generovalido,
			especievalidabusqueda,
			spid,
			cells,
			0 as tipo
	FROM sp_snib 
	--WHERE clasevalida = 'Mammalia'
	$<where_config:raw>	 
	and especievalidabusqueda <> ''
	union
	SELECT  cast('' as text) generovalido,
			case when type = 1 then
			layer
			else
			(label || ' ' || tag) 
			end as especievalidabusqueda,
			bid as spid,
			cells,
			1 as tipo
	FROM raster_bins 
	$<where_config_raster:raw>	 
	--where layer = 'bio01'	 
),
counts AS (
	SELECT 	target.spid,
			target.tipo,
			target.generovalido,
			target.especievalidabusqueda,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni,
			$<N> as n
	FROM source,target
	where 
	target.spid <> $<spid>
	--target.spid <> 33553
	and icount(target.cells) > $<min_occ:raw>
	--and icount(target.cells) > 0
),
rawdata as (
	SELECT 	counts.spid,
			counts.tipo,
			--counts.generovalido,
			counts.especievalidabusqueda,
			counts.niyj as nij,
			counts.nj,
			counts.ni,
			counts.n,
			round( cast(  ln(   
				get_score(
					$<alpha>,
					--0.01,
					cast(counts.nj as integer), 
					cast(counts.niyj as integer), 
					cast(counts.ni as integer), 
					cast(counts.n as integer)
					--cast(14707 as integer)
				)
			)as numeric), 2) as score
	FROM counts 
),
grid_spid as (
	SELECT gridid,
	unnest( 
			-- NOTA DINAMICO: verificar cuando se envian las variables depediendo de los filtros rastersleccionados!!!!
			--animalia||plantae||fungi||protoctista||prokaryotae||
			--bio01||bio02||bio03||bio04||bio05||bio06|| bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19
			$<categorias:raw>
			) as spid
	FROM grid_20km_mx 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
	-- -96.339111328125 19.427484900299145	| score total: -0.72 | celda:588870   
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-96.3720703125 19.27718395845517)',4326))
),
gridsps as ( 
	select 	gridid, 
			spid,
			especievalidabusqueda as nom_sp,
			label
	from ( 
		select 	gridid, 
				grid_spid.spid, 
				case when tipo = 0
				then especievalidabusqueda
				else ''
				end as especievalidabusqueda,
				case when tipo = 1
				then especievalidabusqueda
				else ''
				end as label
		from rawdata 
		join grid_spid 
		on grid_spid.spid = rawdata.spid
	--) 
	) as total 
	--where 	especievalidabusqueda <> ''  
	order by spid 
)
select 	gridid, 
		spid, 
		nom_sp, 
		label,
		score,
		apriori
from (
	select 	gridsps.*,  
			score, 
			ln( rawdata.ni / ( rawdata.n - rawdata.ni::numeric) ) as apriori
	from gridsps  
	join rawdata 
	on gridsps.spid = rawdata.spid
	union 
	-- se genera row para agregar apriori en caso de que la celda escogida no tenga valor
	( select 	0 as gridid, 
			0 as spid, 
			'-'::text as nom_sp,
			'-'::text as label, 
			ln( ni / ( n - ni::numeric) ) as score,
			ln( ni / ( n - ni::numeric) ) as apriori
	from rawdata limit 1)
) as tabla
order by score desc
