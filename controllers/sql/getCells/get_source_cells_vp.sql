select array_agg(cell) as source_cells
from(
	select cell
	from ${tbl_process:raw}
	where iter = ${iter:raw} and tipo_valor = 'test' and sp_obj = TRUE
) as t1
group by true
/*select cell, animalia||plantae||fungi||protoctista||prokaryotae
	||bio001||bio002||bio003||bio004||bio005||bio006||bio006||bio008||bio009||bio010
	||bio011||bio012||bio013||bio014||bio015||bio016||bio017||bio018||bio019||bio010
	||bio021||bio022||bio023||bio024||bio025||bio026||bio027||bio028||bio029||bio020
	||bio031||bio032||bio033||bio034||bio035||bio036||bio037||bio038||bio039||bio030
	||bio041||bio042||bio043||bio044||bio045||bio046||bio047||bio048||bio049||bio040
	||bio051||bio052||bio053||bio054||bio055||bio057||bio058||bio059||bio050
	||bio061||bio062||bio064||bio065||bio066||bio067||bio068||bio069||bio060
	||bio071||bio072||bio073||bio075||bio076||bio077||bio078||bio079||bio070
	||bio081||bio082||bio083||bio084 as spids
from ${tbl_process:raw} as temp_tbl
join  ${res_grid_tbl:raw} as grid
on grid.${res_grid_column:raw} = cell 
where iter = ${iter:raw} and tipo_valor = 'test' and sp_obj = true
order by cell*/