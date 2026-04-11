module.exports = {
  beforeScenario: function (scenario, events) {
    console.log(`Starting scenario: ${scenario.name}`);
  },
  
  afterScenario: function (scenario, events) {
    console.log(`Completed scenario: ${scenario.name}`);
  },
  
  beforeRequest: function (requestParams, context, ee, callback) {
    // Add any custom headers or request modifications here
    callback();
  }
};
