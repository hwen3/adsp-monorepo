
using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SocketIOClient;

namespace Adsp.Sdk.Configuration;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
internal sealed class ConfigurationUpdateClient : IConfigurationUpdateClient, IAsyncDisposable
{
  private static readonly AdspId PushServiceId = AdspId.Parse("urn:ads:platform:push-service");
  private const string StreamId = "configuration-updates";
  private const string ConfigurationUpdatedEvent = "configuration-service:configuration-updated";

  private readonly ILogger<ConfigurationUpdateClient> _logger;
  private readonly IServiceDirectory _serviceDirectory;
  private readonly ITokenProvider _tokenProvider;
  private readonly IConfigurationService _configurationService;
  private readonly ITenantService _tenantService;
  private readonly string? _realm;
  public SocketIOWrapper? _client;

  public ConfigurationUpdateClient(
    ILogger<ConfigurationUpdateClient> logger,
    IServiceDirectory serviceDirectory,
    ITokenProvider tokenProvider,
    IConfigurationService configurationService,
    ITenantService tenantService,
    IOptions<AdspOptions> options,
    SocketIOWrapper? client = null
  )
  {
    _logger = logger;
    _serviceDirectory = serviceDirectory;
    _tokenProvider = tokenProvider;
    _configurationService = configurationService;
    _tenantService = tenantService;
    _realm = options.Value.Realm;
    _client = client;
  }

  public async Task Connect()
  {
    _client = await CreateSocketClient();

    try
    {
      await _client.ConnectAsync();
    }
    catch (Exception e)
    {
      _logger.LogError(e, "Error encountered connecting to socket.");
      throw;
    }
  }

  private async Task<SocketIOWrapper> CreateSocketClient()
  {
    var tenant = _realm != null ? await _tenantService.GetTenantByRealm(_realm) : null;

    var pushServiceUrl = await _serviceDirectory.GetServiceUrl(PushServiceId);
    var token = await _tokenProvider.GetAccessToken();

    if (_client == null)
    {
      _client = new SocketIOWrapper(
        pushServiceUrl,
        new SocketIOOptions
        {
          Query = new Dictionary<string, string> { { "stream", StreamId } },
          ExtraHeaders = new Dictionary<string, string> { { "Authorization", $"Bearer {token}" } }
        }
      );
    }

    _client.socketIO.OnConnected += (_s, _e) =>
    {
      _logger.LogInformation("Connected to stream for configuration updates at: {Url}", pushServiceUrl);
    };
    _client.socketIO.OnDisconnected += (_s, _e) =>
    {
      _logger.LogInformation("Disconnected from configuration update stream.");
    };
    _client.socketIO.OnError += (_s, e) =>
    {
      _logger.LogError("Error encountered in configuration update stream. {Msg}", e);
    };

    _client.On(ConfigurationUpdatedEvent, (response) =>
    {
      _logger.LogDebug("Received configuration update event from configuration updates stream.");

      var update = response.GetValue<ConfigurationUpdate>();
      _configurationService.ClearCached(
        AdspId.Parse($"urn:ads:{update.Payload!.Namespace}:{update.Payload!.Name}"),
        update.TenantId ?? tenant?.Id
      );
    });

    return _client;
  }

  public async ValueTask DisposeAsync()
  {
    var client = _client;
    if (client != null)
    {
      if (client.Connected())
      {
        await client.DisconnectAsync();
      }
      client.Dispose();
    }
  }
}
