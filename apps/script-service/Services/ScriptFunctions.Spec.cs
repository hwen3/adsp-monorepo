using Moq;
using Xunit;
using Adsp.Sdk;
using Adsp.Platform.ScriptService.Services.Platform;
using NLua;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Adsp.Platform.ScriptService.Services;

public sealed class ScriptFunctionsTests : IDisposable
{
  private readonly Lua _lua;

  public ScriptFunctionsTests()
  {
    _lua = new Lua();
  }

  // Implement IDisposable for teardown (runs after each test)
  public void Dispose()
  {
    _lua.Dispose();
  }

  [Fact]
  public void ReturnsValidFormSubmission()
  {
    var FormServiceId = AdspId.Parse("urn:ads:platform:form-service");
    var FormId = "my-form";
    var SubmissionId = "my-submission";
    var endpoint = $"/form/v1/forms/{FormId}/submissions/{SubmissionId}";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(FormServiceId);
    var StubFunctions = new StubScriptFunctions(Tenant, ServiceDirectory, TestUtil.GetMockToken());

    var Expected = StubFunctions.GetFormSubmission(FormId, SubmissionId);
    using var RestClient = TestUtil.GetRestClient(FormServiceId, endpoint, HttpMethod.Get, Expected);
    var ScriptFunctions = new ScriptFunctions(FormServiceId, TestUtil.GetServiceUrl(FormServiceId), TestUtil.GetMockToken(), RestClient);
    var Actual = ScriptFunctions.GetFormSubmission(FormId, SubmissionId);
    Assert.Equal(SubmissionId, Actual?.id);
    Assert.Equal(FormId, Actual?.formId);
  }

  [Fact]
  public void ReturnsFormSubmissionNotFound()
  {
    var FormServiceId = AdspId.Parse("urn:ads:platform:form-service");
    var FormId = "my-form";
    var SubmissionId = "my-submission";
    var endpoint = $"/form/v1/forms/{FormId}/submissions/invalid-submission-id";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(FormServiceId);
    var StubFunctions = new StubScriptFunctions(Tenant, ServiceDirectory, TestUtil.GetMockToken());

    var Expected = StubFunctions.GetFormSubmission(FormId, SubmissionId);
    using var RestClient = TestUtil.GetRestClient(FormServiceId, endpoint, HttpMethod.Get, Expected);
    var ScriptFunctions = new ScriptFunctions(Tenant, TestUtil.GetServiceUrl(FormServiceId), TestUtil.GetMockToken(), RestClient);
    var Actual = ScriptFunctions.GetFormSubmission(FormId, SubmissionId);
    Assert.Null(Actual);
  }

  [Fact]
  public void CanSendDomainEvent()
  {
    var EventServiceId = AdspId.Parse("urn:ads:platform:event-service");
    var endpoint = "/event/v1/events";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(EventServiceId);

    using var RestClient = TestUtil.GetRestClientToInspectBody(
      EventServiceId,
      endpoint,
      HttpMethod.Post,
      true,
      (r) =>
      {
        var result = r;
        var body = JsonConvert.DeserializeObject<JToken>(r)?.ToDictionary();
        Assert.NotNull(body);
        Assert.IsType<Dictionary<string, object>>(body);
        var payload = ((Dictionary<string, object>)body)["payload"];
        Assert.Equal("Bob Bing", ((Dictionary<string, object>)payload)["name"]);
      }
    );
    var ScriptFunctions = new ScriptFunctions(EventServiceId, TestUtil.GetServiceUrl(EventServiceId), TestUtil.GetMockToken(), RestClient);
    _lua.DoString("payload = { name = 'Bob Bing', emailAddress = 'bob@bob.com' }");
    LuaTable payload = (LuaTable)_lua["payload"];
    var Actual = ScriptFunctions.SendDomainEvent("namespace", "name", null, null, payload);
    Assert.True(Actual);
  }

  [Fact]
  public void CanWriteComplexValue()
  {
    var ValueServiceId = AdspId.Parse("urn:ads:platform:value-service");
    var _namespace = "my-space";
    var name = "my-test";
    var endpoint = $"/value/v1/{_namespace}/values/{name}";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(ValueServiceId);

    using var RestClient = TestUtil.GetRestClientToInspectBody(ValueServiceId, endpoint, HttpMethod.Post, null,
      (b) =>
      {
        var body = (Dictionary<string, object>)JsonConvert.DeserializeObject<JToken>(b).ToDictionary();
        Assert.Equal("my-space", body["namespace"]);
        Assert.Equal("my-test", body["name"]);
        Assert.Equal("", body["correlationId"]);
        var context = ((Dictionary<string, object>)body["context"]);
        Assert.True(context.Count == 0);
        var index = (Dictionary<string, object>)((Dictionary<string, object>)body["value"])["index"];
        Assert.Equal("test-Index", index["1"]);
      }
);
    var ScriptFunctions = new ScriptFunctions(Tenant, TestUtil.GetServiceUrl(ValueServiceId), TestUtil.GetMockToken(), RestClient);
    _lua.DoString("theValue = { value = {index = {'test-Index'}}, context={}, correlationId='' }");
    LuaTable value = (LuaTable)_lua["theValue"];
    var Actual = ScriptFunctions.WriteValue(_namespace, name, value);
    Assert.Null(Actual);
  }

}
