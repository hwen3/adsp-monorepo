using System.Text.Json.Serialization;
using Adsp.Platform.ScriptService.Model;
using Adsp.Platform.ScriptService.Services;
using Adsp.Sdk;
using Adsp.Sdk.Errors;
using Adsp.Sdk.Metrics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;

namespace Adsp.Platform.ScriptService.Controller;

[ApiController]
[Route("/script/v1")]
[JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
public class ScriptController : ControllerBase
{
  private const int TOKEN_INDEX = 7;

  private readonly ILogger<ScriptController> _logger;
  private readonly ITokenProvider _tokenProvider;
  private readonly ILuaScriptService _luaService;
  private readonly IConfigurationService _configurationService;

  public ScriptController(ILogger<ScriptController> logger, ITokenProvider tokenProvider, ILuaScriptService luaService, IConfigurationService configurationService)
  {
    _logger = logger;
    _tokenProvider = tokenProvider;
    _luaService = luaService;
    _configurationService = configurationService;
  }

  [HttpGet]
  [Route("scripts")]
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant, Roles = ServiceRoles.ScriptRunner)]
  public async Task<IEnumerable<ScriptDefinition>> GetScripts()
  {
    var configuration = await HttpContext.GetConfiguration<Dictionary<string, ScriptDefinition>, ScriptConfiguration>();

    return configuration?.Definitions.Values ?? Enumerable.Empty<ScriptDefinition>();
  }

  [HttpGet]
  [Route("scripts/{script?}")]
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant, Roles = ServiceRoles.ScriptRunner)]
  public async Task<ScriptDefinition> GetScript(string? script)
  {
    if (String.IsNullOrWhiteSpace(script))
    {
      throw new RequestArgumentException("script parameter cannot be null or empty.");
    }

    var configuration = await HttpContext.GetConfiguration<Dictionary<string, ScriptDefinition>, ScriptConfiguration>();
    if (configuration?.Definitions.TryGetValue(script, out ScriptDefinition? definition) != true)
    {
      throw new NotFoundException($"Script definition with ID '{script}' not found.");
    }

    return definition!;
  }

  [HttpPost]
  [Route("scripts/{script?}")]
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant)]
  public async Task<IEnumerable<object>> RunScript(string? script, [FromBody] RunScriptRequest request, [FromQuery] bool clearCache = false)
  {
    if (String.IsNullOrWhiteSpace(script))
    {
      throw new RequestArgumentException("script parameter cannot be null or empty.");
    }

    if (request == null)
    {
      throw new RequestArgumentException("request body cannot be null");
    }

    if (clearCache)
    {
      var tenant = await HttpContext.GetTenant();
      _configurationService.ClearCached(AdspId.Parse("urn:ads:platform:script-service"), tenant?.Id);
    }

    var configuration = await HttpContext.GetConfiguration<Dictionary<string, ScriptDefinition>, ScriptConfiguration>();
    if (configuration?.Definitions.TryGetValue(script, out ScriptDefinition? definition) != true || definition == null)
    {
      throw new NotFoundException($"Script definition with ID '{script}' not found.");
    }

    var user = HttpContext.GetAdspUser();
    if (!definition.IsAllowedUser(user))
    {
      throw new NotAllowedRunnerException(user);
    }

    var luaInputs = request.Inputs ?? new Dictionary<string, object?>();

    Func<Task<string>> getToken = definition.UseServiceAccount == true ?
      () => _tokenProvider.GetAccessToken() :
      () => Task.FromResult(HttpContext.Request.Headers[HeaderNames.Authorization].First()[TOKEN_INDEX..]);

    using (HttpContext.Benchmark("run-script-time"))
    {
      var outputs = await _luaService.RunScript(
        Guid.NewGuid(), user!.Tenant!.Id!, definition, luaInputs, getToken, request.CorrelationId, user
      );

      return outputs;
    }
  }

  [HttpPost]
  [Route("scripts")]
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant, Roles = ServiceRoles.ScriptRunner)]
  public async Task<IEnumerable<object>> TestScript([FromBody] RunScriptRequest request)
  {

    if (request == null)
    {
      throw new RequestArgumentException("request body cannot be null");
    }

    if (request.ScriptDefinition == null)
    {
      throw new RequestArgumentException("missing script attribute in the body");
    }

    if (request.Inputs == null)
    {
      throw new RequestArgumentException("missing inputs attribute in the body");
    }
    var user = HttpContext.GetAdspUser();

    Func<Task<string>> getToken = () => Task.FromResult(HttpContext.Request.Headers[HeaderNames.Authorization].First()[TOKEN_INDEX..]);
    using (HttpContext.Benchmark("run-script-time"))
    {

      Console.WriteLine(request.ScriptDefinition);

      var outputs = await _luaService.RunScript(
        Guid.NewGuid(), user!.Tenant!.Id!, request.ScriptDefinition, request.Inputs, getToken, request.CorrelationId, user
      );

      return outputs;
    }
  }
}
