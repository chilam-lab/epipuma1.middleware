var verbs_utils = {

	processBioFilters: function(tfilters, spid){

		// console.log("processFilters");
		// console.log(tfilters);
		// console.log(tfilters.length);

		var whereVar = "";
		var first_bio = true;


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

	}
	
}

module.exports = verbs_utils