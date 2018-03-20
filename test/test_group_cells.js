function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe("======= RUNNING GLOBAL TEST: test_group_cells =======", function () {
    beforeEach(function () {
       console.log("\n======= Running individual test =======");
    });
    // importTest("\n======= TEST FILE: cells =======", './cells/cells');
    // importTest("\n======= TEST FILE: get_freq_celda_test =======", './cells/get_freq_celda_test');
    // importTest("\n======= TEST FILE: get_score_decil_test =======", './cells/get_score_decil_test');
    // importTest("\n======= TEST FILE: get_grid_species_test =======", './cells/get_grid_species_test');
    importTest("\n======= TEST FILE: get_cell_score_test =======", './cells/get_cell_score_test');
    after(function () {
        console.log("\n======= GLOBAL TEST FINISHED: test_group_cells  =======");
    });
});