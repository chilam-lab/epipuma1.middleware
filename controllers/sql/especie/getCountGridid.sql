with gridid_sp as(
	select spid, 
		unnest($<res_celda:raw>) as gridid
		--unnest(cells_16km) as gridid
	from sp_snib 
	--where spid in(27332)
	where spid in ($<spids:raw>)
	union
	select bid as spid, 
		unnest($<res_celda:raw>) as gridid
		--unnest(cells_16km) as gridid 
	from raster_bins 
	--where bid in(27332)
	where bid in ($<spids:raw>)
),
cont_spid as(
	select 	gridid, 
			sum(1) cont
	from gridid_sp
	group by gridid
	order by cont desc
)
select	distinct gridid_sp.gridid,
		$<coleccion:raw>
		--(animalia || plantae || fungi || protoctista || prokaryotae || bio01 || bio02 || bio03 || bio04 || bio05 || bio06 || bio07 || bio08 ||bio09 || bio10 || bio11 || bio12 || bio13 || bio14 || bio15 || bio16 ||bio17 || bio18 || bio19 ) as spids,
		cont
from gridid_sp
left join grid_16km_aoi
on gridid_sp.gridid = grid_16km_aoi.$<res_grid:raw>
--on gridid_sp.gridid = grid_16km_aoi.gridid_16km
left join cont_spid
on grid_16km_aoi.$<res_grid:raw> = cont_spid.gridid
--on grid_16km_aoi.gridid_16km = cont_spid.gridid
order by cont desc
