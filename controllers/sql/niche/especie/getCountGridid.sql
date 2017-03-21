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
		$<coleccion:raw>
		cont
from gridid_sp
left join grid_20km_mx
on gridid_sp.gridid = grid_20km_mx.gridid
left join cont_spid
on grid_20km_mx.gridid = cont_spid.gridid 
order by cont desc
