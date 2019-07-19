function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe("======= RUNNING GLOBAL TEST: test_group_model =======", function () {
    beforeEach(function () {
       console.log("\n======= Running individual test =======");
    });
    //importTest("\n======= TEST FILE: get_geo_rel_test =======", './model/get_geo_rel_test');
    //importTest("\n======= TEST FILE: get_freq_test =======", './model/get_freq_test');
    //importTest("\n======= TEST FILE: scores_sp_covar_test =======", './model/scores_sp_covar_test');
    after(function () {
        console.log("\n======= GLOBAL TEST FINISHED: test_group_model  =======");
    });
});