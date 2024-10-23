using Adsp.Platform.ScriptService.Services.Platform;
using Adsp.Platform.ScriptService.Services.Util;
using Adsp.Sdk;
using Adsp.Sdk.Events;
using NLua;
using RestSharp;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

namespace Adsp.Platform.ScriptService.Services;
internal class ScriptFunctions : IScriptFunctions
{
  private readonly AdspId _tenantId;
  private readonly IServiceDirectory _directory;
  private readonly Func<Task<string>> _getToken;
  private readonly Lua _lua;
  private readonly IRestClient _client;
  public const string FormSubmissionRequestError = "FormSubmissionRequestFailure";



  public ScriptFunctions(AdspId tenantId, IServiceDirectory directory, Func<Task<string>> getToken, Lua lua, IRestClient? client = null)
  {
    _tenantId = tenantId;
    _directory = directory;
    _getToken = getToken;
    _lua = lua;
    _client = client ?? new RestClient(new RestClientOptions { ThrowOnAnyError = true });
  }

  public virtual string? GeneratePdf(string templateId, string filename, object values)
  {
    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.PdfServiceId).Result;
    var requestUrl = new Uri(servicesUrl, "/pdf/v1/jobs");

    var token = _getToken().Result;
    var request = new RestRequest(requestUrl, Method.Post);
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    var generationRequest = new PdfGenerationRequest
    {
      TemplateId = templateId,
      FileName = filename
    };

    if (values is LuaTable table)
    {
      generationRequest.Data = table.ToDictionary();
    }
    else if (values is IDictionary<string, object> dictionary)
    {
      generationRequest.Data = dictionary;
    }
    else
    {
      throw new ArgumentException("values is not a recognized type.");
    }

    request.AddJsonBody(generationRequest);

