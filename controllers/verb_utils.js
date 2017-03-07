var verbs_utils = {

	processBioFilters: function(tfilters_total, spid){

		var whereVar = "";
		var first_bio = true;
		var tfilters = [];

		for (var i = 0; i < tfilters_total.length; i++){
			if(tfilters_total[i].type == 4){
				tfilters.push(tfilters_total[i]);
			}
		}


		for (var i = 0; i < tfilters.length; i++){

			if (first_bio == true){
					
				// si existe mas de un elemento deben ir entre parentesis, ej: and (familiavalida = 'Felidae' or familiavalida = 'Canidae')
				if(tfilters.length > 1){
					whereVar = whereVar + " where sp_snib.spid <> " + spid + " and (" + tfilters[i].field + " = \'" + tfilters[i].value + "\'";
				}
				else{
					whereVar = whereVar + " where sp_snib.spid <> " + spid + " and " + tfilters[i].field + " = \'" + tfilters[i].value + "\'";	
				}
				
				first_bio = false;
			}
			else{
				whereVar = whereVar + " OR " + tfilters[i].field + " = \'" + tfilters[i].value + "\' ";
			}

		}

		// si existe mas de un elemento deben ir entre parentesis, ej: and (familiavalida = 'Felidae' or familiavalida = 'Canidae')
		if(tfilters.length > 1){
			whereVar = whereVar + ") ";
		}

		return whereVar;
	},

	processRasterFilters: function(tfilters_total, spid){

		var whereVar = "";
		var first_other = true;
		var tfilters = [];


		for (var i = 0; i < tfilters_total.length; i++){

			if(tfilters_total[i].type != 4){

				tfilters.push(tfilters_total[i]);

			}

		}


		for (var i = 0; i < tfilters.length; i++){

			if(tfilters[i].level == 0){

				if (first_other == true){

					if(tfilters[i].type == 5){

						whereVar = whereVar + " where type <> 0 ";

					}
					else{

						whereVar = whereVar + " where type = " + tfilters[i].type;

					}

					first_other = false;

				}
				else{

					if(tfilters[i].type == 5){

						whereVar = whereVar + " or type <> 0 ";

					}
					else{

						whereVar = whereVar + " or type = " + tfilters[i].type;

					}

				}

			}
			else if (tfilters[i].level == 1){

				if (first_other == true){

					whereVar = whereVar + " where layer = '" + tfilters[i].value + "'";

					first_other = false;

				}
				else{

					whereVar = whereVar + " OR layer = '" + tfilters[i].value + "'";

				}

			}
			else{

				if (first_other == true){

					whereVar = whereVar + " where bid = '" + tfilters[i].value + "'";

					first_other = false;

				}
				else{

					whereVar = whereVar + " OR bid = '" + tfilters[i].value + "'";

				}

			}


		}

		return whereVar;
	},

	processDateRecords: function(lim_inf, lim_sup, sfecha){

		var filterDates = "";

		// console.log(lim_inf);
		// console.log(lim_sup);
		// console.log(sfecha);

		if(lim_inf || sfecha === "false"){

			filterDates += "where (snib.especievalida = '' or snib.especievalida is null)  or ";

			if(lim_inf){
				filterDates +=  "(( EXTRACT( EPOCH FROM to_timestamp(fechacolecta, 'YYYY-MM--DD') ) * 1000 ) < " + lim_inf + " " +
							"or " + 
							"(EXTRACT(EPOCH FROM to_timestamp(fechacolecta, 'YYYY-MM--DD')) * 1000) > " + lim_sup + " ) ";
				if(sfecha === "false"){
					// console.log("Filtros y sin fecha");
					// los valores nulos y vacios de fechacolecta son menores al valor establecido en la condicion de tiempo anteior 
				}
				else{
					// console.log("Solo filtros");
					filterDates += " and (fechacolecta <> '' and fechacolecta is not null)  ";
				}
			}
			if(lim_inf == undefined && sfecha === "false"){
				// console.log("Solo registros sin fecha");
				filterDates += " (fechacolecta = '' or fechacolecta is null) ";
			}
		}

		// console.log(filterDates);

		return filterDates;
	},

	processTitleGroup: function(groupid, tfilters){


		var title_valor = "";


		if(groupid != undefined){

			// group_item = 0 ->> root
			if (tfilters[0].type == 4){
				title_valor = JSON.stringify({"title":"Grupo Bio " + groupid, "type": tfilters[0].type , "group_item": tfilters[0].group_item, "is_parent":true });
			}
			else if (tfilters[0].type == 0){
				title_valor = JSON.stringify({"title":"Grupo Abio " + groupid, "type": tfilters[0].type , "group_item": tfilters[0].group_item, "is_parent":true });
				// title_valor = "Grupo Abio " + groupid;
			}
			else { // if (tfilters[0].type == 1){
				title_valor = JSON.stringify({"title":"Grupo Topo " + groupid, "type": tfilters[0].type , "group_item": tfilters[0].group_item, "is_parent":true });
				// title_valor = "Grupo Abio " + groupid;
			}

		}
		else if (tfilters[0].value){

			// console.log("title: " + tfilters[0].value);
			// console.log("title: " + tfilters[0].label);
			// console.log(group_item);

			if (tfilters[0].type == 4){
				title_valor = JSON.stringify({"title":tfilters[0].value, "type":tfilters[0].type , "group_item": tfilters[0].group_item, "is_parent":false });
			}
			else{
				title_valor = JSON.stringify({"title":tfilters[0].label, "type":tfilters[0].type , "group_item": tfilters[0].group_item, "is_parent":false });
			}

		}

		// console.log("title_valor: " + title_valor);
		return JSON.parse(title_valor);

	},

	getColumns: function(issource, nivel){

		if(issource == 1){
			return "spid, reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda";
		}
		else{
			return "distinct " + nivel + " ";
		}

	}

}

module.exports = verbs_utils

