/*getGeoRel sin filtros*/
select
	-- out_generovalido,
	out_spid as spid,
	out_especievalidabusqueda as especievalidabusqueda,
	round(avg(out_nij),2) as nij,
	round(avg(out_nj),2) as nj,
	-- avg(out_ni),
	avg(out_ni)::int as ni,  
 	avg(out_n)::int as n,
 	out_reinovalido as reinovalido,
 	out_phylumdivisionvalido as phylumdivisionvalido,
 	out_clasevalida as clasevalida,
 	out_ordenvalido as ordenvalido,
 	out_familiavalida as familiavalida,
	round(avg(out_epsilon),2) as epsilon,
	round(avg(out_score),2) as score		
from iteratevalidationprocess($<iterations>, $<spid>, $<N>, $<alpha>, $<min_occ>, array[$<discardedDeleted:raw>]::int[], '$<res_celda:raw>', '$<where_config:value>', '', 'bio')
-- from iteratevalidationprocess(5, 28923, 94544, 0.01, 0, array[]::int[], 'cells_16km', 'where clasevalida = ''Mammalia'' ', '', 'bio')
where out_spid is not null
group by 	out_spid,
			out_especievalidabusqueda,
			out_reinovalido, out_phylumdivisionvalido, out_clasevalida, out_ordenvalido, out_familiavalida
order by epsilon desc

