using Xunit;
using Adsp.Sdk;
using NLua;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Adsp.Platform.ScriptService.Services.Util;

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
        var result = r!;
        var body = JsonConvert.DeserializeObject<JToken>(result)?.ToDictionary();
        Assert.NotNull(body);
        Assert.IsType<Dictionary<string, object>>(body);
        var payload = body!["payload"];
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
        var body = JsonConvert.DeserializeObject<JToken>(b!)?.ToDictionary();
        Assert.Equal("my-space", body!["namespace"]);
        Assert.Equal("my-test", body["name"]);
        Assert.Equal("", body["correlationId"]);
        var context = body["context"];
        Assert.NotNull(context);
        var foo = context!.GetType();
        Assert.True(context!.GetType() == typeof(Dictionary<string, object>));
        Assert.True(((IDictionary<string, object>)context).Count == 0);
        var value = body["value"];
        Assert.NotNull(value);
        Assert.True(value!.GetType() == typeof(Dictionary<string, object>));
        Assert.True(((Dictionary<string, object?>)value).Count == 1);
        var index = ((Dictionary<string, object?>)value)["index"];
        Assert.NotNull(index);
        Assert.True(index!.GetType() == typeof(List<object>));
        Assert.True(((List<object>)index)[0].GetType() == typeof(string));
      }
);
    var ScriptFunctions = new ScriptFunctions(Tenant, TestUtil.GetServiceUrl(ValueServiceId), TestUtil.GetMockToken(), RestClient);
    _lua.DoString("theValue = { value = {index = {'test-Index'}}, context={}, correlationId='' }");
    LuaTable value = (LuaTable)_lua["theValue"];
    var Actual = ScriptFunctions.WriteValue(_namespace, name, value);
    Assert.Null(Actual);
  }

  [Fact]
  public void ReadsValueCorrectly()
  {
    var ValueServiceId = AdspId.Parse("urn:ads:platform:value-service");
    var _namespace = "mySpace";
    var name = "myTest";
    var endpoint = $"/value/v1/{_namespace}/values/{name}";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(ValueServiceId);

    var expected = new Dictionary<string, object>()
    {
      [_namespace] = new Dictionary<string, object>()
      {
        [name] = new[]
        {
          new Dictionary<string, object>()
          {
            ["context"] = "{}",
            ["correlationId"] = "bob",
            ["value"] = new Dictionary<string, object>()
            {
              ["index"] = new[] {"idx1", "idx2"}
            }
          }
        }
      }
    };

    using var RestClient = TestUtil.GetRestClient(ValueServiceId, endpoint, HttpMethod.Get, expected);
    var ScriptFunctions = new ScriptFunctions(ValueServiceId, TestUtil.GetServiceUrl(ValueServiceId), TestUtil.GetMockToken(), RestClient);
    var actual = ScriptFunctions.ReadValue(_namespace, name, 1);
    Assert.NotNull(actual);
    Assert.True(actual!.GetType() == typeof(Dictionary<string, object>));
    Assert.True(actual![_namespace].GetType() == typeof(Dictionary<string, object>));
    var myTest = ((Dictionary<string, object?>)actual![_namespace])[name];
    Assert.True(myTest!.GetType() == typeof(List<object>));
    var value = ((List<object>)myTest)[0];
    Assert.True(value.GetType() == typeof(Dictionary<string, object>));
    Assert.Equal("bob", ((Dictionary<string, object>)value)["correlationId"]);
    var valueValue = ((Dictionary<string, object>)value)["value"];
    Assert.True(valueValue.GetType() == typeof(Dictionary<string, object>));
    var index = ((Dictionary<string, object>)valueValue)["index"];
    Assert.True(index.GetType() == typeof(List<object>));
    var items = (List<object>)index;
    Assert.True(items[0].GetType() == typeof(string));
    Assert.Equal("idx1", (string)items[0]);
  }
}
