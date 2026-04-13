using Microsoft.AspNetCore.Mvc;
using SendGrid;
using SendGrid.Helpers.Mail;
using System.Net;


namespace HerdFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> SendFeedback([FromBody] FeedbackDto dto)
        {
            var apiKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
            if (string.IsNullOrEmpty(apiKey))
                return StatusCode(500, "SendGrid API key not found");

            var client = new SendGridClient(apiKey);

            var from = new EmailAddress("no-reply@herdflow.app", "HerdFlow");
            var to = new EmailAddress("natebrungardt15@gmail.com");

            var subject = $"[{dto.AppName}] New Feedback";
            var submittedAtUtc = DateTime.UtcNow;
            var submittedAtDisplay = submittedAtUtc.ToString("yyyy-MM-dd HH:mm:ss 'UTC'");

            var plainTextContent =
$"New Feedback - {dto.AppName}\n\n" +
$"Name: {dto.Name}\n" +
$"Email: {dto.Email}\n" +
$"{(string.IsNullOrWhiteSpace(dto.Company) ? "" : $"Company: {dto.Company}\n")}" +
$"Submitted At (UTC): {submittedAtDisplay}\n\n" +
$"Message:\n{dto.Message}";

            var htmlContent =
$"""
<div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
  <h2 style="margin: 0 0 16px; font-size: 22px;">New Feedback - {WebUtility.HtmlEncode(dto.AppName)}</h2>
  <table style="border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 4px 12px 4px 0; font-weight: 700; vertical-align: top;">Name</td>
      <td style="padding: 4px 0;">{WebUtility.HtmlEncode(dto.Name)}</td>
    </tr>
    <tr>
      <td style="padding: 4px 12px 4px 0; font-weight: 700; vertical-align: top;">Email</td>
      <td style="padding: 4px 0;">{WebUtility.HtmlEncode(dto.Email)}</td>
    </tr>
    {(string.IsNullOrWhiteSpace(dto.Company)
        ? ""
        : $"""
    <tr>
      <td style="padding: 4px 12px 4px 0; font-weight: 700; vertical-align: top;">Company</td>
      <td style="padding: 4px 0;">{WebUtility.HtmlEncode(dto.Company)}</td>
    </tr>
    """)}
    <tr>
      <td style="padding: 4px 12px 4px 0; font-weight: 700; vertical-align: top;">Submitted At</td>
      <td style="padding: 4px 0;">{submittedAtDisplay}</td>
    </tr>
  </table>
  <div style="margin-bottom: 8px; font-weight: 700;">Message</div>
  <div style="padding: 16px; border: 1px solid #d1d5db; border-radius: 12px; background: #f9fafb; white-space: pre-wrap;">{WebUtility.HtmlEncode(dto.Message)}</div>
</div>
""";

            var msg = MailHelper.CreateSingleEmail(
                from,
                to,
                subject,
                plainTextContent,
                htmlContent
            );
            msg.SetReplyTo(new EmailAddress(dto.Email, dto.Name));
            var response = await client.SendEmailAsync(msg);

            var body = await response.Body.ReadAsStringAsync();
            Console.WriteLine($"Response Body: {body}");

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, "Failed to send email");
            }

            return Ok();
        }
    }

    public class FeedbackDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string AppName { get; set; } = null!;

        [System.ComponentModel.DataAnnotations.Required]
        public string Name { get; set; } = null!;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.EmailAddress]
        public string Email { get; set; } = null!;

        public string? Company { get; set; }

        [System.ComponentModel.DataAnnotations.Required]
        public string Message { get; set; } = null!;
    }
}
