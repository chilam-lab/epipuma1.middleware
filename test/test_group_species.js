function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe("======= RUNNING GLOBAL TEST: test_group_species =======", function () {
    beforeEach(function () {
       console.log("\n======= Running individual test =======");
    });
    after(function () {
        console.log("\n======= GLOBAL TEST FINISHED: test_group_species  =======");
    });
});