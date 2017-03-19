with gridid_sp as(
	select spid, 
		unnest(cells) as gridid 
	from sp_snib 
	--where spid in(33553, 33554)
	where spid in ($<spids:raw>)
	union
	select bid as spid, 
		unnest(cells) as gridid 
	from raster_bins 
	--where bid in(33553, 33554)
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
		--(animalia || plantae || fungi || protoctista || prokaryotae || bio01 || bio02 || bio03 || bio04 || bio05 || bio06 || bio07 || bio08 ||bio09 || bio10 || bio11 || bio12 || bio13 || bio14 || bio15 || bio16 ||bio17 || bio18 || bio19 || elevacion || pendiente || topidx) as spids,
		cont
from gridid_sp
left join grid_20km_mx
on gridid_sp.gridid = grid_20km_mx.gridid
left join cont_spid
on grid_20km_mx.gridid = cont_spid.gridid 
order by cont desc
