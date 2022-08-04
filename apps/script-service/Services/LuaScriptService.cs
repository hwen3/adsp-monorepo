using System.Diagnostics.CodeAnalysis;
using System.Text;
using Adsp.Platform.ScriptService.Model;
using NLua;
using NLua.Exceptions;

namespace Adsp.Platform.ScriptService.Services;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
[SuppressMessage("Usage", "CA1031: Do not catch general exception types", Justification = "WIP: script error handling")]
internal class LuaScriptService : ILuaScriptService
{
  private readonly ILogger<LuaScriptService> _logger;
  public LuaScriptService(ILogger<LuaScriptService> logger)
  {
    _logger = logger;
  }

  public async Task<IEnumerable<object>> RunScript(ScriptDefinition definition, IDictionary<string, object?> inputs)
  {
    try
    {
      using var lua = new Lua();
      lua.State.Encoding = Encoding.UTF8;
      lua["script"] = definition.Script;
      lua["inputs"] = inputs;

      return lua.DoString(@"
        import = function () end

        local sandbox = require 'scripts/sandbox'
        return sandbox.run(script, { env = { inputs = inputs } })
      ");
    }
    catch (LuaScriptException e)
    {
      _logger.LogError(e, "Lua error encountered running script {Id}.", definition.Id);
    }
    catch (Exception e)
    {
      _logger.LogError(e, "Unknown error encountered running script {Id}.", definition.Id);
    }

    return Enumerable.Empty<object>();
  }
}
