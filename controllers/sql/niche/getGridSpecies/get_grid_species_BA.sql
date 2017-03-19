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
			reinovalido,
			phylumdivisionvalido,
			clasevalida,
			ordenvalido,
			familiavalida,
			cells 
	FROM sp_snib 
	--WHERE clasevalida = 'Mammalia'
	$<where_config:raw>	 
	and especievalidabusqueda <> ''
),
counts AS (
	SELECT 	target.spid,
			target.generovalido,
			target.especievalidabusqueda,
			icount(source.cells & target.cells) AS niyj,
			icount(target.cells) AS nj,
			icount(source.cells) AS ni,
			$<N> as n,
			--14707 as n,
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
				)
			)as numeric), 2) as score
	FROM counts 
),
grid_spid as (
	SELECT gridid,
	unnest( $<categorias:raw>
			--animalia||plantae||fungi||protoctista||prokaryotae
			--||bio01||bio02||bio03||bio04||bio05||bio06|| bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19
			--||elevacion || pendiente || topidx
			--||mexca || mexce || mexco || mexk || mexmg || mexmo || mexna || mexph || mexras
			) as spid
	FROM grid_20km_mx 
	where ST_Intersects( the_geom, ST_GeomFromText('POINT($<long:raw> $<lat:raw>)',4326))
	--where ST_Intersects( the_geom, ST_GeomFromText('POINT(-103.271484375 23.017053740980547)',4326))
),
gridsps as ( 
	select  gridid, 
			spid, 
			especievalidabusqueda as nom_sp, 
			rango, 
			label 
	from ( 
		select 	gridid, 
				grid_spid.spid, 
				especievalidabusqueda, 
				''::text as rango, 
				''::text as label 
		from rawdata 
		join grid_spid 
		on grid_spid.spid = rawdata.spid 
	) as total 
	where 	especievalidabusqueda <> '' 
			--and rango <> ''  
	order by spid 
)
select 	gridid, 
		spid, 
		nom_sp, 
		rango, 
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
			'-'::text as rango,
			'-'::text as label, 
			ln( ni / ( n - ni::numeric) ) as score,
			ln( ni / ( n - ni::numeric) ) as apriori
	from rawdata limit 1)
) as tabla
order by score desc

