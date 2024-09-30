using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using Adsp.Sdk.Util;

namespace Adsp.Platform.ScriptService.Services.Platform
{
  [SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
  internal sealed class FormSubmissionResult
  {
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("formDefinitionId")]
    public string? FormDefinitionId { get; set; }

    [JsonPropertyName("formId")]
    public string? FormId { get; set; }

    [JsonPropertyName("formData")]
    [JsonConverter(typeof(DictionaryJsonConverter))]
    public IDictionary<string, object?>? Data { get; set; }

    [JsonPropertyName("formFiles")]
    public IDictionary<string, string?>? Files { get; set; }

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

    [JsonPropertyName("submissionStatus")]
    public FormDisposition? SubmissionStatus { get; set; }
  }

  internal sealed class FormDisposition
  {
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }

    [JsonPropertyName("date")]
    public DateTime? Date { get; set; }

    [JsonPropertyName("securityClassification")]
    public SecurityClassificationType? SecurityClassification { get; set; }

  }

  internal sealed class User
  {
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }
  }

  [JsonConverter(typeof(JsonStringEnumConverter))]
  internal enum SecurityClassificationType
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