    var result = _client.PostAsync<PdfGenerationResult>(request).Result;
    return result?.Id;
  }

  public IDictionary<string, object?>? GetConfiguration(string @namespace, string name)
  {
    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.ConfigurationServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/configuration/v2/configuration/{@namespace}/{name}/active");

    var token = _getToken().Result;
    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("orLatest", "true");
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    var result = _client.GetAsync<ConfigurationResult>(request).Result;
    return result?.Configuration;
  }

  public FormDataResult? GetFormData(string formId)
  {
    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.FormServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/form/v1/forms/{formId}/data");

    var token = _getToken().Result;
    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    var result = _client.GetAsync<FormDataResult>(request).Result;
    return result;
  }

  [SuppressMessage("Design", "CA1031:Do not catch general exception types", Justification = "Specific exceptions are not known and handled centrally.")]
  public virtual LuaTable? GetFormSubmission(string formId, string submissionId)
  {
    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.FormServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/form/v1/forms/{formId}/submissions/{submissionId}");

    var token = _getToken().Result;
    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");
    try
    {
      var submission = _client.GetAsync<string>(request).Result;
      if (submission == null) return null;
      var deserialized = JsonSerializer.Deserialize<FormSubmissionResult?>(submission);
      return deserialized?.ToLuaTable(_lua);
    }
    catch (Exception e)
    {
      string message = e.Message;
      return message.ToLuaTable(FormSubmissionRequestError, _lua);
    }
  }

  public virtual bool SendDomainEvent(string @namespace, string name, string? correlationId, IDictionary<string, object>? context = null, IDictionary<string, object>? payload = null)
  {
    var eventServiceUrl = _directory.GetServiceUrl(AdspPlatformServices.EventServiceId).Result;
    var requestUrl = new Uri(eventServiceUrl, $"/event/v1/events");
    var token = _getToken().Result;
    var body = new FullDomainEvent<IDictionary<string, object>>()
    {
      TenantId = _tenantId,
      Namespace = @namespace,
      Name = name,
      CorrelationId = correlationId,
      Context = context,
      Timestamp = DateTime.Now,
      Payload = payload ?? new Dictionary<string, object>()
    };

    var request = new RestRequest(requestUrl, Method.Post);
    request.AddJsonBody(body);
    request.AddHeader("Authorization", $"Bearer {token}");

    var result = _client.PostAsync(request).Result;
    return result.IsSuccessful;
  }


  public virtual DispositionResponse? DispositionFormSubmission(string formId, string submissionId, string dispositionStatus, string reason)
  {
    var formServiceUrl = _directory.GetServiceUrl(AdspPlatformServices.FormServiceId).Result;
    var requestUrl = new Uri(formServiceUrl, $"/form/v1/forms/{formId}/submissions/{submissionId}");
    var token = _getToken().Result;
    var body = new
    {
      dispositionStatus,
      dispositionReason = reason,
    };

    var request = new RestRequest(requestUrl, Method.Post);
    request.AddJsonBody(body);
    request.AddHeader("Authorization", $"Bearer {token}");
    request.AddQueryParameter("tenantId", _tenantId.ToString());

    var result = _client.PostAsync<DispositionResponse>(request).Result;
    return result;
  }


  public virtual object? HttpGet(string url)
  {
    var token = _getToken().Result;
    var request = new RestRequest(url, Method.Get);
    request.AddHeader("Authorization", $"Bearer {token}");

    var response = _client.GetAsync<IDictionary<string, object>>(request).Result;
    return response;
  }

  public virtual string? CreateTask(
    string queueNamespace, string queueName, string name,
    string? description = null, string? recordId = null, string? priority = null, LuaTable? context = null
  )
  {
    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.TaskServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/task/v1/queues/{queueNamespace}/{queueName}/tasks");

    var token = _getToken().Result;
    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    var generationRequest = new TaskCreationRequest
    {
      Name = name,
      Description = description,
      RecordId = recordId,
      Priority = priority,
      Context = context?.ToDictionary()
    };
    request.AddJsonBody(generationRequest);

    var result = _client.PostAsync<TaskCreationResult>(request).Result;
    return result?.Id;
  }

  public virtual IDictionary<string, object>? ReadValue(string @namespace, string name, int top = 10, string? after = null)
  {
    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.ValueServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/value/v1/{@namespace}/values/{name}");
    var token = _getToken().Result;

    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("top", top);
    request.AddQueryParameter("after", after);

    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    // Using generic IDictionary because the value service will return different key values and we
    // can't have specific json property names in our own class.
    var result = _client.GetAsync<IDictionary<string, object>>(request).Result;

    return result;

  }

  public virtual IDictionary<string, object?>? WriteValue(string @namespace, string name, object? value)
  {
    const string CONTEXT_KEY = "context";
    const string VALUE_KEY = "value";
    const string CORRELATION_ID_KEY = "correlationId";

    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.ValueServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/value/v1/{@namespace}/values/{name}");
    var token = _getToken().Result;

    var valueRequest = new ValueCreateRequest()
    {
      Namespace = @namespace,
      Name = name,
      Timestamp = DateTime.Now,
      Value = null,
      Context = null
    };

    if (value.GetType() == typeof(LuaTable))
    {
      var table = ((LuaTable)value);
      var dataValue = table.ToDictionary();

      if (!dataValue.ContainsKey(VALUE_KEY))
      {
        throw new ArgumentException("value is required.");
      }

      if (dataValue[VALUE_KEY].GetType() == typeof(Dictionary<string, object>))
      {
        valueRequest.Value = dataValue[VALUE_KEY] as Dictionary<string, object?>;
      }
      if (dataValue.ContainsKey(CONTEXT_KEY) && dataValue[CONTEXT_KEY].GetType() == typeof(Dictionary<string, object>))
      {
        valueRequest.Context = dataValue[CONTEXT_KEY] as Dictionary<string, object?> ?? new Dictionary<string, object?>();
      }

      valueRequest.CorrelationId = dataValue[CORRELATION_ID_KEY].ToString();
    }
    else if (value is IDictionary<string, object> dictionary)
    {
      var dataValue = value as IDictionary<string, object>;

      if (!dataValue.ContainsKey(VALUE_KEY))
      {
        throw new ArgumentException("value is required.");
      }

      if (dataValue[VALUE_KEY].GetType() == typeof(Dictionary<string, object>))
      {
        valueRequest.Value = dataValue[VALUE_KEY] as Dictionary<string, object?>;
      }
      if (dataValue.ContainsKey(CONTEXT_KEY) && dataValue[CONTEXT_KEY].GetType() == typeof(Dictionary<string, object>))
      {
        valueRequest.Context = dataValue[CONTEXT_KEY] as Dictionary<string, object?>;
      }

      valueRequest.CorrelationId = dataValue[CORRELATION_ID_KEY]?.ToString();
    }
    else
    {
      throw new ArgumentException("value is not a recognized type.");
    }

    var request = new RestRequest(requestUrl, Method.Post);
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");
    request.AddJsonBody(valueRequest);

    // Using generic IDictionary because the value service will return different key values and we
    // can't have specific json property names in our own class.
    var result = _client.PostAsync<IDictionary<string, object?>?>(request).Result;

    return result;
  }

}
