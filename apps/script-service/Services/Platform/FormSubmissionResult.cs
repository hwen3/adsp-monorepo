using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using Adsp.Sdk.Util;

namespace Adsp.Platform.ScriptService.Services.Platform
{
  [SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
  public sealed class FormSubmissionResult
  {
    [JsonPropertyName("Id")]
    public string? Id { get; set; }
    [JsonPropertyName("formDefinitionId")]
    public string? FormDefinitionId { get; set; }
    [JsonPropertyName("FormId")]
    public string? FormId { get; set; }

    [SuppressMessage("Design", "CA2227:Collection properties should be read only", Justification = "Setter is needed to instantiate the object.")]
    [JsonPropertyName("FormData")]
    [JsonConverter(typeof(DictionaryJsonConverter))]
    public IDictionary<string, object?>? Data { get; set; } = new Dictionary<string, object?>();

    [SuppressMessage("Design", "CA2227:Collection properties should be read only", Justification = "Setter is needed to instantiate the object.")]
    [JsonPropertyName("formFiles")]
    [JsonConverter(typeof(DictionaryJsonConverter))]
    public IDictionary<string, object?>? Files { get; set; } = new Dictionary<string, object?>();

    [JsonPropertyName("createdBy")]
    public User? CreatedBy { get; set; }
    [JsonPropertyName("updatedBy")]
    public User? UpdatedBy { get; set; }
    [JsonPropertyName("created")]
    public DateTime? Created { get; set; }
    [JsonPropertyName("updated")]
    public DateTime? Updated { get; set; }
    [JsonPropertyName("disposition")]
    public FormDisposition? Disposition { get; set; }
  }


  public sealed class FormDisposition
  {
    [JsonPropertyName("status")]
    public string? Status { get; set; }
    [JsonPropertyName("reason")]
    public string? Reason { get; set; }
    [JsonPropertyName("date")]
    public DateTime? Date { get; set; }
  }

  public sealed class User
  {
    [JsonPropertyName("id")]
    public string? Id { get; set; }
    [JsonPropertyName("name")]
    public string? Name { get; set; }

  }

  public enum SecurityClassificationType
  {
    [JsonPropertyName("protected a")]
    ProtectedA,
    [JsonPropertyName("protected b")]
    ProtectedB,
    [JsonPropertyName("protected c")]
    ProtectedC,
    [JsonPropertyName("public")]
    Public
  }
}

