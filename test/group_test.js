function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

// var common = require("./common");

describe("group_test", function () {
    beforeEach(function () {
       console.log("running individual test");
    });
    importTest("cells", './cells/cell_info');
    importTest("model", './model/model');
    after(function () {
        console.log("group tests finished");
    });
});