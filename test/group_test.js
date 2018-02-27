function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

// var common = require("./common");

describe("group_test", function () {
    beforeEach(function () {
       console.log("running group test");
    });
    importTest("specie", './specie/specie_info');
    importTest("raster", './raster/raster_info');
    after(function () {
        console.log("group tests finished");
    });
});